"use client";

import { api } from "@/trpc/react";
import { use } from "react";
import { SearchBar } from "./components/SearchBar";

export default function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);

  const { data: conversation, error: conversationError } =
    api.conversation.getConversation.useQuery({
      conversationId,
    });

  const { data: messages, error: messagesError } =
    api.conversation.listConversationMessages.useQuery({
      conversationId,
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
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Conversation {conversationId}</h1>
      <div className="mt-4 space-y-4">
        <div className="rounded bg-gray-100 p-4">
          <h2 className="font-bold">Conversation Details:</h2>
          <pre>{JSON.stringify(conversation, null, 2)}</pre>
        </div>
        <div className="rounded bg-gray-100 p-4">
          <h2 className="font-bold">Messages:</h2>
          <pre>{JSON.stringify(messages, null, 2)}</pre>
        </div>
      </div>

      <div>
        <SearchBar
          value=""
          onChangeValue={() => {}}
          onSearch={async () => {
            console.log("search");
          }}
        />
      </div>
    </div>
  );
}
