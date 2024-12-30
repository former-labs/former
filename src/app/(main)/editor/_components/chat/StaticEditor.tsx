"use client";

import { Editor } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";

export const StaticEditor = ({ value }: { value: string }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateEditorHeight = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const contentHeight = editor.getContentHeight();
    const container = containerRef.current;
    if (container) {
      // Add a small buffer to prevent scrollbar from appearing
      container.style.height = `${contentHeight + 2}px`;
      editor.layout();
    }
  };

  useEffect(() => {
    // Update height when value changes
    updateEditorHeight();
  }, [value]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.onDidContentSizeChange(updateEditorHeight);
    updateEditorHeight();
  };

  return (
    <div ref={containerRef} style={{ minHeight: "1em" }}>
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
    </div>
  );
};
