import { viewDataSchema } from "@/components/charting/chartTypes";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { conversationTable, dashboardItemsTable, googleAnalyticsReportTable, messageTable, plotViewTable } from "@/server/db/schema";
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

  getMessagePlotView: publicProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const plotViews = await ctx.db
        .select({
          plotView: plotViewTable,
        })
        .from(messageTable)
        .innerJoin(
          plotViewTable,
          eq(messageTable.plotViewId, plotViewTable.id)
        )
        .where(eq(messageTable.id, input.messageId))
        .limit(1);

      return plotViews[0]?.plotView ?? null;
    }),

  setMessagePlotView: publicProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
        viewData: viewDataSchema.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current message to check if it has a plotViewId
      const [message] = await db
        .select()
        .from(messageTable)
        .where(eq(messageTable.id, input.messageId));

      if (!message) {
        throw new Error("Message not found");
      }

      // If viewData is null, we want to remove the plot view
      if (input.viewData === null) {
        if (message.plotViewId) {
          // Update message to remove reference
          await db
            .update(messageTable)
            .set({ plotViewId: null })
            .where(eq(messageTable.id, input.messageId));

          // Delete the existing plot view
          await db
            .delete(plotViewTable)
            .where(eq(plotViewTable.id, message.plotViewId));
        }
        return null;
      }

      if (message.plotViewId) {
        // Update existing plot view
        const [updatedPlotView] = await db
          .update(plotViewTable)
          .set({ viewData: input.viewData })
          .where(eq(plotViewTable.id, message.plotViewId))
          .returning();

        return updatedPlotView;
      } else {
        // Create new plot view
        const [newPlotView] = await db
          .insert(plotViewTable)
          .values({ viewData: input.viewData })
          .returning();

        if (!newPlotView) {
          throw new Error("Failed to create plot view");
        }

        // Update message with new plot view reference
        await db
          .update(messageTable)
          .set({ plotViewId: newPlotView.id })
          .where(eq(messageTable.id, input.messageId));

        return newPlotView;
      }
    }),

  saveMessageToDashboard: publicProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
        dashboardId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get message with its references
      const [message] = await db
        .select()
        .from(messageTable)
        .where(eq(messageTable.id, input.messageId));

      if (!message) {
        throw new Error("Message not found");
      }

      if (!message.plotViewId || !message.googleAnalyticsReportId) {
        throw new Error("Message must have both a plot view and Google Analytics report");
      }

      // Get the original plotView
      const [originalPlotView] = await db
        .select()
        .from(plotViewTable)
        .where(eq(plotViewTable.id, message.plotViewId));

      if (!originalPlotView) {
        throw new Error("Plot view not found");
      }

      // Get the original GA report
      const [originalGAReport] = await db
        .select()
        .from(googleAnalyticsReportTable)
        .where(eq(googleAnalyticsReportTable.id, message.googleAnalyticsReportId));

      if (!originalGAReport) {
        throw new Error("Google Analytics report not found");
      }

      // Clone the plot view
      const [newPlotView] = await db
        .insert(plotViewTable)
        .values({
          viewData: originalPlotView.viewData,
        })
        .returning();

      if (!newPlotView) {
        throw new Error("Failed to clone plot view");
      }

      // Clone the GA report
      const [newGAReport] = await db
        .insert(googleAnalyticsReportTable)
        .values({
          title: originalGAReport.title,
          description: originalGAReport.description,
          reportParameters: originalGAReport.reportParameters,
        })
        .returning();

      if (!newGAReport) {
        throw new Error("Failed to clone Google Analytics report");
      }

      // Create the dashboard item
      const [dashboardItem] = await db
        .insert(dashboardItemsTable)
        .values({
          dashboardId: input.dashboardId,
          gridX: 0,
          gridY: 0,
          gridWidth: 6,
          gridHeight: 4,
          plotViewId: newPlotView.id,
          googleAnalyticsReportId: newGAReport.id,
        })
        .returning();

      if (!dashboardItem) {
        throw new Error("Failed to create dashboard item");
      }

      return dashboardItem;
    }),
});
