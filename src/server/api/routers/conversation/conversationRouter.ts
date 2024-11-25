import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { conversationTable, googleAnalyticsReportTable, messageTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createGoogleAnalyticsResponse } from "./createGoogleAnalyticsResponse";

export const conversationRouter = createTRPCRouter({
  createConversation: publicProcedure
    .input(z.object({ initialUserMessage: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .insert(conversationTable)
        .values({
          name: "Untitled Conversation",
        })
        .returning();

      if (!conversation) {
        throw new Error("Failed to create conversation");
      }

      const {
        newUserMessage,
        newAssistantMessage,
        suggestedUserResponses,
      } = await createGoogleAnalyticsResponse({
        conversationId: conversation.id,
        userMessage: input.initialUserMessage,
      });

      return {
        conversationId: conversation.id,
        userMessageId: newUserMessage.id,
        assistantMessageId: newAssistantMessage.id,
        suggestedUserResponses,
      };
    }),

  getConversation: publicProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.db
        .select()
        .from(conversationTable)
        .where(eq(conversationTable.id, input.conversationId));

      return conversations[0] ?? null;
    }),

  listConversationMessages: publicProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select()
        .from(messageTable)
        .where(eq(messageTable.conversationId, input.conversationId))
        .orderBy(messageTable.createdAt);

      return messages;
    }),

  getGoogleAnalyticsReport: publicProcedure
    .input(z.object({ googleAnalyticsReportId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db
        .select()
        .from(googleAnalyticsReportTable)
        .where(eq(googleAnalyticsReportTable.id, input.googleAnalyticsReportId));

      return reports[0] ?? null;
    }),

  addMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        text: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        newUserMessage,
        newAssistantMessage,
        suggestedUserResponses,
      } = await createGoogleAnalyticsResponse({
        conversationId: input.conversationId,
        userMessage: input.text,
      });

      return {
        userMessageId: newUserMessage.id,
        assistantMessageId: newAssistantMessage.id,
        suggestedUserResponses,
      };
    }),
});
