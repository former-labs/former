import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, Plus } from "lucide-react";
import { useChat } from "./chatStore";

export const Chat = () => {
  const { activeChat, createChat, chats, setActiveChatId } = useChat();

  return (
    <div className="h-full bg-gray-100 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium">Chat</div>
          <div className="flex gap-2">
            {chats.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {chats.map((chat) => (
                    <DropdownMenuItem
                      key={chat.chatId}
                      onClick={() => setActiveChatId(chat.chatId)}
                    >
                      Chat {chat.chatId}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={createChat} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeChat ? (
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="font-medium">Chat {activeChat.chatId}</div>
            <div className="mt-2 space-y-2">
              {activeChat.messages.map((message, i) => (
                <div
                  key={i}
                  className={`${
                    message.type === "assistant"
                      ? "text-blue-600"
                      : "text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No active chat</div>
        )}
      </div>
    </div>
  );
};
