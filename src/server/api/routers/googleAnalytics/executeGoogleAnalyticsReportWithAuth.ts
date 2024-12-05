import { db } from "@/server/db";
import { integrationTable } from "@/server/db/schema";
import {
  executeGoogleAnalyticsReport,
  initializeAnalyticsDataClient,
  setOAuthCredentials
} from "@/server/googleAnalytics/googleAnalytics";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { and, eq } from "drizzle-orm";

export async function executeGoogleAnalyticsReportWithAuth({
  workspaceId,
  propertyId,
  reportParameters,
}: {
  workspaceId: string;
  propertyId: string;
  reportParameters: GoogleAnalyticsReportParameters;
}) {
  try {
    const integration = await db.query.integrationTable.findFirst({
      where: and(
        eq(integrationTable.workspaceId, workspaceId),
        eq(integrationTable.type, "google_analytics")
      ),
    });

    if (!integration) {
      throw new Error("No Google Analytics integration found for this workspace");
    }

    // Create OAuth2 client
    let analyticsDataClient;
    if (integration.credentials.refreshToken) {
      setOAuthCredentials(integration.credentials.refreshToken);
      analyticsDataClient = initializeAnalyticsDataClient(integration.credentials.refreshToken);
    } else {
      throw new Error("Google Analytics integration refresh token not found");
    }

    const result = await executeGoogleAnalyticsReport({
      parameters: reportParameters,
      propertyId,
      analyticsDataClient,
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
}
