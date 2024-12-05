import { db } from "@/server/db";
import {
  googleAnalyticsReportTable,
  messageItemsTable,
  messageTable,
  plotViewTable
} from "@/server/db/schema";
import type { GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { getAgentResponseSegmentationMetric } from "@/server/googleAnalytics/segmentation/getAgentResponse";
import { getAgentResponseSegmentationAnalysis } from "@/server/googleAnalytics/segmentation/getAgentSegmentationAnalysis";
import { executeGoogleAnalyticsReportWithAuth } from "../googleAnalytics/executeGoogleAnalyticsReportWithAuth";
import { getFormattedConversation } from "./getFormattedConversation";
import { getVisualizationResponse } from "./getVisualizationResponse";

export const createGoogleAnalyticsSegmentationResponse = async ({
  workspaceId,
  propertyId,
  conversationId,
  userMessage,
}: {
  workspaceId: string;
  propertyId: string;
  conversationId: string;
  userMessage: string;
}) => {
  const formattedMessages = await getFormattedConversation({ workspaceId, conversationId });

  const [ newUserMessage ] = await db.insert(messageTable)
    .values({
      workspaceId,
      conversationId,
      role: "user",
      text: userMessage
    })
    .returning();

  if (!newUserMessage) {
    throw new Error("Failed to create user message");
  }

  const agentSegmentationResponse = await getAgentResponseSegmentationMetric({
    formattedConversationHistory: formattedMessages,
    prompt: userMessage,
  });

  console.log('agentSegmentationResponse', agentSegmentationResponse);

  const segmentedReportParameters = [
    getSegmentedReport({
      segmentationResponse: agentSegmentationResponse,
      dimension: "country"
    }),
    getSegmentedReport({
      segmentationResponse: agentSegmentationResponse,
      dimension: "deviceCategory"
    })
  ];

  const segmentedReportResults = await Promise.all(
    segmentedReportParameters.map(reportParameters => 
      executeGoogleAnalyticsReportWithAuth({
        workspaceId,
        propertyId,
        reportParameters,
      })
    )
  );

  const segmentedReports = segmentedReportParameters.map((reportParameters, index) => ({
    reportParameters,
    reportResult: segmentedReportResults[index]
  }));

  const agentResponseSegmentationAnalysis = await getAgentResponseSegmentationAnalysis({
    formattedConversationHistory: formattedMessages,
    prompt: userMessage,
    segmentedReports,
  });
  console.log('agentResponseSegmentationAnalysis', agentResponseSegmentationAnalysis);

  const [ newAssistantMessage ] = await db.insert(messageTable)
    .values({
      workspaceId,
      conversationId,
      role: "assistant",
      text: agentResponseSegmentationAnalysis.analysisMessage
    })
    .returning();

  if (!newAssistantMessage) {
    throw new Error("Failed to create assistant message");
  }

  await Promise.all([
    createSegmentationAnalysis({
      workspaceId,
      messageId: newAssistantMessage.id,
      formattedMessages,
      userMessage,
      reportParameters: segmentedReportParameters[0]!,
      dimension: "country"
    }),
    createSegmentationAnalysis({
      workspaceId,
      messageId: newAssistantMessage.id,
      formattedMessages,
      userMessage,
      reportParameters: segmentedReportParameters[1]!,
      dimension: "deviceCategory"
    })
  ]);

  return {
    newUserMessage,
    newAssistantMessage,
    suggestedUserResponses: [],
  };
};

const getSegmentedReport = ({
  segmentationResponse,
  dimension,
}: {
  segmentationResponse: {
    metrics: { name: string }[];
    dateRanges: { startDate: string; endDate: string; name?: string }[];
  };
  dimension: string;
}): GoogleAnalyticsReportParameters => {
  const reportParameters = {
    metrics: segmentationResponse.metrics,
    dimensions: [{ name: dimension }],
    dateRanges: segmentationResponse.dateRanges,
  };

  // Sanity check zod parse
  return googleAnalyticsReportParametersSchema.parse(reportParameters);
};

const createSegmentationAnalysis = async ({
  workspaceId,
  messageId,
  formattedMessages,
  userMessage,
  reportParameters,
  dimension,
}: {
  workspaceId: string;
  messageId: string;
  formattedMessages: any[];
  userMessage: string;
  reportParameters: GoogleAnalyticsReportParameters;
  dimension: string;
}) => {
  const [ newGoogleAnalyticsReport ] = await db
    .insert(googleAnalyticsReportTable)
    .values({
      workspaceId,
      title: `Segmentation analysis by ${dimension}`,
      description: `A segmentation analysis by ${dimension}`,
      reportParameters
    })
    .returning();

  if (!newGoogleAnalyticsReport) {
    throw new Error("Failed to create Google Analytics report");
  }

  let plotViewId = null;
  if (true) {
    const view = await getVisualizationResponse({
      formattedConversationHistory: formattedMessages,
      prompt: userMessage,
      agentResponse: {
        title: `Segmentation analysis plot by ${dimension}`,
        description: `A segmentation analysis plot by ${dimension}`,
        googleAnalyticsReportParameters: reportParameters
      },
    });

    const [newPlotView] = await db
      .insert(plotViewTable)
      .values({
        workspaceId,
        viewData: view,
      })
      .returning();

    if (!newPlotView) {
      throw new Error("Failed to create plot view");
    }

    plotViewId = newPlotView.id;
  }

  const [ newMessageItem ] = await db.insert(messageItemsTable)
    .values({
      workspaceId,
      messageId,
      googleAnalyticsReportId: newGoogleAnalyticsReport.id,
      plotViewId
    })
    .returning();

  if (!newMessageItem) {
    throw new Error("Failed to create message item");
  }

  return reportParameters;
};
