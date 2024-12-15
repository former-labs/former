"use client";

import { Button } from "@/components/ui/button";
import { DiffEditor, Editor } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useRef, useState } from "react";

export default function Page() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorContentPending, setEditorContentPending] = useState<
    string | null
  >(null);
  const [renderSideBySide, setRenderSideBySide] = useState(false);

  console.log("editor content", [editorContent, editorContentPending]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const handleDiffEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;

    // Get the modified editor and listen for changes
    const modifiedEditor = editor.getModifiedEditor();
    modifiedEditor.onDidChangeModelContent(() => {
      setEditorContentPending(modifiedEditor.getValue());
    });
  };

  const setCheese = () => {
    setEditorContent("SELECT\n    2;");
  };

  const startDiff = () => {
    setEditorContentPending("SELECT\n    1;");
  };

  const endDiff = () => {
    setEditorContentPending(null);
  };

  const printContent = () => {
    console.log({
      editorContent,
      editorContentPending,
    });

    console.log(diffEditorRef.current?.getLineChanges());
    // console.log(diffEditorRef.current?.getOriginalEditor());
  };

  const setDecorations = () => {
    // if (editorRef.current) {
    //   const model = editorRef.current.getModel();
    //   if (!model) return;
    //   editorRef.current.deltaDecorations([], [
    //     {
    //       range: new model.getLineRange(1),
    //       options: {
    //         isWholeLine: true,
    //         className: "myDecoration",
    //       },
    //     },
    //   ]);
    // }
  };

  const printDecorations = () => {
    if (diffEditorRef.current) {
      console.log(
        diffEditorRef.current.getModel()?.modified.getAllDecorations(),
      );
    }
  };

  return (
    <div className="flex h-full w-full flex-col pb-4 pt-4">
      <div className="mb-4 flex gap-2">
        <Button onClick={setCheese}>Set to Cheese</Button>
        <Button onClick={startDiff}>Start diff</Button>
        <Button onClick={endDiff}>End diff</Button>
        <Button onClick={printContent}>Print editor content</Button>
        <Button onClick={setDecorations}>Set decorations</Button>
        <Button onClick={printDecorations}>Print decorations</Button>
        {editorContentPending !== null && (
          <Button onClick={() => setRenderSideBySide(!renderSideBySide)}>
            {renderSideBySide ? "Inline View" : "Side by Side View"}
          </Button>
        )}
      </div>
      <div className="flex-1">
        {editorContentPending === null ? (
          <Editor
            height="calc(100vh - 120px)"
            className="overflow-hidden border"
            language="sql"
            value={editorContent}
            onChange={(value) => setEditorContent(value ?? "")}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              // wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        ) : (
          <DiffEditor
            height="calc(100vh - 120px)"
            className="overflow-hidden border"
            language="sql"
            original={editorContent}
            modified={editorContentPending}
            onMount={handleDiffEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              // wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderSideBySide,
            }}
          />
        )}
      </div>
    </div>
  );
}
