"use client";

import { SearchBar } from "@/app/(main)/chat/[conversationId]/components/SearchBar";
import { usePendingMessageStore } from "@/components/chat/usePendingMessageStore";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";
import {
  PATH_CONVERSATION_PENDING,
  PATH_CONVERSATION_SINGLE,
} from "@/lib/paths";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SuggestionsSection } from "./SuggestionsSection";

export const NewConversationSearchBar = () => {
  const { activeProperty } = useGoogleAnalytics();
  const [searchValue, setSearchValue] = useState("");
  const [questionType, setQuestionType] = useState<"report" | "segmentation">(
    "report",
  );
  const router = useRouter();
  const { setPendingUserMessage, clearPendingUserMessage } =
    usePendingMessageStore();

  const createConversationMutation =
    api.conversation.createConversation.useMutation({});

  const handleSearch = async (searchText: string) => {
    if (!activeProperty) {
      return;
    }

    // Temporarily redirect to show the pending conversation
    setPendingUserMessage(searchText);
    router.push(PATH_CONVERSATION_PENDING);
    const data = await createConversationMutation.mutateAsync({
      initialUserMessage: searchText,
      propertyId: activeProperty.propertyId,
      questionType,
    });
    setSearchValue("");
    router.push(PATH_CONVERSATION_SINGLE(data.conversationId));
    clearPendingUserMessage();
  };

  const suggestedQuestions = [
    "How many active users in Australia?",
    "Show me active users day on day for the last 4 weeks.",
    "What are our most popular pages broken down by device type?",
  ];

  return (
    <div className="flex flex-col gap-4">
      <SearchBar
        placeholder="Ask a question..."
        value={searchValue}
        onChangeValue={setSearchValue}
        onSearch={() => handleSearch(searchValue)}
        isLoading={createConversationMutation.isPending}
        searchTypeValue={questionType}
        onSearchTypeValueChange={setQuestionType}
      />
      <div className="mt-8 w-full">
        <SuggestionsSection
          suggestions={suggestedQuestions}
          onClick={handleSearch}
        />
      </div>
    </div>
  );
};
