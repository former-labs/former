"use client";

import { GoogleAnalyticsConnectButton } from "@/components/analytics/google-analytics-connect-button";
import { NewConversationSearchBar } from "@/components/chat/NewConversationSearchBar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoVerve } from "@/components/utils/LogoVerve";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";

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
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="mb-10 flex w-full max-w-screen-lg flex-col items-center gap-4 px-4">
        <div className="z-10 mb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md">
            <LogoVerve className="h-10 w-10" />
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-semibold">
          Ask a question of your Google Analytics data
        </h1>

        <div className="w-full max-w-screen-lg">
          <NewConversationSearchBar />
        </div>
      </div>
    </div>
  );
}
