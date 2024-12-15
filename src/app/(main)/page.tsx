"use client";

import { NewConversationSearchBar } from "@/components/chat/NewConversationSearchBar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoVerve } from "@/components/utils/LogoVerve";
import { useData } from "@/contexts/DataContext";

export default function ChatPage() {
  const { integrations } = useData();

  if (integrations.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>No Integrations Connected</CardTitle>
            <CardDescription className="mb-4">
              Please connect an integration before starting a conversation.
            </CardDescription>
            <Button
              onClick={() => (window.location.href = "/integrations")}
              className="w-full"
              size="lg"
            >
              Go to Integrations
            </Button>
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
          Ask a question of your data
        </h1>

        <div className="w-full max-w-screen-lg">
          <NewConversationSearchBar />
        </div>
      </div>
    </div>
  );
}
