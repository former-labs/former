import { useData } from "@/contexts/DataContext";
import { api } from "@/trpc/react";
import type { DatabaseMetadata } from "@/types/connections";
import type { Selection } from "monaco-editor";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { useEditor } from "../editor/editorStore";

interface ChatMessage {
  type: "assistant" | "user";
  content: string;
}

interface Chat {
  chatId: string;
  messages: ChatMessage[];
  createdAt: Date;
  pendingEditorSelection: Selection | null;
}

interface ChatStore {
  chats: Chat[];
  activeChatId: string | null;
  shouldFocusActiveChatTextarea: boolean;
  setActiveChatId: (chatId: string) => void;
  setChats: (chats: Chat[]) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  setShouldFocusActiveChatTextarea: (value: boolean) => void;
}

const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChatId: null,
  shouldFocusActiveChatTextarea: false,
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
  setShouldFocusActiveChatTextarea: (value) => set({ shouldFocusActiveChatTextarea: value }),
}));

export const useChat = () => {
  const { databaseMetadata } = useData();

  const chatStore = useChatStore();
  const { editorContent, editorSelection } = useEditor();
  
  const activeChat = chatStore.chats.find(
    (chat) => chat.chatId === chatStore.activeChatId
  );

  const submitMessageMutation = api.editor.submitMessage.useMutation();

  const { data: knowledgeList = [] } = api.knowledge.listKnowledge.useQuery();

  const createChat = () => {
    // If there's an active chat with no messages, remove it first
    let updatedChats = [...chatStore.chats];
    if (activeChat && activeChat.messages.length === 0) {
      updatedChats = updatedChats.filter(chat => chat.chatId !== activeChat.chatId);
    }

    const chatId = uuidv4();
    const newChat = { 
      chatId, 
      messages: [],
      createdAt: new Date(),
      pendingEditorSelection: editorSelection
    };

    // Add the new chat to the beginning of the list
    chatStore.setChats([newChat, ...updatedChats]);
    chatStore.setActiveChatId(chatId);
    chatStore.setShouldFocusActiveChatTextarea(true);
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

    console.log("original metadata", databaseMetadata);
    const filteredDatabaseMetadata = filterDatabaseMetadataContext(databaseMetadata);
    console.log("filtered metadata", filteredDatabaseMetadata);

    const responsePromise = submitMessageMutation.mutateAsync({
      messages: [...activeChat.messages, newMessage],
      editorContent,
      editorSelection: activeChat.pendingEditorSelection,
      databaseMetadata: filteredDatabaseMetadata,
      knowledge: knowledgeList,
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
    shouldFocusActiveChatTextarea: chatStore.shouldFocusActiveChatTextarea,
    setShouldFocusActiveChatTextarea: chatStore.setShouldFocusActiveChatTextarea,
  };
};

export const filterDatabaseMetadataContext = (metadata: DatabaseMetadata): DatabaseMetadata => {
  return {
    projects: metadata.projects
      .map(project => ({
        ...project,
        datasets: project.datasets
          .map(dataset => ({
            ...dataset,
            tables: dataset.tables
              .filter(table => table.includedInAIContext)
              .map(({ includedInAIContext: _, ...table }) => table)
          }))
          .filter(dataset => dataset.tables.length > 0)
      }))
      .filter(project => project.datasets.length > 0)
  };
};
