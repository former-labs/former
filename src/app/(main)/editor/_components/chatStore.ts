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
  const store = useChatStore();
  const { editorContent } = useEditor();
  
  const activeChat = store.chats.find(
    (chat) => chat.chatId === store.activeChatId
  );

  const submitMessageMutation = api.editor.submitMessage.useMutation();

  const createChat = () => {
    const chatId = uuidv4();
    const newChat = { 
      chatId, 
      messages: [],
      createdAt: new Date()
    };
    store.setChats([newChat, ...store.chats]);
    store.setActiveChatId(chatId);
    return chatId;
  };

  const submitMessage = async ({
    message
  }: {
    message: string;
  }) => {
    if (!store.activeChatId || !activeChat) return;

    const newMessage = {
      type: "user" as const,
      content: message,
    };

    const responsePromise = submitMessageMutation.mutateAsync({
      messages: [...activeChat.messages, newMessage],
      editorContent,
    });

    store.addMessage(store.activeChatId, newMessage);
    const response = await responsePromise;
    store.addMessage(store.activeChatId, response.message);
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
