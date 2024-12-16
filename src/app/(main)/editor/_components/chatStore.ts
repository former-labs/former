import { api } from "@/trpc/react";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

interface ChatMessage {
  type: "assistant" | "user";
  content: string;
}

interface Chat {
  chatId: string;
  messages: ChatMessage[];
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
  const store = useChatStore();
  
  const activeChat = store.chats.find(
    (chat) => chat.chatId === store.activeChatId
  );

  const submitMessageMutation = api.editor.submitMessage.useMutation();

  const createChat = () => {
    const chatId = uuidv4();
    const newChat = { chatId, messages: [] };
    store.setChats([...store.chats, newChat]);
    store.setActiveChatId(chatId);
    return chatId;
  };

  const submitMessage = async ({
    message
  }: {
    message: string;
  }) => {
    if (!store.activeChatId) return;

    // Add user message
    store.addMessage(store.activeChatId, {
      type: "user",
      content: message,
    });

    // Get assistant response from API
    const response = await submitMessageMutation.mutateAsync({
      message,
    });

    // Add assistant message
    store.addMessage(store.activeChatId, {
      type: "assistant",
      content: response.message,
    });
  };

  return {
    chats: store.chats,
    activeChat,
    activeChatId: store.activeChatId,
    setActiveChatId: store.setActiveChatId,
    createChat,
    submitMessage,
  };
};
