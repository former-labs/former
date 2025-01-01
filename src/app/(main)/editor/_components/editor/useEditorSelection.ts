
"use client";

import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect } from "react";
import { useActiveEditor } from "./editorStore";

export const useEditorSelection = ({
  codeEditor,
  diffEditor,
}: {
  codeEditor: editor.IStandaloneCodeEditor | null;
  diffEditor: editor.IStandaloneDiffEditor | null;
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

  // Sync diff editor selection
  useEffect(() => {
    if (!diffEditor || !editorSelection) return;

    const modifiedEditor = diffEditor.getModifiedEditor();
    const currentSelection = modifiedEditor.getSelection();
    if (!currentSelection?.equalsSelection(editorSelection)) {
      modifiedEditor.setSelection(editorSelection);
    }
  }, [diffEditor, editorSelection]);

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

  // Listen for diff editor selection changes
  useEffect(() => {
    if (!diffEditor) return;

    const modifiedEditor = diffEditor.getModifiedEditor();

    // Set initial selection if none exists
    if (!editorSelection) {
      const initialSelection = modifiedEditor.getSelection();
      if (initialSelection) {
        setEditorSelection(initialSelection);
      }
    }
    
    const disposable = modifiedEditor.onDidChangeCursorSelection((e) => {
      if (!editorSelection || !e.selection.equalsSelection(editorSelection)) {
        setEditorSelection(e.selection);
      }
    });

    return () => disposable.dispose();
  }, [diffEditor, editorSelection, setEditorSelection]);
};
