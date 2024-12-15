import type { WarehouseMetadata } from "@/contexts/DataContext";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { conversationTable, messageTable } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const conversationRouter = createTRPCRouter({
  createConversation: workspaceProtectedProcedure
    .input(z.object({
      initialUserMessage: z.string(),
      integrationId: z.string(),
      warehouseMetadata: z.custom<WarehouseMetadata>(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Create conversation
        const [conversation] = await tx
          .insert(conversationTable)
          .values({
            name: "Untitled Conversation",
            workspaceId: ctx.activeWorkspaceId,
          })
          .returning();

        if (!conversation) {
          throw new Error("Failed to create conversation");
        }

        // Create user message
        const [userMessage] = await tx
          .insert(messageTable)
          .values({
            conversationId: conversation.id,
            workspaceId: ctx.activeWorkspaceId,
            role: "user",
            text: input.initialUserMessage,
          })
          .returning();

        // Create assistant message
        const [assistantMessage] = await tx
          .insert(messageTable)
          .values({
            conversationId: conversation.id,
            workspaceId: ctx.activeWorkspaceId,
            role: "assistant",
            text: "Hello! How can I help you today?", // Replace with actual AI response
          })
          .returning();

        return {
          conversationId: conversation.id,
          userMessageId: userMessage?.id,
          assistantMessageId: assistantMessage?.id,
        };
      });
    }),

  getConversation: workspaceProtectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.db
        .select()
        .from(conversationTable)
        .where(and(
          eq(conversationTable.id, input.conversationId),
          eq(conversationTable.workspaceId, ctx.activeWorkspaceId),
        ));

      return conversations[0] ?? null;
    }),

  listConversationMessages: workspaceProtectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select()
        .from(messageTable)
        .where(and(
          eq(messageTable.conversationId, input.conversationId),
          eq(messageTable.workspaceId, ctx.activeWorkspaceId),
        ))
        .orderBy(messageTable.createdAt);

      return messages;
    }),

  addMessage: workspaceProtectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        text: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // Create user message
        const [userMessage] = await tx
          .insert(messageTable)
          .values({
            conversationId: input.conversationId,
            workspaceId: ctx.activeWorkspaceId,
            role: "user",
            text: input.text,
          })
          .returning();

        // Create assistant message
        const [assistantMessage] = await tx
          .insert(messageTable)
          .values({
            conversationId: input.conversationId,
            workspaceId: ctx.activeWorkspaceId,
            role: "assistant",
            text: "I received your message.", // Replace with actual AI response
          })
          .returning();

        return {
          userMessageId: userMessage?.id,
          assistantMessageId: assistantMessage?.id,
        };
      });
    }),
});
