import { db } from "@/server/db";
import {
  conversationTable,
  googleAnalyticsReportTable,
  messageItemsTable,
  messageTable,
  plotViewTable,
  type ConversationSelect,
  type GoogleAnalyticsReportSelect,
  type MessageItemSelect,
  type MessageSelect,
} from "@/server/db/schema";
import { getAgentResponse } from "@/server/googleAnalytics/getAgentResponse";
import { and, eq } from "drizzle-orm";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getVisualizationResponse } from "./getVisualizationResponse";

export const createGoogleAnalyticsResponse = async ({
  workspaceId,
  conversationId,
  userMessage,
}: {
  workspaceId: string;
  conversationId: string;
  userMessage: string;
}) => {
  const { messages } = await getConversationDetails({ workspaceId, conversationId });
  const formattedMessages = formatConversationHistory({ messages });

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


const getConversationDetails = async ({
  workspaceId,
  conversationId
}: {
  workspaceId: string;
  conversationId: string;
}): Promise<{
  conversation: ConversationSelect;
  messages: {
    message: MessageSelect;
    messageItems: {
      messageItem: MessageItemSelect;
      googleAnalyticsReport: GoogleAnalyticsReportSelect | null;
    }[];
  }[];
}> => {
  const [conversation, messages] = await Promise.all([
    db.query.conversationTable.findFirst({
      where: and(
        eq(conversationTable.workspaceId, workspaceId),
        eq(conversationTable.id, conversationId),
      )
    }),
    db.select({
      message: messageTable,
    })
      .from(messageTable)
      .where(and(
        eq(messageTable.workspaceId, workspaceId),
        eq(messageTable.conversationId, conversationId),
      ))
      .orderBy(messageTable.createdAt)
  ]);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const messagesWithItems = await Promise.all(
    messages.map(async ({ message }) => {
      const messageItems = await db.select({
        messageItem: messageItemsTable,
        googleAnalyticsReport: googleAnalyticsReportTable,
      })
        .from(messageItemsTable)
        .leftJoin(
          googleAnalyticsReportTable,
          eq(messageItemsTable.googleAnalyticsReportId, googleAnalyticsReportTable.id)
        )
        .where(eq(messageItemsTable.messageId, message.id));

      return {
        message,
        messageItems,
      };
    })
  );

  return {
    conversation,
    messages: messagesWithItems
  };
}


const formatConversationHistory = ({
  messages
}: {
  messages: {
    message: MessageSelect,
    messageItems: {
      messageItem: MessageItemSelect;
      googleAnalyticsReport: GoogleAnalyticsReportSelect | null;
    }[];
  }[]
}): ChatCompletionMessageParam[] => {

  return messages.map((messageDetails) => {
    if (messageDetails.message.role === 'user') {
      return {
        role: 'user',
        content: messageDetails.message.text ?? ""
      }
    }

    const report = messageDetails.messageItems[0]?.googleAnalyticsReport;

    return {
      role: messageDetails.message.role,
      content: `\
${report && `
Report Title: ${report.title}
Report Description: ${report.description}

Google Analytics Report Parameters:
<GOOGLE_ANALYTICS_REPORT_PARAMETERS>
${JSON.stringify(report.reportParameters, null, 2)}
</GOOGLE_ANALYTICS_REPORT_PARAMETERS>
`}
      `
    };
  });

}
