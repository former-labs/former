"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  CornerDownLeft,
  History,
  ListCheck,
  Loader2,
  Plus,
} from "lucide-react";
import React, { type ReactNode, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useChat } from "./chatStore";
import { useEditor } from "./editorStore";

export const ChatSidebar = () => {
  const { createChat, chats, setActiveChatId } = useChat();

  return (
    <div className="flex h-full flex-col gap-4 bg-gray-200 p-3">
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
              <DropdownMenuContent className="mr-2">
                {chats.map((chat) => (
                  <DropdownMenuItem
                    key={chat.chatId}
                    onClick={() => setActiveChatId(chat.chatId)}
                  >
                    Chat - {chat.createdAt.toLocaleString()}
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

      <div className="flex-1 overflow-y-auto">
        <ActiveChat />
      </div>
    </div>
  );
};

const ActiveChat = () => {
  const { activeChat, submitMessage } = useChat();

  if (!activeChat) {
    return <div className="text-center text-gray-500">No active chat</div>;
  }

  const handleSubmit = async (message: string) => {
    await submitMessage({ message });
  };

  const lastMessage = activeChat.messages[activeChat.messages.length - 1];
  const showLoadingMessage = lastMessage?.type === "user";
  const hasMessages = activeChat.messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div
        className={`space-y-2 overflow-y-auto ${hasMessages ? "flex-1" : ""}`}
      >
        <div className="text-sm font-medium">Chat {activeChat.chatId}</div>
        <div className="space-y-2">
          {activeChat.messages.map((message, i) => (
            <div key={i}>
              {message.type === "assistant" ? (
                <div className="p-2">
                  <ReactMarkdown
                    components={{
                      pre: CodeBlock,
                      code: CodeInline,
                    }}
                    className="space-y-2"
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="rounded-lg bg-white p-2 text-gray-800 shadow">
                  {message.content}
                </div>
              )}
            </div>
          ))}
          {showLoadingMessage && (
            <div className="flex items-center gap-2 p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </div>
      <ChatInputBox onSubmit={handleSubmit} />
    </div>
  );
};

const ChatInputBox = ({
  onSubmit,
}: {
  onSubmit: (message: string) => Promise<void>;
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    void onSubmit(value);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2 rounded-lg border bg-white p-2">
      <TextareaAutoResize
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
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
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="h-full resize-none overflow-hidden border p-2 shadow-none focus-visible:ring-0"
      rows={1}
    />
  );
};

const CodeInline = ({ children }: { children?: ReactNode }) => {
  return (
    <code className="rounded bg-gray-300 px-1 py-0.5 text-sm text-gray-800">
      {children}
    </code>
  );
};

const CodeBlock = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => {
  const { setEditorContentPending } = useEditor();

  if (!React.isValidElement(children)) {
    throw new Error("Node passed to code block that isn't a valid element.");
  }

  if (children.props?.node?.tagName !== "code") {
    throw new Error("Node passed to code block that isn't a code element.");
  }

  /*
    ReactMarkdown is stupid and passes both inline and block code elements
    through the CodeInline component first. We strip out the inline code
    wrapper here first and rewrap with our code block wrapper.
    This should just be a string now.
  */
  const codeContent = children.props.children;
  if (typeof codeContent !== "string") {
    throw new Error("Code content is not a string.");
  }

  return (
    <div>
      <pre className="relative overflow-x-auto rounded-sm border bg-gray-100 px-3 py-2">
        <code className={`text-sm ${className}`}>{codeContent}</code>
      </pre>
      <div className="mt-1 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditorContentPending(codeContent)}
          className="gap-1"
        >
          Apply
          <ListCheck className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
