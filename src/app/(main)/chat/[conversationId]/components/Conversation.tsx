"use client";

import { Loading } from "@/components/utils/Loading";
import { type MessageSelect } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useState } from "react";
import { usePendingMessageStore } from "../../usePendingMessageStore";
import { ConversationMessageGoogleAnalyticsReport } from "./ConversationMessageGoogleAnalyticsReport";
import { SearchBar } from "./SearchBar";

export const Conversation = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const [searchValue, setSearchValue] = useState("");
  const utils = api.useUtils();
  const { pendingUserMessage, setPendingUserMessage, clearPendingUserMessage } =
    usePendingMessageStore();

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

  const handleSendMessage = async () => {
    const searchValueTemp = searchValue;
    setSearchValue("");
    setPendingUserMessage(searchValueTemp);
    await addMessageMutation.mutateAsync({
      conversationId,
      text: searchValueTemp,
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
            {messages.map((message) => (
              <ConversationMessage key={message.id} message={message} />
            ))}
            {pendingUserMessage && (
              <PendingConversationMessage
                pendingChatMessage={pendingUserMessage}
              />
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full">
        <div className="flex w-full justify-center pb-16 pt-8">
          <div className="w-[50rem]">
            <SearchBar
              placeholder="Ask a question..."
              value={searchValue}
              onChangeValue={setSearchValue}
              onSearch={handleSendMessage}
              isLoading={addMessageMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ConversationMessage = ({ message }: { message: MessageSelect }) => {
  if (message.role === "user") {
    return <ConversationMessageUser messageText={message.text ?? ""} />;
  } else if (message.role === "assistant") {
    return <ConversationMessageGoogleAnalyticsReport message={message} />;
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
