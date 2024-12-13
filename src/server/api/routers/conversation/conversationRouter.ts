import { viewDataSchema } from "@/components/charting/chartTypes";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { conversationTable, dashboardItemsTable, googleAnalyticsReportTable, messageItemsTable, messageTable, plotViewTable } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createGoogleAnalyticsResponse } from "./createGoogleAnalyticsResponse";

export const conversationRouter = createTRPCRouter({
  createConversation: workspaceProtectedProcedure
    .input(z.object({
      initialUserMessage: z.string(),
      propertyId: z.string(),
      questionType: z.enum(["report", "segmentation"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .insert(conversationTable)
        .values({
          name: "Untitled Conversation",
          workspaceId: ctx.activeWorkspaceId,
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
        workspaceId: ctx.activeWorkspaceId,
        propertyId: input.propertyId,
        conversationId: conversation.id,
        userMessage: input.initialUserMessage,
        questionType: input.questionType,
      });

      return {
        conversationId: conversation.id,
        userMessageId: newUserMessage.id,
        assistantMessageId: newAssistantMessage.id,
        suggestedUserResponses,
      };
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

      const messageItems = await ctx.db
        .select()
        .from(messageItemsTable)
        .where(
          inArray(messageItemsTable.messageId, messages.map(m => m.id))
        );

      return messages.map(message => ({
        message,
        messageItems: messageItems.filter(item => item.messageId === message.id)
      }));
    }),

  addMessage: workspaceProtectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        text: z.string(),
        propertyId: z.string(),
        questionType: z.enum(["report", "segmentation"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        newUserMessage,
        newAssistantMessage,
        suggestedUserResponses,
      } = await createGoogleAnalyticsResponse({
        workspaceId: ctx.activeWorkspaceId,
        propertyId: input.propertyId,
        conversationId: input.conversationId,
        userMessage: input.text,
        questionType: input.questionType,
      });

      return {
        userMessageId: newUserMessage.id,
        assistantMessageId: newAssistantMessage.id,
        suggestedUserResponses,
      };
    }),

  getMessageItemPlotView: workspaceProtectedProcedure
    .input(z.object({ messageItemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const plotViews = await ctx.db
        .select({
          plotView: plotViewTable,
        })
        .from(messageItemsTable)
        .innerJoin(
          plotViewTable,
          eq(messageItemsTable.plotViewId, plotViewTable.id)
        )
        .where(and(
          eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
          eq(messageItemsTable.id, input.messageItemId),
        ))
        .limit(1);

      return plotViews[0]?.plotView ?? null;
    }),

  setMessageItemPlotView: workspaceProtectedProcedure
    .input(
      z.object({
        messageItemId: z.string().uuid(),
        viewData: viewDataSchema.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current message item to check if it has a plotViewId
      const [messageItem] = await db
        .select()
        .from(messageItemsTable)
        .where(eq(messageItemsTable.id, input.messageItemId));

      if (!messageItem) {
        throw new Error("Message item not found");
      }

      // If viewData is null, we want to remove the plot view
      if (input.viewData === null) {
        if (messageItem.plotViewId) {
          // Update message item to remove reference
          await db
            .update(messageItemsTable)
            .set({ plotViewId: null })
            .where(eq(messageItemsTable.id, input.messageItemId));

          // Delete the existing plot view
          await db
            .delete(plotViewTable)
            .where(and(
              eq(plotViewTable.id, messageItem.plotViewId),
              eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
            ));
        }
        return null;
      }

      if (messageItem.plotViewId) {
        // Update existing plot view
        const [updatedPlotView] = await db
          .update(plotViewTable)
          .set({ viewData: input.viewData })
          .where(and(
            eq(plotViewTable.id, messageItem.plotViewId),
            eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
          ))
          .returning();

        return updatedPlotView;
      } else {
        // Create new plot view
        const [newPlotView] = await db
          .insert(plotViewTable)
          .values({
            workspaceId: ctx.activeWorkspaceId,
            viewData: input.viewData,
          })
          .returning();

        if (!newPlotView) {
          throw new Error("Failed to create plot view");
        }

        // Update message item with new plot view reference
        await db
          .update(messageItemsTable)
          .set({ plotViewId: newPlotView.id })
          .where(eq(messageItemsTable.id, input.messageItemId));

        return newPlotView;
      }
    }),

  saveMessageItemToDashboard: workspaceProtectedProcedure
    .input(
      z.object({
        messageItemId: z.string().uuid(),
        dashboardId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get message item with its references
      const [messageItem] = await db
        .select()
        .from(messageItemsTable)
        .where(and(
          eq(messageItemsTable.id, input.messageItemId),
          // eq(messageItemsTable.workspaceId, ctx.activeWorkspaceId),
        ));

      if (!messageItem) {
        throw new Error("Message not found");
      }

      if (!messageItem.plotViewId || !messageItem.googleAnalyticsReportId) {
        throw new Error("Message must have both a plot view and Google Analytics report");
      }

      // Get the original plotView
      const [originalPlotView] = await db
        .select()
        .from(plotViewTable)
        .where(and(
          eq(plotViewTable.id, messageItem.plotViewId),
          eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
        ));

      if (!originalPlotView) {
        throw new Error("Plot view not found");
      }

      // Get the original GA report
      const [originalGAReport] = await db
        .select()
        .from(googleAnalyticsReportTable)
        .where(and(
          eq(googleAnalyticsReportTable.id, messageItem.googleAnalyticsReportId),
          eq(googleAnalyticsReportTable.workspaceId, ctx.activeWorkspaceId),
        ));

      if (!originalGAReport) {
        throw new Error("Google Analytics report not found");
      }

      // Clone the plot view
      const [newPlotView] = await db
        .insert(plotViewTable)
        .values({
          workspaceId: ctx.activeWorkspaceId,
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
          workspaceId: ctx.activeWorkspaceId,
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
          workspaceId: ctx.activeWorkspaceId,
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
