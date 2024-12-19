import { getAIChatResponse } from "@/server/ai/openai";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import type { DatabaseMetadata } from "@/types/connections";
import { databaseMetadataSchema } from "@/types/connections";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";


export const editorRouter = createTRPCRouter({
  submitMessage: workspaceProtectedProcedure
    .input(z.object({
      messages: z.array(
        z.object({
          type: z.enum(["assistant", "user"]),
          content: z.string(),
        })
      ).min(1),
      editorContent: z.string(),
      editorSelection: z.object({
        startLineNumber: z.number(),
        startColumn: z.number(),
        endLineNumber: z.number(),
        endColumn: z.number(),
      }).nullable(),
      databaseMetadata: databaseMetadataSchema
    }))
    .mutation(async ({ input }) => {
      // For now, just log the editor content and database metadata
      console.log("Editor content received:", input.editorContent);
      console.log("Editor selection received:", input.editorSelection);
      console.log("Database metadata received:", input.databaseMetadata);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant for the AI-first SQL IDE called "Yerve".

The user is writing SQL code in the editor.
They may ask you a question, or they may ask you to modify the code.
Please respond appropriately based on the user's request.

To help you write queries, you must adhere to the below database schema.
Do not generate SQL code that is not for the provided database schema.

If the user refers to an object that does not in the provided database schema (called the AI schema context),
suggest that they should check it is included in the AI schema context using the checkboxes in the schema explorer.

If they persist and ask you to write it regardless, you can generate it, however you should include
comments in places where you are unsure of the schema.

<DATABASE_SCHEMA>
${formatDatabaseMetadata(input.databaseMetadata)}
</DATABASE_SCHEMA>

Respond in Markdown format.

The user's SQL code is below:
\`\`\`sql
${input.editorContent}
\`\`\`
        `
      }


      // Transform messages to OpenAI format
      const openAiMessages: ChatCompletionMessageParam[] = input.messages.map(msg => ({
        role: msg.type,
        content: msg.content
      }));

      // Get AI response
      const aiResponse = await getAIChatResponse({
        messages: [
          systemMessage,
          ...openAiMessages
        ],
        schemaOutput: z.object({
          response: z.string().describe("The response to the user's request, in Markdown format.")
        }),
      });

      return {
        message: {
          type: "assistant" as const,
          content: aiResponse.response
        }
      };
    }),

  applyChange: workspaceProtectedProcedure
    .input(z.object({
      editorContent: z.string(),
      applyContent: z.string()
    }))
    .mutation(async ({ input }) => {
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant. You will apply the provided changes to the SQL code.
Please output only the final SQL code with the changes applied to the original SQL code.

If the changes only apply to a subsection of the SQL code, please ensure you contain the full code in your response
and modify only the relevant part of the code.

Feel free to use SQL comments to act as shorthand for sections of the code you are not modifying.
e.g. -- Existing query that does X goes here

Original SQL code:
\`\`\`sql
${input.editorContent}
\`\`\`

Changes to apply:
\`\`\`sql
${input.applyContent}
\`\`\`
        `
      }

      const aiResponse = await getAIChatResponse({
        messages: [systemMessage],
        schemaOutput: z.object({
          sql: z.string().describe("The final SQL code with changes applied. Output as pure SQL without any Markdown \`\`\` formatting.")
        }),
      });

      return aiResponse.sql;
    }),
});

const formatDatabaseMetadata = (metadata: DatabaseMetadata): string => {
  // TODO: Probs just get the CREATE statements for everything? Bc we need foreign keys and stuff like that.
  // SQL just works as a schema definition language.
  return JSON.stringify(metadata, null, 2);
};
