import { viewDataSchema } from "@/components/charting/chartTypes";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { conversationTable, dashboardItemsTable, googleAnalyticsReportTable, messageTable, plotViewTable } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createGoogleAnalyticsResponse } from "./createGoogleAnalyticsResponse";

export const conversationRouter = createTRPCRouter({
  createConversation: workspaceProtectedProcedure
    .input(z.object({ initialUserMessage: z.string() }))
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
      const {
        newUserMessage,
        newAssistantMessage,
        suggestedUserResponses,
      } = await createGoogleAnalyticsResponse({
        workspaceId: ctx.activeWorkspaceId,
        conversationId: input.conversationId,
        userMessage: input.text,
      });

      return {
        userMessageId: newUserMessage.id,
        assistantMessageId: newAssistantMessage.id,
        suggestedUserResponses,
      };
    }),

  getMessagePlotView: workspaceProtectedProcedure
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
        .where(and(
          eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
          eq(messageTable.id, input.messageId),
          eq(messageTable.workspaceId, ctx.activeWorkspaceId),
        ))
        .limit(1);

      return plotViews[0]?.plotView ?? null;
    }),

  setMessagePlotView: workspaceProtectedProcedure
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
        .where(and(
          eq(messageTable.id, input.messageId),
          eq(messageTable.workspaceId, ctx.activeWorkspaceId),
        ));

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
            .where(and(
              eq(messageTable.id, input.messageId),
              eq(messageTable.workspaceId, ctx.activeWorkspaceId),
            ));

          // Delete the existing plot view
          await db
            .delete(plotViewTable)
            .where(and(
              eq(plotViewTable.id, message.plotViewId),
              eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
            ));
        }
        return null;
      }

      if (message.plotViewId) {
        // Update existing plot view
        const [updatedPlotView] = await db
          .update(plotViewTable)
          .set({ viewData: input.viewData })
          .where(and(
            eq(plotViewTable.id, message.plotViewId),
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

        // Update message with new plot view reference
        await db
          .update(messageTable)
          .set({ plotViewId: newPlotView.id })
          .where(and(
            eq(messageTable.id, input.messageId),
            eq(messageTable.workspaceId, ctx.activeWorkspaceId),
          ));

        return newPlotView;
      }
    }),

  saveMessageToDashboard: workspaceProtectedProcedure
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
        .where(and(
          eq(messageTable.id, input.messageId),
          eq(messageTable.workspaceId, ctx.activeWorkspaceId),
        ));

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
        .where(and(
          eq(plotViewTable.id, message.plotViewId),
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
          eq(googleAnalyticsReportTable.id, message.googleAnalyticsReportId),
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
