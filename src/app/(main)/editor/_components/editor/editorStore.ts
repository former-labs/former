import { getEditorSelectionContent } from '@/lib/editorHelpers';
import type { Selection } from 'monaco-editor';
import { v4 as uuidv4 } from 'uuid';
import { create } from "zustand";

interface Editor {
  id: string;
  title: string;
  editorContent: string;
  editorContentPending: string | null;
  editorSelection: Selection | null;
  inlinePromptWidgets: {
    id: string;
    lineNumber: number;
    text: string;
  }[];
}

interface EditorStore {
  editorList: Editor[];
  activeEditorId: string;
  nextEditorNumber: number;
  setEditorContent: (content: string) => void;
  setEditorContentPending: (content: string | null) => void;
  setEditorSelection: (selection: Selection | null) => void;
  setActiveEditorId: (id: string) => void;
  createEditor: () => void;
  deleteEditor: (id: string) => void;
  setInlinePromptWidgets: (widgets: { id: string; lineNumber: number; text: string; }[]) => void;
}

const initialEditorId = uuidv4();

const useEditorStore = create<EditorStore>((set, get) => ({
  editorList: [{
    id: initialEditorId,
    title: "Query 1",
    editorContent: "",
    editorContentPending: null,
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
      if (!state.activeEditorId) return state;
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
  setInlinePromptWidgets: (widgets) => {
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
        editorContentPending: null,
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
            editorContentPending: null,
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
  }
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

export const useActiveEditor = () => {
  const store = useEditorStore();

  if (!store.activeEditorId) {
    throw new Error("No active editor selected");
  }

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
    inlinePromptWidgets: activeEditor.inlinePromptWidgets,
    setEditorContent: store.setEditorContent,
    setEditorContentPending: store.setEditorContentPending,
    setEditorSelection: store.setEditorSelection,
    setInlinePromptWidgets: store.setInlinePromptWidgets,
  };
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
    text: widget.text,
    setText: (text: string) => setInlinePromptWidgets(
      inlinePromptWidgets.map(w => 
        w.id === id ? { ...w, text } : w
      )
    ),
    removePromptWidget
  };
};
