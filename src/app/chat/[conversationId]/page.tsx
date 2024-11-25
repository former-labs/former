"use client";

import { type MessageSelect } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { use, useState } from "react";
import { SearchBar } from "./components/SearchBar";

export default function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const [searchValue, setSearchValue] = useState("");
  const utils = api.useUtils();

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
      void utils.conversation.listConversationMessages.invalidate({
        conversationId,
      });
    },
  });

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
      <div className="mx-auto max-w-screen-lg flex-1 overflow-y-auto p-4">
        <h1 className="text-2xl font-bold">Conversation {conversationId}</h1>
        <div className="mt-4 space-y-4">
          <div className="rounded bg-gray-100 p-4">
            <h2 className="font-bold">Conversation Details:</h2>
            <pre>{JSON.stringify(conversation, null, 2)}</pre>
          </div>
          <div className="space-y-4">
            <h2 className="font-bold">Messages:</h2>
            {messages.map((message) => (
              <ConversationMessage key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full">
        <div className="flex w-full justify-center pb-8">
          <div className="w-[50rem]">
            <SearchBar
              placeholder="Ask a question..."
              value={searchValue}
              onChangeValue={setSearchValue}
              onSearch={async () => {
                await addMessageMutation.mutateAsync({
                  conversationId,
                  text: searchValue,
                });
                setSearchValue("");
              }}
              isLoading={addMessageMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const ConversationMessage = ({ message }: { message: MessageSelect }) => {
  if (message.role === "user") {
    return <ConversationMessageUser message={message} />;
  }
  return <ConversationMessageGoogleAnalyticsReport message={message} />;
};

const ConversationMessageUser = ({ message }: { message: MessageSelect }) => {
  return (
    <div className="rounded bg-blue-50 p-4">
      <pre>{JSON.stringify(message, null, 2)}</pre>
    </div>
  );
};

const ConversationMessageGoogleAnalyticsReport = ({
  message,
}: {
  message: MessageSelect;
}) => {
  const { data: report } = api.conversation.getGoogleAnalyticsReport.useQuery(
    {
      googleAnalyticsReportId: message.googleAnalyticsReportId!,
    },
    {
      enabled: !!message.googleAnalyticsReportId,
    },
  );

  return (
    <div className="space-y-4 rounded bg-red-50 p-4">
      <pre>{JSON.stringify(message, null, 2)}</pre>
      {report && (
        <>
          <div className="border-t border-red-200 pt-4">
            <h3 className="mb-2 font-bold">
              Associated Google Analytics Report:
            </h3>
            <pre>{JSON.stringify(report, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
};
