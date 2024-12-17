import { useData } from "@/contexts/DataContext";
import { api } from "@/trpc/react";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { useEditor } from "./editorStore";

interface ChatMessage {
  type: "assistant" | "user";
  content: string;
}

interface Chat {
  chatId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (chatId: string) => void;
  setChats: (chats: Chat[]) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
}

const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChatId: null,
  setActiveChatId: (chatId) => {
    set({ activeChatId: chatId });
  },
  setChats: (chats) => {
    set({ chats });
  },
  addMessage: (chatId, message) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.chatId === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      ),
    }));
  },
}));

export const useChat = () => {
  const { databaseMetadata } = useData();

  const chatStore = useChatStore();
  const { editorContent } = useEditor();
  
  const activeChat = chatStore.chats.find(
    (chat) => chat.chatId === chatStore.activeChatId
  );

  const submitMessageMutation = api.editor.submitMessage.useMutation();

  const createChat = () => {
    const chatId = uuidv4();
    const newChat = { 
      chatId, 
      messages: [],
      createdAt: new Date()
    };
    chatStore.setChats([newChat, ...chatStore.chats]);
    chatStore.setActiveChatId(chatId);
    return chatId;
  };

  const submitMessage = async ({
    message
  }: {
    message: string;
  }) => {
    if (!chatStore.activeChatId || !activeChat || !databaseMetadata) return;

    const newMessage = {
      type: "user" as const,
      content: message,
    };

    console.log("metadata", databaseMetadata);

    const responsePromise = submitMessageMutation.mutateAsync({
      messages: [...activeChat.messages, newMessage],
      editorContent,
      databaseMetadata,
    });

    chatStore.addMessage(chatStore.activeChatId, newMessage);
    const response = await responsePromise;
    chatStore.addMessage(chatStore.activeChatId, response.message);
  };

  return {
    chats: chatStore.chats,
    activeChat,
    activeChatId: chatStore.activeChatId,
    setActiveChatId: chatStore.setActiveChatId,
    createChat,
    submitMessage,
  };
};
