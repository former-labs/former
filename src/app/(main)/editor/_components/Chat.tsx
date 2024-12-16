"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { CornerDownLeft, History, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "./chatStore";

export const ChatSidebar = () => {
  const { createChat, chats, setActiveChatId } = useChat();

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

        <ActiveChat />
      </div>
    </div>
  );
};

const ActiveChat = () => {
  const { activeChat } = useChat();

  if (!activeChat) {
    return <div className="text-center text-gray-500">No active chat</div>;
  }

  const handleSubmit = (message: string) => {
    console.log(message);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Chat {activeChat.chatId}</div>
      <div className="space-y-2 rounded-lg bg-white p-2 shadow">
        {activeChat.messages.length > 0 ? (
          activeChat.messages.map((message, i) => (
            <div
              key={i}
              className={`${
                message.type === "assistant" ? "text-blue-600" : "text-gray-800"
              }`}
            >
              {message.content}
            </div>
          ))
        ) : (
          <ChatInputBox onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
};

const ChatInputBox = ({
  onSubmit,
}: {
  onSubmit: (message: string) => void;
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <div className="space-y-2">
      <TextareaAutoResize
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything..."
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1"
          onClick={handleSubmit}
        >
          Submit
          <CornerDownLeft className="max-h-3 max-w-3" />
        </Button>
      </div>
    </div>
  );
};

const TextareaAutoResize = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <Textarea
      ref={textAreaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-full resize-none overflow-hidden border shadow-none focus-visible:ring-0"
      rows={1}
    />
  );
};
