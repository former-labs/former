"use client";

import { Button } from "@/components/ui/button";
import { DiffEditor, Editor } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useRef, useState } from "react";

export default function Page() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorContentPending, setEditorContentPending] = useState<
    string | null
  >(null);
  const [renderSideBySide, setRenderSideBySide] = useState(false);
  const [diffWidgets, setDiffWidgets] = useState<editor.IContentWidget[]>([]);

  console.log("editor content", [editorContent, editorContentPending]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  class DiffWidget implements editor.IContentWidget {
    private readonly domNode: HTMLElement;
    private readonly id: string;
    private readonly lineNumber: number;
    private readonly diffEditor: editor.IStandaloneDiffEditor;

    constructor(
      id: string,
      lineNumber: number,
      diffEditor: editor.IStandaloneDiffEditor,
    ) {
      this.id = id;
      this.lineNumber = lineNumber;
      this.diffEditor = diffEditor;

      this.domNode = document.createElement("div");
      const button = document.createElement("button");
      button.innerText = "Apply";
      button.className =
        "bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs";
      button.onclick = () => {
        const changes = this.diffEditor.getLineChanges();
        const relevantChange = changes?.find(
          (c) =>
            c.modifiedStartLineNumber <= lineNumber &&
            c.modifiedEndLineNumber >= lineNumber,
        );
        console.log("Apply change:", relevantChange);
      };
      this.domNode.appendChild(button);
    }

    getId(): string {
      return `diff-widget-${this.id}`;
    }

    getDomNode(): HTMLElement {
      return this.domNode;
    }

    getPosition(): editor.IContentWidgetPosition {
      return {
        position: {
          lineNumber: this.lineNumber,
          column: 1,
        },
        preference: [editor.ContentWidgetPositionPreference.BELOW],
      };
    }
  }

  const handleDiffEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;

    // Get the modified editor and listen for changes
    const modifiedEditor = editor.getModifiedEditor();
    // modifiedEditor.onDidChangeModelContent(() => {
    modifiedEditor.onDidChangeModelContent(() => {
      console.log("modifiedEditor.onDidChangeModelContent");
      // setEditorContentPending(modifiedEditor.getValue());
      updateDiffWidgets(editor);
    });

    // Get the original editor and listen for changes
    const originalEditor = editor.getOriginalEditor();
    // originalEditor.onDidChangeModelContent(() => {
    originalEditor.onDidChangeModelContent(() => {
      console.log("originalEditor.onDidChangeModelContent");
      // setEditorContentPending(originalEditor.getValue());
      updateDiffWidgets(editor);
    });

    // Initial widget setup
    updateDiffWidgets(editor);
  };

  // Keep a reference to current widgets outside of React state
  let currentWidgets: editor.IContentWidget[] = [];

  const updateDiffWidgets = (editor: editor.IStandaloneDiffEditor) => {
    // Remove existing widgets
    if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      currentWidgets.forEach((widget) => {
        modifiedEditor.removeContentWidget(widget);
      });
    }

    currentWidgets = [];

    // Add new widgets for each change
    const changes = editor.getLineChanges();

    changes?.forEach((change, index) => {
      const widget = new DiffWidget(
        `${index}`,
        change.modifiedEndLineNumber,
        editor,
      );
      editor.getModifiedEditor().addContentWidget(widget);
      currentWidgets.push(widget);
    });

    // Update React state if needed for other purposes
    setDiffWidgets(currentWidgets);
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

  const removeWidgets = () => {
    console.log("removing diff widgets", diffWidgets);
    if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      diffWidgets.forEach((widget) => {
        console.log("removing widget", widget);
        modifiedEditor.removeContentWidget(widget);
      });
      setDiffWidgets([]);
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
        <Button onClick={removeWidgets}>Remove widgets</Button>
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
