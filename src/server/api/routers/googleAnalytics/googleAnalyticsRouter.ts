import { env } from "@/env";
import { GoogleAnalyticsAccount } from "@/lib/googleAnalytics/googleAnalyticsTypes";
import { createTRPCRouter, userProtectedProcedure, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { googleAnalyticsReportTable, integrationTable } from "@/server/db/schema";
import { executeGoogleAnalyticsReport, verveGa4AnalyticsDataClient } from "@/server/googleAnalytics/googleAnalytics";
import { googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  return data.access_token;
}

export const googleAnalyticsRouter = createTRPCRouter({
  getAccounts: userProtectedProcedure.query(async ({ ctx }) => {
    const integration = await db.query.integrationTable.findFirst({
      where: eq(integrationTable.workspaceId, ctx.user.roles[0]?.workspaceId ?? ""),
    });

    if (!integration?.credentials) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Google Analytics not connected",
      });
    }

    const credentials = integration.credentials;
    const accessToken = await refreshAccessToken(credentials.refreshToken);

    const response = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch GA4 projects",
      });
    }

    const data = await response.json();
    return data.accountSummaries.map((account: any) => ({
      accountId: account.account.split("/")[1],
      name: account.displayName,
      properties: account.propertySummaries.map((property: any) => ({
        propertyId: property.property.split("/")[1],
        name: property.displayName,
      })),
    })) as GoogleAnalyticsAccount[];
  }),

  getGoogleAnalyticsReport: workspaceProtectedProcedure
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

  updateGoogleAnalyticsReportParameters: workspaceProtectedProcedure
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

  executeGoogleAnalyticsReport: workspaceProtectedProcedure
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
