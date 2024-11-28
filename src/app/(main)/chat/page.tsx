"use client";

import { PendingConversationMessage } from "./[conversationId]/components/Conversation";
import { SearchBar } from "./[conversationId]/components/SearchBar";
import { usePendingMessageStore } from "./usePendingMessageStore";

export default function Page() {
  return <ConversationPending />;
}

/**
 * This is a fake conversation with a single pending message which we show while the initial
 * request for a message is still in flight.
 *
 * This should probably share more components from the normal Conversation component, but this works
 * for now. We just need to remember to update this if we change how the regular conversation looks.
 */
export const ConversationPending = () => {
  const { pendingUserMessage } = usePendingMessageStore();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mx-auto w-full max-w-screen-lg flex-1 overflow-y-auto p-4">
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-4">
            {pendingUserMessage && (
              <PendingConversationMessage
                pendingChatMessage={pendingUserMessage}
              />
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full">
        <div className="flex w-full justify-center pb-16 pt-8">
          <div className="w-[50rem]">
            <SearchBar
              placeholder="Ask a question..."
              value={""}
              onChangeValue={() => {}}
              onSearch={async () => {}}
              isLoading={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
