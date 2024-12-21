"use client";

import type { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect } from "react";

export const useEditorKeybind = ({
  id,
  callback,
  keybinding,
  codeEditor,
  diffEditor,
}: {
  id: string;
  callback: () => Promise<void>;
  keybinding: number | null;
  codeEditor: editor.IStandaloneCodeEditor | null;
  diffEditor: editor.IStandaloneDiffEditor | null;
}) => {
  useEffect(() => {
    if (!keybinding || !codeEditor) return;

    const disposable = codeEditor.addAction({
      id,
      label: id,
      keybindings: [keybinding],
      run: () => {
        void callback();
      },
    });

    return () => {
      disposable.dispose();
    };
  }, [callback, codeEditor, keybinding, id]);

  useEffect(() => {
    if (!keybinding || !diffEditor) return;

    const modifiedEditor = diffEditor.getModifiedEditor();
    const disposable = modifiedEditor.addAction({
      id,
      label: id,
      keybindings: [keybinding],
      run: () => {
        void callback();
      },
    });

    return () => {
      disposable.dispose();
    };
  }, [callback, diffEditor, keybinding, id]);
};