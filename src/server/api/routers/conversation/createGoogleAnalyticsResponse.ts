import { db } from "@/server/db";
import {
  conversationTable,
  googleAnalyticsReportTable,
  messageTable,
  type GoogleAnalyticsReportSelect,
  type MessageSelect,
} from "@/server/db/schema";
import { getAgentResponse } from "@/server/googleAnalytics/getAgentResponse";
import { eq } from "drizzle-orm";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";

export const createGoogleAnalyticsResponse = async ({
  conversationId,
  userMessage,
}: {
  conversationId: string;
  userMessage: string;
}) => {
  const { messages } = await getConversationDetails({ conversationId });
  const formattedMessages = formatConversationHistory({ messages });

  const [ newUserMessage ] = await db.insert(messageTable)
    .values({
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
  });

  console.log('agentResponse', agentResponse);

  const [ newGoogleAnalyticsReport ] = await db
    .insert(googleAnalyticsReportTable)
    .values({
      title: agentResponse.title,
      description: agentResponse.description,
      reportParameters: agentResponse.googleAnalyticsReportParameters
    })
    .returning();

  if (!newGoogleAnalyticsReport) {
    throw new Error("Failed to create Google Analytics report");
  }

  const [ newAssistantMessage ] = await db.insert(messageTable)
    .values({
      conversationId,
      role: "assistant",
      googleAnalyticsReportId: newGoogleAnalyticsReport.id
    })
    .returning();

  if (!newAssistantMessage) {
    throw new Error("Failed to create assistant message");
  }

  // let view = null;
  // if (agentResponse.includeVisualization) {
  //   view = await getVisualizationResponse({
  //     formattedConversationHistory: formattedMessages,
  //     prompt,
  //     agentResponse: {
  //       title: agentResponse.title,
  //       description: agentResponse.description,
  //       googleAnalyticsReportParameters: agentResponse.googleAnalyticsReportParameters
  //     },
  //     workspaceUid
  //   });

  //   if (view) {
  //     await db
  //       .insert(dataSourceViewTable)
  //       .values({
  //         workspaceUid,
  //         queryId: null,
  //         messageId: newAssistantMessage.id,
  //         viewData: view,
  //         filterData: { filters: [] },
  //       });
  //   }
  // }

  return {
    newUserMessage,
    newAssistantMessage,
    suggestedUserResponses: agentResponse.suggestedUserResponses,
  };
};


const getConversationDetails = async ({
  conversationId
}: {
  conversationId: string;
}) => {
  const [conversation, messagesDetails] = await Promise.all([
    db.query.conversationTable.findFirst({
      where: eq(conversationTable.id, conversationId)
    }),
    db.select({
      message: messageTable,
      googleAnalyticsReport: googleAnalyticsReportTable,
    })
      .from(messageTable)
      .leftJoin(
        googleAnalyticsReportTable,
        eq(messageTable.googleAnalyticsReportId, googleAnalyticsReportTable.id)
      )
      .where(eq(messageTable.conversationId, conversationId))
      .orderBy(messageTable.createdAt)
  ]);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return {
    conversation,
    messages: messagesDetails
  };
}


const formatConversationHistory = ({
  messages
}: {
  messages: {
    message: MessageSelect,
    googleAnalyticsReport: GoogleAnalyticsReportSelect | null,
  }[]
}): ChatCompletionMessageParam[] => {

  return messages.map((messageDetails) => {
    if (messageDetails.message.role === 'user') {
      return {
        role: 'user',
        content: messageDetails.message.text ?? ""
      }
    }

    const report = messageDetails.googleAnalyticsReport;

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
