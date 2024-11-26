import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { googleAnalyticsReportTable } from "@/server/db/schema";
import { executeGoogleAnalyticsReport, verveGa4AnalyticsDataClient } from "@/server/googleAnalytics/googleAnalytics";
import { googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const googleAnalyticsRouter = createTRPCRouter({
  getGoogleAnalyticsReport: publicProcedure
    .input(z.object({ googleAnalyticsReportId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db.query.googleAnalyticsReportTable.findFirst({
        where: eq(googleAnalyticsReportTable.id, input.googleAnalyticsReportId),
      });

      if (!report) {
        throw new Error(`Report not found for id: ${input.googleAnalyticsReportId}`);
      }

      return report;
    }),

  updateGoogleAnalyticsReportParameters: publicProcedure
    .input(z.object({
      googleAnalyticsReportId: z.string().uuid(),
      reportParameters: googleAnalyticsReportParametersSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const [updatedReport] = await ctx.db
        .update(googleAnalyticsReportTable)
        .set({
          reportParameters: input.reportParameters,
        })
        .where(eq(googleAnalyticsReportTable.id, input.googleAnalyticsReportId))
        .returning();

      if (!updatedReport) {
        throw new Error(`Failed to update report with id: ${input.googleAnalyticsReportId}`);
      }

      return updatedReport;
    }),

  executeGoogleAnalyticsReport: publicProcedure
    .input(z.object({ googleAnalyticsReportId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.query.googleAnalyticsReportTable.findFirst({
        where: eq(googleAnalyticsReportTable.id, input.googleAnalyticsReportId),
      });

      if (!report) {
        throw new Error(`Report not found for id: ${input.googleAnalyticsReportId}`);
      }

      try {
        // Hardcoded to ours for now
        const propertyId = "447821713";

        const result = await executeGoogleAnalyticsReport({
          parameters: report.reportParameters,
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
