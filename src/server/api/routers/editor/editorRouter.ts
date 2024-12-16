import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
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
      const lastMessage = input.messages[input.messages.length - 1];
      if (!lastMessage) {
        throw new Error("Empty list of messages provided.");
      }

      return {
        message: {
          type: "assistant" as const,
          content: lastMessage.content.toUpperCase(),
        }
      };
    }),
});
