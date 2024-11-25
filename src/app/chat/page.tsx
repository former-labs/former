"use client";

import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <MessageSquare className="h-12 w-12 text-gray-400" />
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-gray-500">Start a new conversation</p>
      </div>
    </div>
  );
}
