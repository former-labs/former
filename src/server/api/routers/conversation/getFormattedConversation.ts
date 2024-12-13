import { db } from "@/server/db";
import {
  conversationTable,
  googleAnalyticsReportTable,
  messageItemsTable,
  messageTable,
  type ConversationSelect,
  type GoogleAnalyticsReportSelect,
  type MessageItemSelect,
  type MessageSelect
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";

export const getFormattedConversation = async ({
  workspaceId,
  conversationId
}: {
  workspaceId: string;
  conversationId: string;
}) => {
  const conversationDetails = await getConversationDetails({ workspaceId, conversationId });
  return formatConversationHistory({ messages: conversationDetails.messages });
}

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