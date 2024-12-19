"use client";

import { Editor } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";

export const StaticEditor = ({ value }: { value: string }) => {
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    const updateEditorHeight = () => {
      const contentHeight = editor.getContentHeight();
      const editorElement = editor.getDomNode();

      if (editorElement) {
        editorElement.style.height = `${contentHeight}px`;
        editor.layout();
      }
    };

    editor.onDidContentSizeChange(updateEditorHeight);
    updateEditorHeight();
  };

  return (
    <Editor
      onMount={handleEditorDidMount}
      language="sql"
      value={value}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        readOnly: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: "off",
        lineDecorationsWidth: 0,
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          ignoreHorizontalScrollbarInContentHeight: true,
          alwaysConsumeMouseWheel: false,
        },
        renderLineHighlight: "none",
      }}
    />
  );
};
