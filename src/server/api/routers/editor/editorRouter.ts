import { getAIChatResponse } from "@/server/ai/openai";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

const chatMessageSchema = z.object({
  type: z.enum(["assistant", "user"]),
  content: z.string(),
});

export const editorRouter = createTRPCRouter({
  submitMessage: workspaceProtectedProcedure
    .input(z.object({
      messages: z.array(chatMessageSchema).min(1),
    }))
    .mutation(async ({ input }) => {
      // Transform messages to OpenAI format
      const openAiMessages: ChatCompletionMessageParam[] = input.messages.map(msg => ({
        role: msg.type,
        content: msg.content
      }));

      // Define response schema
      const responseSchema = z.object({
        response: z.string()
      });

      // Get AI response
      const aiResponse = await getAIChatResponse({
        messages: openAiMessages,
        schemaOutput: responseSchema
      });

      return {
        message: {
          type: "assistant" as const,
          content: aiResponse.response
        }
      };
    }),
});
