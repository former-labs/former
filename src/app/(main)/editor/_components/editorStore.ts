import type { Selection } from 'monaco-editor';
import { create } from "zustand";

interface EditorStore {
  editorContent: string;
  editorContentPending: string | null;
  editorSelection: Selection | null;
  setEditorContent: (content: string) => void;
  setEditorContentPending: (content: string | null) => void;
  setEditorSelection: (selection: Selection | null) => void;
}

const useEditorStore = create<EditorStore>((set, get) => ({
  editorContent: "",
  editorContentPending: null,
  editorSelection: null,
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
  setEditorSelection: (selection) => {
    console.log("setEditorSelection", selection);
    set({ editorSelection: selection });
  },
}));

export const useEditor = () => {
  const store = useEditorStore();

  const editorSelectionContent = getEditorSelectionContent({
    editorSelection: store.editorSelection,
    editorContent: store.editorContent
  });

  return {
    editorContent: store.editorContent,
    editorContentPending: store.editorContentPending,
    editorSelection: store.editorSelection,
    editorSelectionContent,
    setEditorContent: store.setEditorContent,
    setEditorContentPending: store.setEditorContentPending,
    setEditorSelection: store.setEditorSelection,
  };
};

const getEditorSelectionContent = ({
  editorSelection,
  editorContent
}: {
  editorSelection: Selection | null;
  editorContent: string;
}) => {
  if (!editorSelection || !editorContent) return null;

  if (
    editorSelection.startLineNumber === editorSelection.endLineNumber &&
    editorSelection.startColumn === editorSelection.endColumn
  ) {
    return null;
  }

  const getPositionOffset = (content: string, lineNumber: number, column: number) => {
    let offset = 0;
    let currentLine = 1;

    // Find the start of the target line
    while (currentLine < lineNumber) {
      const nextNewline = content.indexOf('\n', offset);
      if (nextNewline === -1) break;
      offset = nextNewline + 1;
      currentLine++;
    }

    // Add the column offset
    return offset + column - 1;
  };

  return editorContent.slice(
    getPositionOffset(
      editorContent,
      editorSelection.startLineNumber,
      editorSelection.startColumn
    ),
    getPositionOffset(
      editorContent,
      editorSelection.endLineNumber,
      editorSelection.endColumn
    )
  );
};
