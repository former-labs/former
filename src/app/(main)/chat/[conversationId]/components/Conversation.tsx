"use client";

import { Loading } from "@/components/utils/Loading";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";
import { MessageItemSelect, type MessageSelect } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useEffect, useRef, useState } from "react";
import { usePendingMessageStore } from "../../../../../components/chat/usePendingMessageStore";
import { ConversationMessageAssistant } from "./ConversationMessageGoogleAnalyticsReport";
import { SearchBar } from "./SearchBar";

export const Conversation = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const { activeProperty } = useGoogleAnalytics();
  const [searchValue, setSearchValue] = useState("");
  const [questionType, setQuestionType] = useState<"report" | "segmentation">(
    "report",
  );
  const utils = api.useUtils();
  const { pendingUserMessage, setPendingUserMessage, clearPendingUserMessage } =
    usePendingMessageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, error: conversationError } =
    api.conversation.getConversation.useQuery({
      conversationId,
    });

  const { data: messages, error: messagesError } =
    api.conversation.listConversationMessages.useQuery({
      conversationId,
    });

  const addMessageMutation = api.conversation.addMessage.useMutation({
    onSuccess: () => {
      clearPendingUserMessage();
      void utils.conversation.listConversationMessages.invalidate({
        conversationId,
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingUserMessage]);

  const handleSendMessage = async () => {
    if (!activeProperty) {
      return;
    }

    const searchValueTemp = searchValue;
    setSearchValue("");
    setPendingUserMessage(searchValueTemp);
    await addMessageMutation.mutateAsync({
      conversationId,
      text: searchValueTemp,
      propertyId: activeProperty.propertyId,
      questionType,
    });
  };

  if (conversationError) {
    return <div>Error loading conversation: {conversationError.message}</div>;
  }

  if (messagesError) {
    return <div>Error loading messages: {messagesError.message}</div>;
  }

  if (!conversation || !messages) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mx-auto w-full max-w-screen-lg flex-1 overflow-y-auto p-4">
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-4">
            {messages.map((messageWithItems) => (
              <ConversationMessage
                key={messageWithItems.message.id}
                messageWithItems={messageWithItems}
                scrollToBottom={scrollToBottom}
              />
            ))}
            {pendingUserMessage && (
              <PendingConversationMessage
                pendingChatMessage={pendingUserMessage}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-background">
        <div className="flex w-full justify-center px-4 pb-10 pt-2">
          <div className="w-full max-w-screen-lg">
            <SearchBar
              placeholder="Ask a question..."
              value={searchValue}
              onChangeValue={setSearchValue}
              onSearch={handleSendMessage}
              isLoading={addMessageMutation.isPending}
              searchTypeValue={questionType}
              onSearchTypeValueChange={setQuestionType}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ConversationMessage = ({
  messageWithItems,
  scrollToBottom,
}: {
  messageWithItems: {
    message: MessageSelect;
    messageItems: MessageItemSelect[];
  };
  scrollToBottom: () => void;
}) => {
  const { message } = messageWithItems;
  if (message.role === "user") {
    return <ConversationMessageUser messageText={message.text ?? ""} />;
  } else if (message.role === "assistant") {
    return (
      <ConversationMessageAssistant
        messageWithItems={messageWithItems}
        scrollToBottom={scrollToBottom}
      />
    );
  }
  const _exhaustiveCheck: never = message.role;
};

const ConversationMessageUser = ({ messageText }: { messageText: string }) => {
  return (
    <div className="flex w-auto gap-x-4 self-end rounded bg-orange-50 px-4 pb-4 pt-4">
      <div className="flex flex-col text-gray-900">{messageText}</div>
    </div>
  );
};

export const PendingConversationMessage = ({
  pendingChatMessage,
}: {
  pendingChatMessage: string;
}) => {
  return (
    <>
      <ConversationMessageUser messageText={pendingChatMessage} />
      <div className="flex flex-col gap-y-2">
        <div className="flex gap-x-4 rounded px-2 pb-4 pt-4">
          <div className="flex flex-1 items-center justify-center pb-8 pt-3">
            <Loading />
          </div>
        </div>
      </div>
    </>
  );
};
