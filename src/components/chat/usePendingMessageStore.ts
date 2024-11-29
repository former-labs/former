"use client";

import { create } from "zustand";

/**
 * This store is used to temporarily store a user message before a response from the
 * server is received.
 * 
 * This is how we do optimistic updates.
 */
export const usePendingMessageStore = create<{
  pendingUserMessage: string;
  setPendingUserMessage: (message: string) => void;
  clearPendingUserMessage: () => void;
}>((set) => ({
  pendingUserMessage: "",
  setPendingUserMessage: (message) => set({ pendingUserMessage: message }),
  clearPendingUserMessage: () => set({ pendingUserMessage: "" }),
}));
