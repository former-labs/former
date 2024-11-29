"use client";

import { GoogleAnalyticsConnectButton } from "@/components/analytics/google-analytics-connect-button";
import { NewConversationSearchBar } from "@/components/chat/NewConversationSearchBar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { accounts } = useGoogleAnalytics();

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>No Google Analytics Account</CardTitle>
            <CardDescription className="mb-4">
              Please connect a Google Analytics account before starting a
              conversation.
            </CardDescription>
            <GoogleAnalyticsConnectButton />
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <MessageSquare className="h-12 w-12 text-gray-400" />
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-gray-500">Start a new conversation</p>

        <div className="w-[50rem]">
          <NewConversationSearchBar />
        </div>
      </div>
    </div>
  );
}
