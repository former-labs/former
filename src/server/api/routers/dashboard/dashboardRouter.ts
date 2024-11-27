import type { DashboardGridItemType, DashboardType } from "@/app/(main)/dashboard/[dashboardId]/dashboardTypes";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
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
        .leftJoin(
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
        googleAnalyticsReport: item.googleAnalyticsReport ? {
          title: item.googleAnalyticsReport.title,
          description: item.googleAnalyticsReport.description,
          reportParameters: item.googleAnalyticsReport.reportParameters
        } : null
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
});
