"use client";

import { create } from "zustand";

export const usePendingMessageStore = create<{
  pendingUserMessage: string;
  setPendingUserMessage: (message: string) => void;
  clearPendingUserMessage: () => void;
}>((set) => ({
  pendingUserMessage: "",
  setPendingUserMessage: (message) => set({ pendingUserMessage: message }),
  clearPendingUserMessage: () => set({ pendingUserMessage: "" }),
}));
