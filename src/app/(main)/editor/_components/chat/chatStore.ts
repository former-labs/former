import { useDatabaseMetadata } from "@/contexts/databaseMetadataStore";
import { api } from "@/trpc/react";
import type { DatabaseMetadata } from "@/types/connections";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

type UserChatMessageType = {
  type: "user";
  content: string;
  editorSelectionContent: string | null;
}

type AssistantChatMessageType = {
  type: "assistant";
  content: string;
  knowledgeSources: Array<{
    key: number;
    knowledgeSourceIds: string[];
  }>;
}

export type ChatMessageType = UserChatMessageType | AssistantChatMessageType;

type ChatType = {
  chatId: string;
  messages: ChatMessageType[];
  createdAt: Date;
  pendingEditorSelectionContent: string | null;
}

type ChatStore = {
  chats: ChatType[];
  activeChatId: string | null;
  shouldFocusActiveChatTextarea: boolean;
  setActiveChatId: (chatId: string) => void;
  setChats: (chats: ChatType[]) => void;
  addMessage: (chatId: string, message: ChatMessageType) => void;
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
  const { databaseMetadata } = useDatabaseMetadata();
  const chatStore = useChatStore();
  
  const activeChat = chatStore.chats.find(
    (chat) => chat.chatId === chatStore.activeChatId
  );

  const submitMessageMutation = api.editor.submitMessage.useMutation();
  const { data: knowledgeList = [] } = api.knowledge.listKnowledge.useQuery();
  const { data: instructions, isLoading: instructionsLoading } = api.instructions.getInstructions.useQuery();

  const createChat = ({
    editorSelectionContent
  }: {
    editorSelectionContent: string | null;
  }) => {
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
      pendingEditorSelectionContent: editorSelectionContent
    };

    // Add the new chat to the beginning of the list
    chatStore.setChats([newChat, ...updatedChats]);
    chatStore.setActiveChatId(chatId);
    chatStore.setShouldFocusActiveChatTextarea(true);
    return chatId;
  };

  const submitMessage = async ({
    message,
    editorContent
  }: {
    message: string;
    editorContent: string;
  }) => {
    if (!chatStore.activeChatId || !activeChat) return;
    if (instructionsLoading) return;

    const newMessage: UserChatMessageType = {
      type: "user",
      content: message,
      editorSelectionContent: activeChat.pendingEditorSelectionContent,
    };

    const filteredDatabaseMetadata = databaseMetadata ? filterDatabaseMetadataContext(databaseMetadata) : null;

    const responsePromise = submitMessageMutation.mutateAsync({
      messages: [...activeChat.messages, newMessage],
      editorContent,
      editorSelectionContent: activeChat.pendingEditorSelectionContent,
      databaseMetadata: filteredDatabaseMetadata,
      knowledge: knowledgeList,
      instructions: instructions ?? "",
    });

    // Clear the pending editor selection content after creating the message
    chatStore.setChats(chatStore.chats.map(chat => 
      chat.chatId === chatStore.activeChatId 
        ? { ...chat, pendingEditorSelectionContent: null }
        : chat
    ));

    chatStore.addMessage(chatStore.activeChatId, newMessage);
    const response = await responsePromise;
    chatStore.addMessage(chatStore.activeChatId, {
      ...response.message,
    });
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
    dialect: metadata.dialect,
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
