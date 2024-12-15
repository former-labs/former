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
    private readonly originalStartLineNumber: number;
    private readonly originalEndLineNumber: number;
    private readonly modifiedStartLineNumber: number;
    private readonly modifiedEndLineNumber: number;
    private readonly diffEditor: editor.IStandaloneDiffEditor;

    constructor(
      id: string,
      originalStartLineNumber: number,
      originalEndLineNumber: number,
      modifiedStartLineNumber: number,
      modifiedEndLineNumber: number,
      diffEditor: editor.IStandaloneDiffEditor,
    ) {
      this.id = id;
      this.originalStartLineNumber = originalStartLineNumber;
      this.originalEndLineNumber = originalEndLineNumber;
      this.modifiedStartLineNumber = modifiedStartLineNumber;
      this.modifiedEndLineNumber = modifiedEndLineNumber;
      this.diffEditor = diffEditor;

      this.domNode = document.createElement("div");
      const button = document.createElement("button");
      button.innerText = "Apply";
      button.className =
        "bg-blue-500 hover:bg-blue-700 text-white font-bold py-0.5 px-2 rounded-b text-xs";
      button.onclick = () => {
        const changes = this.diffEditor.getLineChanges();
        const relevantChange = changes?.find(
          (c) =>
            c.originalStartLineNumber === this.originalStartLineNumber &&
            c.originalEndLineNumber === this.originalEndLineNumber &&
            c.modifiedStartLineNumber === this.modifiedStartLineNumber &&
            c.modifiedEndLineNumber === this.modifiedEndLineNumber,
        );
        if (!relevantChange) return;

        console.log("applying diff", relevantChange);

        // Get both models
        const modifiedModel = this.diffEditor.getModel()?.modified;
        const originalModel = this.diffEditor.getModel()?.original;
        if (!modifiedModel || !originalModel) return;

        // Get the full content of both models
        const originalContent = originalModel.getValue();
        const modifiedContent = modifiedModel.getValue();

        const originalLines = originalContent.split("\n");

        // Handle deletion (when modifiedEndLineNumber is 0)
        if (relevantChange.modifiedEndLineNumber === 0) {
          console.log("deleting lines only");
          console.log("old", originalLines);
          // Remove the lines from original
          originalLines.splice(
            relevantChange.originalStartLineNumber - 1,
            relevantChange.originalEndLineNumber -
              relevantChange.originalStartLineNumber +
              1,
          );
          console.log("new", originalLines);
        } else {
          // Get the modified lines for this change
          const modifiedLines = modifiedContent.split("\n");
          const changedContent = modifiedLines
            .slice(
              relevantChange.modifiedStartLineNumber - 1,
              relevantChange.modifiedEndLineNumber,
            )
            .join("\n");

          // Handle insertion of new lines (when originalEndLineNumber is 0)
          if (relevantChange.originalEndLineNumber === 0) {
            // Insert after the originalStartLineNumber
            originalLines.splice(
              relevantChange.originalStartLineNumber,
              0,
              changedContent,
            );
          } else {
            // Regular replacement
            originalLines.splice(
              relevantChange.originalStartLineNumber - 1,
              relevantChange.originalEndLineNumber -
                relevantChange.originalStartLineNumber +
                1,
              changedContent,
            );
          }
        }

        const newContent = originalLines.join("\n");
        setEditorContent(newContent);
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
      // Use dodgy logic to handle when the edit is a deletion only
      return {
        position: {
          lineNumber:
            this.modifiedEndLineNumber === 0
              ? this.modifiedStartLineNumber + 1
              : this.modifiedEndLineNumber,
          column: 1,
        },
        preference: [
          this.modifiedEndLineNumber === 0
            ? editor.ContentWidgetPositionPreference.EXACT
            : editor.ContentWidgetPositionPreference.BELOW,
        ],
      };
    }
  }

  const handleDiffEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;

    // Listen for diff updates instead of content changes
    editor.onDidUpdateDiff(() => {
      console.log("editor.onDidUpdateDiff");
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
    console.log("changes", changes);

    changes?.forEach((change, index) => {
      const widget = new DiffWidget(
        `${index}`,
        change.originalStartLineNumber,
        change.originalEndLineNumber,
        change.modifiedStartLineNumber,
        change.modifiedEndLineNumber,
        editor,
      );
      editor.getModifiedEditor().addContentWidget(widget);
      currentWidgets.push(widget);
    });

    // Update React state if needed for other purposes
    setDiffWidgets(currentWidgets);
  };

  const setInitialContent = () => {
    setEditorContent("SELECT\n    1 as foo,\n    2 as bar\nFROM table_c;");
  };

  const startDiff = () => {
    setEditorContentPending(
      "SELECT\n    1 as foo,\n    3 as zam\nFROM table_c;",
    );
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
        <Button onClick={setInitialContent}>Set Initial Content</Button>
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
