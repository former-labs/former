import { getEditorSelectionContent } from '@/lib/editorHelpers';
import type { Selection } from 'monaco-editor';
import { v4 as uuidv4 } from 'uuid';
import { create } from "zustand";

interface Editor {
  id: string;
  title: string;
  editorContent: string;
  editorContentOld: string | null;
  editorSelection: Selection | null;
  inlinePromptWidgets: {
    id: string;
    lineNumberStart: number;
    lineNumberEnd: number;
    text: string;
  }[];
}

interface EditorStore {
  editorList: Editor[];
  activeEditorId: string;
  nextEditorNumber: number;
  setEditorContent: (content: string) => void;
  setEditorContentOld: (content: string | null) => void;
  setEditorContentDiff: (content: string) => void;
  setEditorSelection: (selection: Selection | null) => void;
  setActiveEditorId: (id: string) => void;
  createEditor: () => void;
  deleteEditor: (id: string) => void;
  setInlinePromptWidgets: (widgets: {
    id: string;
    lineNumberStart: number;
    lineNumberEnd: number;
    text: string;
  }[]) => void;
}

const initialEditorId = uuidv4();

const useEditorStore = create<EditorStore>((set, get) => ({
  editorList: [{
    id: initialEditorId,
    title: "Query 1",
    editorContent: "",
    editorContentOld: null,
    editorSelection: null,
    inlinePromptWidgets: []
  }],
  activeEditorId: initialEditorId,
  nextEditorNumber: 2,
  setEditorContent: (content) => {
    set((state) => {
      if (!state.activeEditorId) return state;
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          return {
            ...editor,
            editorContent: content,
            editorContentOld: content === editor.editorContentOld ? null : editor.editorContentOld
          };
        }
        return editor;
      });
      return { editorList: newEditorList };
    });
  },
  setEditorContentOld: (content) => {
    set((state) => {
      if (!state.activeEditorId) return state;
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          // If the old content is set to the same as the editor content,
          // this is equivalent to accepting all changes.
          // In this case we disable the diff editor by setting the old content to null.
          const newOld = editor.editorContent === content ? null : content;
          return {
            ...editor,
            editorContentOld: newOld
          };
        }
        return editor;
      });
      return { editorList: newEditorList };
    });
  },
  /**
   * Use this to set the editor content and activate a diff for the changes.
   */
  setEditorContentDiff: (content) => {
    set((state) => {
      if (!state.activeEditorId) return state;
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          return {
            ...editor,
            editorContentOld: content === editor.editorContent ? null : editor.editorContent,
            editorContent: content
          };
        }
        return editor;
      });
      return { editorList: newEditorList };
    });
  },
  setEditorSelection: (selection) => {
    set((state) => {
      if (!state.activeEditorId) return state;
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
  setInlinePromptWidgets: (widgets: { id: string; lineNumberStart: number; lineNumberEnd: number; text: string; }[]) => {
    set((state) => {
      if (!state.activeEditorId) return state;
      const newEditorList = state.editorList.map(editor => {
        if (editor.id === state.activeEditorId) {
          return {
            ...editor,
            inlinePromptWidgets: widgets
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
        title: `Query ${state.nextEditorNumber}`,
        editorContent: "",
        editorContentOld: null,
        editorSelection: null,
        inlinePromptWidgets: []
      }],
      activeEditorId: newId,
      nextEditorNumber: state.nextEditorNumber + 1
    }));
  },
  deleteEditor: (id) => {
    set((state) => {
      if (state.editorList.length <= 1) {
        const newId = uuidv4();
        return {
          editorList: [{
            id: newId,
            title: `Query ${state.nextEditorNumber}`,
            editorContent: "",
            editorContentOld: null,
            editorSelection: null,
            inlinePromptWidgets: []
          }],
          activeEditorId: newId,
          nextEditorNumber: state.nextEditorNumber + 1
        };
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
  },
}));

export const useEditor = () => {
  const store = useEditorStore();
  return {
    editorList: store.editorList,
    activeEditorId: store.activeEditorId,
    setActiveEditorId: store.setActiveEditorId,
    createEditor: store.createEditor,
    deleteEditor: store.deleteEditor,
  };
};

const getActiveEditorData = (state: EditorStore) => {
  if (!state.activeEditorId) {
    throw new Error("No active editor selected");
  }

  const activeEditor = state.editorList.find(editor => editor.id === state.activeEditorId);
  if (!activeEditor) {
    throw new Error("Active editor not found");
  }

  const editorSelectionContent = getEditorSelectionContent({
    editorSelection: activeEditor.editorSelection,
    editorContent: activeEditor.editorContent
  });

  return {
    editorContent: activeEditor.editorContent,
    editorContentOld: activeEditor.editorContentOld,
    editorSelection: activeEditor.editorSelection,
    editorSelectionContent,
    inlinePromptWidgets: activeEditor.inlinePromptWidgets,
    setEditorContent: state.setEditorContent,
    setEditorContentOld: state.setEditorContentOld,
    setEditorContentDiff: state.setEditorContentDiff,
    setEditorSelection: state.setEditorSelection,
    setInlinePromptWidgets: state.setInlinePromptWidgets,
  };
};

export const getActiveEditor = () => {
  const state = useEditorStore.getState();
  return getActiveEditorData(state);
};

export const useActiveEditor = () => {
  const store = useEditorStore();
  return getActiveEditorData(store);
};

export const useActiveEditorInlinePromptWidget = (id: string) => {
  const { inlinePromptWidgets, setInlinePromptWidgets } = useActiveEditor();

  const widget = inlinePromptWidgets.find(w => w.id === id);
  if (!widget) {
    throw new Error(`Prompt widget with id ${id} not found`);
  }

  const removePromptWidget = () => {
    setInlinePromptWidgets(
      inlinePromptWidgets.filter((w) => w.id !== id)
    );
  };

  return {
    lineNumberStart: widget.lineNumberStart,
    lineNumberEnd: widget.lineNumberEnd,
    text: widget.text,
    setText: (text: string) => setInlinePromptWidgets(
      inlinePromptWidgets.map(w => 
        w.id === id ? { ...w, text } : w
      )
    ),
    removePromptWidget
  };
};
