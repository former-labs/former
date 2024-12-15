"use client";

import { use } from "react";
import { Conversation } from "../../../../components/chat/Conversation";

export default function Page({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return <Conversation conversationId={conversationId} />;
}
