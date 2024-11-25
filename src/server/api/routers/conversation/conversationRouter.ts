import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { conversationTable, messageTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const conversationRouter = createTRPCRouter({
  getConversation: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.db
        .select()
        .from(conversationTable)
        .where(eq(conversationTable.id, input.conversationId));

      return conversations[0] ?? null;
    }),

  listConversationMessages: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select()
        .from(messageTable)
        .where(eq(messageTable.conversationId, input.conversationId));

      return messages;
    }),

  addMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [message] = await ctx.db
        .insert(messageTable)
        .values({
          conversationId: input.conversationId,
          text: input.text,
          role: "user",
        })
        .returning();

      if (!message) {
        throw new Error("Failed to add message");
      }

      return {
        messageId: message.id,
      };
    }),
});
