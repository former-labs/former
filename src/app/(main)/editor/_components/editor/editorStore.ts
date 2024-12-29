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
  };
};
