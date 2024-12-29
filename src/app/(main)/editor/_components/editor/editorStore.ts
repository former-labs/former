import { getEditorSelectionContent } from '@/lib/editorHelpers';
import type { Selection } from 'monaco-editor';
import { v4 as uuidv4 } from 'uuid';
import { create } from "zustand";

interface Editor {
  id: string;
  editorContent: string;
  editorContentPending: string | null;
  editorSelection: Selection | null;
}

interface EditorStore {
  editorList: Editor[];
  activeEditorId: string;
  setEditorContent: (content: string) => void;
  setEditorContentPending: (content: string | null) => void;
  setEditorSelection: (selection: Selection | null) => void;
  setActiveEditorId: (id: string) => void;
  createEditor: () => void;
  deleteEditor: (id: string) => void;
}

const initialEditorId = uuidv4();

const useEditorStore = create<EditorStore>((set, get) => ({
  editorList: [{
    id: initialEditorId,
    editorContent: "",
    editorContentPending: null,
    editorSelection: null
  }],
  activeEditorId: initialEditorId,
  setEditorContent: (content) => {
    set((state) => {
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          // If the editor content is set to the same as the pending content,
          // this is equivalent to accepting all changes.
          // In this case we disable the diff editor by setting the pending content to null.
          const newPending = editor.editorContentPending === content ? null : editor.editorContentPending;
          return {
            ...editor,
            editorContent: content,
            editorContentPending: newPending
          };
        }
        return editor;
      });
      return { editorList: newEditorList };
    });
  },
  setEditorContentPending: (content) => {
    set((state) => {
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          // If the pending content is set to the same as the editor content,
          // this is equivalent to accepting all changes.
          // In this case we disable the diff editor by setting the pending content to null.
          const newPending = editor.editorContent === content ? null : content;
          return {
            ...editor,
            editorContentPending: newPending
          };
        }
        return editor;
      });
      return { editorList: newEditorList };
    });
  },
  setEditorSelection: (selection) => {
    set((state) => {
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          return {
            ...editor,
            editorSelection: selection
          };
        }
        return editor;
      });
      return { editorList: newEditorList };
    });
  },
  setActiveEditorId: (id) => {
    set({ activeEditorId: id });
  },
  createEditor: () => {
    const newId = uuidv4();
    set((state) => ({
      editorList: [...state.editorList, {
        id: newId,
        editorContent: "",
        editorContentPending: null,
        editorSelection: null
      }],
      activeEditorId: newId
    }));
  },
  deleteEditor: (id) => {
    set((state) => {
      // Don't allow deleting the last editor
      if (state.editorList.length <= 1) {
        return state;
      }

      const currentIndex = state.editorList.findIndex(editor => editor.id === id);
      if (currentIndex === -1) return state;

      const newEditorList = state.editorList.filter(editor => editor.id !== id);

      // Only need to handle active editor change if we're deleting the active one
      if (id === state.activeEditorId) {
        // Try to select the editor to the right
        const nextEditor = state.editorList[currentIndex + 1];
        // If there isn't one, select the editor to the left
        const prevEditor = state.editorList[currentIndex - 1];
        const newActiveId = nextEditor?.id || prevEditor?.id;

        return {
          editorList: newEditorList,
          activeEditorId: newActiveId
        };
      }

      return { editorList: newEditorList };
    });
  }
}));

export const useEditor = () => {
  const store = useEditorStore();

  const activeEditor = store.editorList.find(editor => editor.id === store.activeEditorId);
  if (!activeEditor) {
    throw new Error("Active editor not found");
  }

  const editorSelectionContent = getEditorSelectionContent({
    editorSelection: activeEditor.editorSelection,
    editorContent: activeEditor.editorContent
  });

  return {
    editorContent: activeEditor.editorContent,
    editorContentPending: activeEditor.editorContentPending,
    editorSelection: activeEditor.editorSelection,
    editorSelectionContent,
    editorList: store.editorList,
    activeEditorId: store.activeEditorId,
    setEditorContent: store.setEditorContent,
    setEditorContentPending: store.setEditorContentPending,
    setEditorSelection: store.setEditorSelection,
    setActiveEditorId: store.setActiveEditorId,
    createEditor: store.createEditor,
    deleteEditor: store.deleteEditor,
  };
};
