import type { DashboardGridItemType, DashboardType } from "@/app/(main)/dashboard/[dashboardId]/dashboardTypes";
import { dashboardSchema } from "@/app/(main)/dashboard/[dashboardId]/dashboardTypes";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { dashboardItemsTable, dashboardTable, googleAnalyticsReportTable, plotViewTable } from "@/server/db/schema";
import { executeGoogleAnalyticsReport as executeGA, verveGa4AnalyticsDataClient } from "@/server/googleAnalytics/googleAnalytics";
import { googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const dashboardRouter = createTRPCRouter({
  createDashboard: workspaceProtectedProcedure
    .input(z.object({
      dashboardTitle: z.string().min(1, "Dashboard title is required")
    }))
    .mutation(async ({ ctx, input }) => {
      const [dashboard] = await ctx.db
        .insert(dashboardTable)
        .values({
          workspaceId: ctx.activeWorkspaceId,
          title: input.dashboardTitle,
          description: null,
        })
        .returning();

      if (!dashboard) {
        throw new Error("Failed to create dashboard");
      }

      return {
        dashboardId: dashboard.id,
      };
    }),

  listDashboards: workspaceProtectedProcedure.query(async ({ ctx }) => {
    const dashboards = await ctx.db
      .select()
      .from(dashboardTable)
      .where(eq(dashboardTable.workspaceId, ctx.activeWorkspaceId))
      .orderBy(dashboardTable.title);

    return dashboards;
  }),

  getDashboard: workspaceProtectedProcedure
    .input(z.object({ dashboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const dashboard = await ctx.db.query.dashboardTable.findFirst({
        where: and(
          eq(dashboardTable.id, input.dashboardId),
          eq(dashboardTable.workspaceId, ctx.activeWorkspaceId),
        ),
      });

      if (!dashboard) {
        throw new Error("Dashboard not found");
      }

      return dashboard;
    }),

  getDashboardDetails: workspaceProtectedProcedure
    .input(z.object({
      dashboardId: z.string().uuid()
    }))
    .query(async ({ ctx, input }): Promise<DashboardType> => {
      const dashboard = await ctx.db.query.dashboardTable.findFirst({
        where: and(
          eq(dashboardTable.id, input.dashboardId),
          eq(dashboardTable.workspaceId, ctx.activeWorkspaceId),
        ),
      });

      if (!dashboard) {
        throw new Error("Dashboard not found");
      }

      const dashboardItems = await ctx.db
        .select({
          id: dashboardItemsTable.id,
          gridX: dashboardItemsTable.gridX,
          gridY: dashboardItemsTable.gridY,
          gridWidth: dashboardItemsTable.gridWidth,
          gridHeight: dashboardItemsTable.gridHeight,
          plotView: plotViewTable,
          googleAnalyticsReport: googleAnalyticsReportTable
        })
        .from(dashboardItemsTable)
        .leftJoin(
          plotViewTable,
          eq(dashboardItemsTable.plotViewId, plotViewTable.id)
        )
        .innerJoin(
          googleAnalyticsReportTable,
          eq(dashboardItemsTable.googleAnalyticsReportId, googleAnalyticsReportTable.id)
        )
        .where(and(
          eq(dashboardItemsTable.dashboardId, input.dashboardId),
          eq(dashboardItemsTable.workspaceId, ctx.activeWorkspaceId),
          eq(googleAnalyticsReportTable.workspaceId, ctx.activeWorkspaceId),
          eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
        ));

      const items: DashboardGridItemType[] = dashboardItems.map(item => ({
        localId: item.id,
        dashboardItem: {
          gridX: item.gridX,
          gridY: item.gridY,
          gridWidth: item.gridWidth,
          gridHeight: item.gridHeight,
        },
        plotView: item.plotView ? {
          viewData: item.plotView.viewData
        } : null,
        googleAnalyticsReport: {
          title: item.googleAnalyticsReport.title,
          description: item.googleAnalyticsReport.description,
          reportParameters: item.googleAnalyticsReport.reportParameters
        }
      }));

      return {
        id: dashboard.id,
        title: dashboard.title,
        description: dashboard.description,
        items
      };
    }),

  executeGoogleAnalyticsReport: workspaceProtectedProcedure
    .input(z.object({
      reportParameters: googleAnalyticsReportParametersSchema,
    }))
    .mutation(async ({ input }) => {
      try {
        // Hardcoded to ours for now
        const propertyId = "447821713";

        const result = await executeGA({
          parameters: input.reportParameters,
          propertyId,
          analyticsDataClient: verveGa4AnalyticsDataClient,
        });
        return {
          success: true as const,
          data: result,
        };
      } catch (error) {
        console.log(error);
        return {
          success: false as const,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    }),

  updateDashboard: workspaceProtectedProcedure
    .input(z.object({
      dashboardId: z.string().uuid(),
      dashboard: dashboardSchema
    }))
    .mutation(async ({ ctx, input }) => {
      // Get existing dashboard items to find referenced reports and plot views
      const existingItems = await db
        .select({
          plotViewId: dashboardItemsTable.plotViewId,
          googleAnalyticsReportId: dashboardItemsTable.googleAnalyticsReportId,
        })
        .from(dashboardItemsTable)
        .where(and(
          eq(dashboardItemsTable.dashboardId, input.dashboardId),
          eq(dashboardItemsTable.workspaceId, ctx.activeWorkspaceId),
        ));

      // Delete all existing dashboard items
      await db
        .delete(dashboardItemsTable)
        .where(and(
          eq(dashboardItemsTable.dashboardId, input.dashboardId),
          eq(dashboardItemsTable.workspaceId, ctx.activeWorkspaceId),
        ));

      // Delete referenced plot views
      for (const item of existingItems) {
        if (item.plotViewId) {
          await db
            .delete(plotViewTable)
            .where(and(
              eq(plotViewTable.id, item.plotViewId),
              eq(plotViewTable.workspaceId, ctx.activeWorkspaceId),
            ));
        }
      }

      // Delete referenced GA reports
      for (const item of existingItems) {
        await db
          .delete(googleAnalyticsReportTable)
          .where(and(
            eq(googleAnalyticsReportTable.id, item.googleAnalyticsReportId),
            eq(googleAnalyticsReportTable.workspaceId, ctx.activeWorkspaceId),
          ));
      }

      // Update dashboard title and description
      await db
        .update(dashboardTable)
        .set({
          title: input.dashboard.title,
          description: input.dashboard.description,
        })
        .where(and(
          eq(dashboardTable.id, input.dashboardId),
          eq(dashboardTable.workspaceId, ctx.activeWorkspaceId),
        ));

      // Create new items
      for (const item of input.dashboard.items) {
        let newPlotViewId: string | null = null;

        if (item.plotView) {
          // Create plot view if it exists
          const [newPlotView] = await ctx.db
            .insert(plotViewTable)
            .values({
              workspaceId: ctx.activeWorkspaceId,
              viewData: item.plotView.viewData,
            })
            .returning();

          if (!newPlotView) {
            throw new Error("Failed to create plot view");
          }

          newPlotViewId = newPlotView.id;
        }

        // Create GA report
        const [newGAReport] = await ctx.db
          .insert(googleAnalyticsReportTable)
          .values({
            workspaceId: ctx.activeWorkspaceId,
            title: item.googleAnalyticsReport.title,
            description: item.googleAnalyticsReport.description,
            reportParameters: item.googleAnalyticsReport.reportParameters,
          })
          .returning();

        if (!newGAReport) {
          throw new Error("Failed to create GA report");
        }

        // Create dashboard item
        await db
          .insert(dashboardItemsTable)
          .values({
            workspaceId: ctx.activeWorkspaceId,
            dashboardId: input.dashboardId,
            gridX: item.dashboardItem.gridX,
            gridY: item.dashboardItem.gridY,
            gridWidth: item.dashboardItem.gridWidth,
            gridHeight: item.dashboardItem.gridHeight,
            plotViewId: newPlotViewId,
            googleAnalyticsReportId: newGAReport.id,
          })
          .returning();
      }

      return { success: true };
    }),
});
