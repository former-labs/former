import { create } from "zustand";

interface EditorStore {
  editorContent: string;
  editorContentPending: string | null;
  setEditorContent: (content: string) => void;
  setEditorContentPending: (content: string | null) => void;
}

const useEditorStore = create<EditorStore>((set, get) => ({
  editorContent: "",
  editorContentPending: null,
  setEditorContent: (content) => {
    set({ editorContent: content });

    // If the editor content is set to the same as the pending content,
    // this is equivalent to accepting all changes.
    // In this case we disable the diff editor by setting the pending content to null.
    const state = get();
    if (state.editorContentPending === content) {
      set({ editorContentPending: null });
    }
  },
  setEditorContentPending: (content) => {
    set({ editorContentPending: content });

    // If the pending content is set to the same as the editor content,
    // this is equivalent to accepting all changes.
    // In this case we disable the diff editor by setting the pending content to null.
    const state = get();
    if (state.editorContent === content) {
      set({ editorContentPending: null });
    }
  },
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
