"use client";

import { Button } from "@/components/ui/button";
import { TextareaAutoResize } from "@/components/ui/custom/textarea-auto-resize";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CornerDownLeft, History, Loader2, Plus } from "lucide-react";
import React, { useEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { getActiveEditor } from "../editor/editorStore";
import { ApplyCodeBlock } from "./ApplyCodeBlock";
import { useChat, type ChatMessageType } from "./chatStore";
import { KnowledgeSourceComponent } from "./KnowledgeSourceComponent";
import { StaticEditor } from "./StaticEditor";

export const ChatSidebar = () => {
  const { chats, setActiveChatId, activeChat } = useChat();

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
                    className={
                      activeChat?.chatId === chat.chatId
                        ? "border bg-gray-100"
                        : ""
                    }
                  >
                    Chat - {chat.createdAt.toLocaleString()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <CreateChatButton />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ActiveChat />
      </div>
    </div>
  );
};

const CreateChatButton = () => {
  const { createChat } = useChat();

  return (
    <Button
      onClick={() =>
        createChat({
          editorSelectionContent: getActiveEditor().editorSelectionContent,
        })
      }
      size="icon"
      variant="outline"
    >
      <Plus className="h-4 w-4" />
    </Button>
  );
};

const ActiveChat = () => {
  const { activeChat, submitMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Kinda dodgy to have the timeout bc unknown race conditions.
    // I think the ReactMarkdown component causes the need for the timeout.
    // This works for now.
    if (activeChat?.messages) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [activeChat?.messages]);

  if (!activeChat) {
    return <div className="text-center text-gray-500">No active chat</div>;
  }

  const handleSubmit = async (message: string) => {
    await submitMessage({
      message,
      editorContent: getActiveEditor().editorContent,
    });
  };

  const lastMessage = activeChat.messages[activeChat.messages.length - 1];
  const showLoadingMessage = lastMessage?.type === "user";
  const hasMessages = activeChat.messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div
        className={`space-y-2 overflow-y-auto pb-4 ${hasMessages ? "flex-1" : ""}`}
      >
        <div className="space-y-4">
          {activeChat.messages.map((message, i) => (
            <ChatMessage key={i} message={message} />
          ))}
          {showLoadingMessage && (
            <div className="flex items-center gap-2 p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInputBox onSubmit={handleSubmit} />
    </div>
  );
};

const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  if (message.type === "assistant") {
    return (
      <div className="p-2 text-sm">
        <ReactMarkdown
          components={{
            pre: CodeBlock,
            code: CodeInline,
            ul: ({ children }) => (
              <ul className="list-disc space-y-1 pl-6">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal space-y-1 pl-6">{children}</ol>
            ),
            li: ({ children }) => <li className="text-gray-800">{children}</li>,
          }}
          className="space-y-2"
        >
          {message.content}
        </ReactMarkdown>
        {message.knowledgeSources.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-gray-600">Sources</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {message.knowledgeSources.map((knowledgeId) => (
                <KnowledgeSourceComponent
                  key={knowledgeId}
                  knowledgeId={knowledgeId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white px-3 py-2 text-sm text-gray-800 shadow">
      {message.editorSelectionContent && (
        <div className="mb-2 border pr-3">
          <StaticEditor value={message.editorSelectionContent} />
        </div>
      )}
      {message.content}
    </div>
  );
};

const ChatInputBox = ({
  onSubmit,
}: {
  onSubmit: (message: string) => Promise<void>;
}) => {
  const [value, setValue] = useState("");
  const {
    activeChat,
    shouldFocusActiveChatTextarea,
    setShouldFocusActiveChatTextarea,
  } = useChat();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const selectionContent = activeChat?.pendingEditorSelectionContent;

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

  useEffect(() => {
    if (shouldFocusActiveChatTextarea && textAreaRef.current) {
      textAreaRef.current.focus();
      setShouldFocusActiveChatTextarea(false);
    }
  }, [shouldFocusActiveChatTextarea, setShouldFocusActiveChatTextarea]);

  return (
    <div className="space-y-2 rounded-lg border bg-white p-2">
      {selectionContent && (
        <div className="border pr-3">
          <StaticEditor value={selectionContent} />
        </div>
      )}
      <TextareaAutoResize
        ref={textAreaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="border p-2 shadow-none focus-visible:ring-0"
        rows={2}
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

const CodeInline = ({ children }: { children?: ReactNode }) => {
  return (
    <code className="rounded bg-gray-300 px-1 py-0.5 text-sm text-gray-800">
      {children}
    </code>
  );
};

const CodeBlock = ({ children }: { children?: ReactNode }) => {
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

  let codeContentString = codeContent;
  codeContentString = codeContentString.replace(/\n+$/, "");

  return <ApplyCodeBlock codeContent={codeContentString} />;
};
