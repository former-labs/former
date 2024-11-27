import type { DashboardGridItemType, DashboardType } from "@/app/(main)/dashboard/[dashboardId]/dashboardTypes";
import { dashboardSchema } from "@/app/(main)/dashboard/[dashboardId]/dashboardTypes";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { dashboardItemsTable, dashboardTable, googleAnalyticsReportTable, plotViewTable } from "@/server/db/schema";
import { executeGoogleAnalyticsReport as executeGA, verveGa4AnalyticsDataClient } from "@/server/googleAnalytics/googleAnalytics";
import { googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dashboardRouter = createTRPCRouter({
  createDashboard: publicProcedure.mutation(async ({ ctx }) => {
    const [dashboard] = await ctx.db
      .insert(dashboardTable)
      .values({
        title: "Untitled dashboard",
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

  listDashboards: publicProcedure.query(async ({ ctx }) => {
    const dashboards = await ctx.db
      .select()
      .from(dashboardTable)
      .orderBy(dashboardTable.title);

    return dashboards;
  }),

  getDashboard: publicProcedure
    .input(z.object({ dashboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const dashboard = await ctx.db.query.dashboardTable.findFirst({
        where: eq(dashboardTable.id, input.dashboardId),
      });

      if (!dashboard) {
        throw new Error("Dashboard not found");
      }

      return dashboard;
    }),

  getDashboardDetails: publicProcedure
    .input(z.object({
      dashboardId: z.string().uuid()
    }))
    .query(async ({ ctx, input }): Promise<DashboardType> => {
      const dashboard = await ctx.db.query.dashboardTable.findFirst({
        where: eq(dashboardTable.id, input.dashboardId),
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
        .where(
          eq(dashboardItemsTable.dashboardId, input.dashboardId)
        );

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

  executeGoogleAnalyticsReport: publicProcedure
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

  updateDashboard: publicProcedure
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
        .where(eq(dashboardItemsTable.dashboardId, input.dashboardId));

      // Delete all existing dashboard items
      await db
        .delete(dashboardItemsTable)
        .where(eq(dashboardItemsTable.dashboardId, input.dashboardId));

      // Delete referenced plot views
      for (const item of existingItems) {
        if (item.plotViewId) {
          await db
            .delete(plotViewTable)
            .where(eq(plotViewTable.id, item.plotViewId));
        }
      }

      // Delete referenced GA reports
      for (const item of existingItems) {
        await db
          .delete(googleAnalyticsReportTable)
          .where(eq(googleAnalyticsReportTable.id, item.googleAnalyticsReportId));
      }

      // Update dashboard title and description
      await db
        .update(dashboardTable)
        .set({
          title: input.dashboard.title,
          description: input.dashboard.description,
        })
        .where(eq(dashboardTable.id, input.dashboardId));

      // Create new items
      for (const item of input.dashboard.items) {
        let newPlotViewId: string | null = null;

        if (item.plotView) {
          // Create plot view if it exists
          const [newPlotView] = await ctx.db
            .insert(plotViewTable)
            .values({
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
