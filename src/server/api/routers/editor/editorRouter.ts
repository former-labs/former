import { getEditorSelectionContent } from "@/app/(main)/editor/_components/editor/editorStore";
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
          knowledgeSources: z.array(z.string().uuid()).optional(),
        })
      ).min(1),
      editorContent: z.string(),
      editorSelection: z.object({
        startLineNumber: z.number(),
        startColumn: z.number(),
        endLineNumber: z.number(),
        endColumn: z.number(),
      }).nullable(),
      databaseMetadata: databaseMetadataSchema,
      knowledge: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        query: z.string(),
        workspaceId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }))
    }))
    .mutation(async ({ input }) => {
      // For now, just log the editor content and database metadata
      console.log("Editor content received:", input.editorContent);
      console.log("Editor selection received:", input.editorSelection);
      console.log("Database metadata received:", input.databaseMetadata);
      console.log("Knowledge base items received:", input.knowledge);

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

When generating SQL code, you should copy their code style.

${formatDatabaseMetadata(input.databaseMetadata)}

As a reference, the user has provided some example queries that have been used in the past on the same schema.
You should refer to these when writing your own SQL code.

${formatKnowledge(input.knowledge)}

The user's current SQL code in their editor is below:
\`\`\`sql
${input.editorContent}
\`\`\`

${input.editorSelection && `
The user has also highlighted a section of the code in their editor.
The request they are making is likely related to this highlighted code, so you should take this into account.
\`\`\`sql
${getEditorSelectionContent({
  editorSelection: input.editorSelection,
  editorContent: input.editorContent
})}
\`\`\`
`}

Respond in Markdown format.
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
          response: z.string().describe("The response to the user's request, in Markdown format."),
          knowledgeSources: z.array(z.string()).describe(`
The IDs of the knowledge sources that were used to generate the response.

If you wrote some SQL and used some knowledge queries to help you, include them here.

For example, if you were asked for "the total revenue for each product" for an ecommerce database, you might want 
to include references to knowledge queries that contained revenue calculations if you used them in your own queries.

If you did not use any knowledge sources, return an empty array.
          `)
        }),
      });

      return {
        message: {
          type: "assistant" as const,
          content: aiResponse.response,
          knowledgeSources: aiResponse.knowledgeSources,
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
        model: "gpt-4o-mini",
        messages: [systemMessage],
        schemaOutput: z.object({
          sql: z.string().describe("The final SQL code with changes applied. Output as pure SQL without any Markdown \`\`\` formatting.")
        }),
      });

      return aiResponse.sql;
    }),

  inlineEdit: workspaceProtectedProcedure
    .input(z.object({
      userMessage: z.string(),
      editorContent: z.string(),
      editorSelection: z.object({
        startLineNumber: z.number(),
        startColumn: z.number(),
        endLineNumber: z.number(),
        endColumn: z.number(),
      }).nullable(),
      databaseMetadata: databaseMetadataSchema,
      knowledge: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        query: z.string(),
        workspaceId: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
      }))
    }))
    .mutation(async ({ input }) => {
      // For now, just log the editor content and database metadata
      console.log("User message received:", input.userMessage);
      console.log("Editor content received:", input.editorContent);
      console.log("Editor selection received:", input.editorSelection);
      console.log("Database metadata received:", input.databaseMetadata);
      console.log("Knowledge base items received:", input.knowledge);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant for the AI-first SQL IDE called "Yerve".

The user is writing SQL code in the editor.
They have asked you to edit the code in their editor.
Please respond with the entire SQL code with the follow change applied:

<USER_REQUEST>
${input.userMessage}
</USER_REQUEST>

To help you write queries, you must adhere to the below database schema.
Do not generate SQL code that is not for the provided database schema.

If they persist and ask you to write it regardless, you can generate it, however you should include
comments in places where you are unsure of the schema.

When generating SQL code, you should copy their code style.

${formatDatabaseMetadata(input.databaseMetadata)}

As a reference, the user has provided some example queries that have been used in the past on the same schema.
You should refer to these when writing your own SQL code.

${formatKnowledge(input.knowledge)}

The user's current SQL code in their editor is below:
\`\`\`sql
${input.editorContent}
\`\`\`

${input.editorSelection && `
The user has also highlighted a section of the code in their editor.
The request they are making should only apply to this highlighted code, so you should not modify any other code.
\`\`\`sql
${getEditorSelectionContent({
  editorSelection: input.editorSelection,
  editorContent: input.editorContent
})}
\`\`\`
`}

Respond in Markdown format.
        `
      }

      // Get AI response
      const aiResponse = await getAIChatResponse({
        messages: [
          systemMessage,
        ],
        schemaOutput: z.object({
          newEditorContent: z.string().describe(`
The entire raw SQL code in the editor with the change applied.
Do not surround the SQL code with \`\`\` formatting.

Make sure you don't modify the SQL in any way except to satisfy the user's request.
Try to keep whitespace the same across all the lines, do not add or remove any newlines.
`)
        }),
      });

      return aiResponse.newEditorContent;
    }),

  getAutocomplete: workspaceProtectedProcedure
    .input(z.object({
      editorContent: z.string(),
      editorContentBeforeCursor: z.string(),
      databaseMetadata: databaseMetadataSchema,
    }))
    .mutation(async ({ input }) => {
      /*
        TODO: Add more assistance values to help the AI do less processing.
      */
      const editorContentAfterCursor = input.editorContent.slice(input.editorContentBeforeCursor.length);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are autocompleting SQL code.

To help you write queries, you must adhere to the below database schema.
Do not generate SQL code that is not for the provided database schema.

${formatDatabaseMetadata(input.databaseMetadata)}

The current editor content is:
\`\`\`sql
${input.editorContent}
\`\`\`

The editor content before the cursor is:
\`\`\`sql
${input.editorContentBeforeCursor}
\`\`\`

The editor content after the cursor is:
\`\`\`sql
${editorContentAfterCursor}
\`\`\`

You need to generate an autocomplete by predicting what characters are likely to proceed the cursor.
Output only the predicted characters, with no additional formatting or explanation.

Do not autocomplete code that exists after the cursor in the current editor content.
Your job it to think of new SQL code that will likely follow the cursor and will fit before code that exists after the cursor.

Make sure you handle newlines and whitespace carefully.
Look for trailing newlines and whitespace in the content before the cursor.

Cursor is at the start of a newline: ${input.editorContentBeforeCursor.endsWith("\n") || input.editorContentBeforeCursor === ""}
Cursor is at the start of a word: ${/\s$/.test(input.editorContentBeforeCursor) || input.editorContentBeforeCursor === ""}
Cursor is at the end of a line: ${editorContentAfterCursor.startsWith("\n") || editorContentAfterCursor === ""}
        `
      }

      const aiResponse = await getAIChatResponse({
        model: "gpt-4o-mini",
        messages: [systemMessage],
        schemaOutput: z.object({
          completion: z.string().describe(`\
The predicted characters that should follow the cursor.
In most cases, this is a fraction of a single line.
If you are highly certain you can output more than 1 line.

If the user is likely in the middle of a typing code, you should return a completion.
However, if the user is at the end of a valid statement and doesn't need completion, you should return an empty string.

Do not autocomplete new comments unless the user is already typing a comment.

Do not autocomplete purely whitespace.
\
`)
        }),
      });

      return aiResponse.completion;
    }),
});

const formatDatabaseMetadata = (metadata: DatabaseMetadata): string => {
  // TODO: Probs just get the CREATE statements for everything? Bc we need foreign keys and stuff like that.
  // SQL just works as a schema definition language.
  return `\
<DATABASE_SCHEMA>
${JSON.stringify(metadata, null, 2)}
</DATABASE_SCHEMA>\
`;
};

const formatKnowledge = (knowledge: Array<{
  id: string;
  name: string;
  description: string;
  query: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}>): string => {
  return `\
<EXAMPLE_QUERIES>
${knowledge.map((knowledge, index) => `
<EXAMPLE_QUERY_${index + 1}>
ID: ${knowledge.id}
Title: ${knowledge.name}
Description: ${knowledge.description}

\`\`\`sql
${knowledge.query}
\`\`\`
</EXAMPLE_QUERY_${index + 1}>
`).join("\n")}
</EXAMPLE_QUERIES>\
`;
};
