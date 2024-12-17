import { getAIChatResponse } from "@/server/ai/openai";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { warehouseMetadataSchema } from "@/types/connections";
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
      warehouseMetadata: warehouseMetadataSchema
    }))
    .mutation(async ({ input }) => {
      // For now, just log the editor content and warehouse metadata
      console.log("Editor content received:", input.editorContent);
      console.log("Warehouse metadata received:", input.warehouseMetadata);

      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a SQL assistant for the AI-first SQL IDE called "Yerve".

The user is writing SQL code in the editor.
They may ask you a question, or they may ask you to modify the code.
Please respond appropriately based on the user's request.

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
});
