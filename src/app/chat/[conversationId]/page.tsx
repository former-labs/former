"use client";

import { api } from "@/trpc/react";
import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);

  const { data: conversation, error } =
    api.conversation.getConversation.useQuery({
      conversationId,
    });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!conversation) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Conversation {conversationId}</h1>
      <pre className="mt-4 rounded bg-gray-100 p-4">
        {JSON.stringify(conversation, null, 2)}
      </pre>
    </div>
  );
}
