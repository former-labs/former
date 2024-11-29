import { SearchBar } from "@/app/(main)/chat/[conversationId]/components/SearchBar";
import { usePendingMessageStore } from "@/components/chat/usePendingMessageStore";
import {
  PATH_CONVERSATION_PENDING,
  PATH_CONVERSATION_SINGLE,
} from "@/lib/paths";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const NewConversationSearchBar = () => {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const { setPendingUserMessage, clearPendingUserMessage } =
    usePendingMessageStore();

  const createConversationMutation =
    api.conversation.createConversation.useMutation({});

  return (
    <SearchBar
      placeholder="Ask a question..."
      value={searchValue}
      onChangeValue={setSearchValue}
      onSearch={async () => {
        // Temporarily redirect to show the pending conversation
        setPendingUserMessage(searchValue);
        router.push(PATH_CONVERSATION_PENDING);
        const data = await createConversationMutation.mutateAsync({
          initialUserMessage: searchValue,
        });
        setSearchValue("");
        router.push(PATH_CONVERSATION_SINGLE(data.conversationId));
        clearPendingUserMessage();
      }}
      isLoading={createConversationMutation.isPending}
    />
  );
};
