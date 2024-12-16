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

  const createChat = () => {
    const chatId = uuidv4();
    const newChat = { chatId, messages: [] };
    store.setChats([...store.chats, newChat]);
    store.setActiveChatId(chatId);
    return chatId;
  };

  return {
    chats: store.chats,
    activeChat,
    activeChatId: store.activeChatId,
    setActiveChatId: store.setActiveChatId,
    createChat,
    addMessage: store.addMessage,
  };
};
