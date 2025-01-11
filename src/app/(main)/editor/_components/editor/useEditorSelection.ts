
"use client";

import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect } from "react";
import { useActiveEditor } from "./editorStore";

export const useEditorSelection = ({
  codeEditor,
}: {
  codeEditor: editor.IStandaloneCodeEditor | null;
}) => {
  const { editorSelection, setEditorSelection } = useActiveEditor();

  // Sync code editor selection
  useEffect(() => {
    if (!codeEditor || !editorSelection) return;

    const currentSelection = codeEditor.getSelection();
    if (!currentSelection?.equalsSelection(editorSelection)) {
      codeEditor.setSelection(editorSelection);
    }
  }, [codeEditor, editorSelection]);

  // Listen for code editor selection changes and set initial selection
  useEffect(() => {
    if (!codeEditor) return;

    // Set initial selection if none exists
    if (!editorSelection) {
      const initialSelection = codeEditor.getSelection();
      if (initialSelection) {
        setEditorSelection(initialSelection);
      }
    }

    const disposable = codeEditor.onDidChangeCursorSelection((e) => {
      if (!editorSelection || !e.selection.equalsSelection(editorSelection)) {
        setEditorSelection(e.selection);
      }
    });

    return () => disposable.dispose();
  }, [codeEditor, editorSelection, setEditorSelection]);
};
