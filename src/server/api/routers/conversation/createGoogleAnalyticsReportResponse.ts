import { db } from "@/server/db";
import {
  googleAnalyticsReportTable,
  messageItemsTable,
  messageTable,
  plotViewTable
} from "@/server/db/schema";
import { getAgentResponse } from "@/server/googleAnalytics/getAgentResponse";
import { getFormattedConversation } from "./getFormattedConversation";
import { getVisualizationResponse } from "./getVisualizationResponse";


export const createGoogleAnalyticsReportResponse = async ({
  workspaceId,
  conversationId,
  userMessage,
}: {
  workspaceId: string;
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

  const agentResponse = await getAgentResponse({
    formattedConversationHistory: formattedMessages,
    prompt: userMessage,
    currentDate: new Date(),
  });

  console.log('agentResponse', agentResponse);

  const [ newGoogleAnalyticsReport ] = await db
    .insert(googleAnalyticsReportTable)
    .values({
      workspaceId,
      title: agentResponse.title,
      description: agentResponse.description,
      reportParameters: agentResponse.googleAnalyticsReportParameters
    })
    .returning();

  if (!newGoogleAnalyticsReport) {
    throw new Error("Failed to create Google Analytics report");
  }

  let plotViewId = null;
  if (agentResponse.includeVisualization) {
    const view = await getVisualizationResponse({
      formattedConversationHistory: formattedMessages,
      prompt: userMessage,
      agentResponse: {
        title: agentResponse.title,
        description: agentResponse.description,
        googleAnalyticsReportParameters: agentResponse.googleAnalyticsReportParameters
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

  const [ newAssistantMessage ] = await db.insert(messageTable)
    .values({
      workspaceId,
      conversationId,
      role: "assistant",
    })
    .returning();

  if (!newAssistantMessage) {
    throw new Error("Failed to create assistant message");
  }

  const [ newMessageItem ] = await db.insert(messageItemsTable)
    .values({
      workspaceId,
      messageId: newAssistantMessage.id,
      googleAnalyticsReportId: newGoogleAnalyticsReport.id,
      plotViewId
    })
    .returning();

  if (!newMessageItem) {
    throw new Error("Failed to create message item");
  }

  return {
    newUserMessage,
    newAssistantMessage,
    suggestedUserResponses: agentResponse.suggestedUserResponses,
  };
};