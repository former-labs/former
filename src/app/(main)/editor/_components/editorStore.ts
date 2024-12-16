import { create } from "zustand";

interface EditorStore {
  editorContent: string;
  editorContentPending: string | null;
  setEditorContent: (content: string) => void;
  setEditorContentPending: (content: string | null) => void;
}

const useEditorStore = create<EditorStore>((set) => ({
  editorContent: "",
  editorContentPending: null,
  setEditorContent: (content) => set({ editorContent: content }),
  setEditorContentPending: (content) => set({ editorContentPending: content }),
}));

export const useEditor = () => {
  const store = useEditorStore();

  return {
    editorContent: store.editorContent,
    editorContentPending: store.editorContentPending,
    setEditorContent: store.setEditorContent,
    setEditorContentPending: store.setEditorContentPending,
  };
};
