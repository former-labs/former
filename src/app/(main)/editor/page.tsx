"use client";

import { Button } from "@/components/ui/button";
import { DiffEditor, Editor } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

export default function Page() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorContentPending, setEditorContentPending] = useState<
    string | null
  >(null);
  const [renderSideBySide, setRenderSideBySide] = useState(false);
  const [diffWidgets, setDiffWidgets] = useState<editor.IContentWidget[]>([]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const handleDiffEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    diffEditorRef.current = editor;

    // Listen for diff updates instead of content changes
    editor.onDidUpdateDiff(() => {
      updateDiffWidgets(editor);
    });

    const modifiedEditor = editor.getModifiedEditor();
    modifiedEditor.onDidChangeModelContent(() => {
      setEditorContentPending(modifiedEditor.getValue());
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
      const widget = new DiffWidget({
        id: `${index}`,
        originalStartLineNumber: change.originalStartLineNumber,
        originalEndLineNumber: change.originalEndLineNumber,
        modifiedStartLineNumber: change.modifiedStartLineNumber,
        modifiedEndLineNumber: change.modifiedEndLineNumber,
        diffEditor: editor,
        onApply: (newContent: string) => {
          setEditorContent(newContent);
        },
        onReject: (newContent: string) => {
          setEditorContentPending(newContent);
        },
      });
      editor.getModifiedEditor().addContentWidget(widget);
      currentWidgets.push(widget);
    });

    // Update React state if needed for other purposes
    setDiffWidgets(currentWidgets);
  };

  // Update line numbers when renderSideBySide changes
  useEffect(() => {
    if (diffEditorRef.current) {
      diffEditorRef.current.getModifiedEditor().updateOptions({
        lineNumbers: renderSideBySide ? "on" : "off",
      });
    }
  }, [renderSideBySide, diffEditorRef.current]);

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
    if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      diffWidgets.forEach((widget) => {
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
          <Button
            onClick={() => {
              setRenderSideBySide(!renderSideBySide);
            }}
          >
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
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderSideBySide,

              lightbulb: {
                // This is actually buggy and will not disable in renderSideBySide mode
                // https://github.com/microsoft/monaco-editor/issues/3873
                enabled: editor.ShowLightbulbIconMode.Off,
              },

              // We give this extra width so that it is the same as the regular editor
              lineDecorationsWidth: 26,
            }}
          />
        )}
      </div>
    </div>
  );
}

interface DiffWidgetProps {
  id: string;
  originalStartLineNumber: number;
  originalEndLineNumber: number;
  modifiedStartLineNumber: number;
  modifiedEndLineNumber: number;
  diffEditor: editor.IStandaloneDiffEditor;
  onApply: (newContent: string) => void;
  onReject: (newContent: string) => void;
}

class DiffWidget implements editor.IContentWidget {
  private readonly domNode: HTMLElement;
  private readonly props: DiffWidgetProps;
  private readonly root: ReturnType<typeof createRoot>;

  constructor(props: DiffWidgetProps) {
    this.props = props;

    this.domNode = document.createElement("div");
    this.domNode.style.width = `${this.props.diffEditor.getModifiedEditor().getLayoutInfo().width}px`;

    // Create a new React root and render into it
    this.root = createRoot(this.domNode);
    this.root.render(
      <DiffWidgetButtons
        diffEditor={props.diffEditor}
        originalStartLineNumber={props.originalStartLineNumber}
        originalEndLineNumber={props.originalEndLineNumber}
        modifiedStartLineNumber={props.modifiedStartLineNumber}
        modifiedEndLineNumber={props.modifiedEndLineNumber}
        onApply={props.onApply}
        onReject={props.onReject}
      />,
    );
  }

  getId(): string {
    return `diff-widget-${this.props.id}`;
  }

  getDomNode(): HTMLElement {
    return this.domNode;
  }

  getPosition(): editor.IContentWidgetPosition {
    // Use dodgy logic to handle when the edit is a deletion only
    return {
      position: {
        lineNumber:
          this.props.modifiedEndLineNumber === 0
            ? this.props.modifiedStartLineNumber + 1
            : this.props.modifiedEndLineNumber,
        column: 1,
      },
      preference: [
        this.props.modifiedEndLineNumber === 0
          ? editor.ContentWidgetPositionPreference.EXACT
          : editor.ContentWidgetPositionPreference.BELOW,
      ],
    };
  }
}

const DiffWidgetButtons = ({
  diffEditor,
  originalStartLineNumber,
  originalEndLineNumber,
  modifiedStartLineNumber,
  modifiedEndLineNumber,
  onApply,
  onReject,
}: {
  diffEditor: editor.IStandaloneDiffEditor;
  originalStartLineNumber: number;
  originalEndLineNumber: number;
  modifiedStartLineNumber: number;
  modifiedEndLineNumber: number;
  onApply: (newContent: string) => void;
  onReject: (newContent: string) => void;
}) => {
  const handleClick = () => {
    const changes = diffEditor.getLineChanges();
    const relevantChange = changes?.find(
      (c) =>
        c.originalStartLineNumber === originalStartLineNumber &&
        c.originalEndLineNumber === originalEndLineNumber &&
        c.modifiedStartLineNumber === modifiedStartLineNumber &&
        c.modifiedEndLineNumber === modifiedEndLineNumber,
    );
    if (!relevantChange) return;

    // Get both models
    const modifiedModel = diffEditor.getModel()?.modified;
    const originalModel = diffEditor.getModel()?.original;
    if (!modifiedModel || !originalModel) return;

    // Get the full content of both models
    const originalContent = originalModel.getValue();
    const modifiedContent = modifiedModel.getValue();

    const originalLines = originalContent.split("\n");

    // Handle deletion (when modifiedEndLineNumber is 0)
    if (relevantChange.modifiedEndLineNumber === 0) {
      // Remove the lines from original
      originalLines.splice(
        relevantChange.originalStartLineNumber - 1,
        relevantChange.originalEndLineNumber -
          relevantChange.originalStartLineNumber +
          1,
      );
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
    onApply(newContent);
  };

  const handleReject = () => {
    const changes = diffEditor.getLineChanges();
    const relevantChange = changes?.find(
      (c) =>
        c.originalStartLineNumber === originalStartLineNumber &&
        c.originalEndLineNumber === originalEndLineNumber &&
        c.modifiedStartLineNumber === modifiedStartLineNumber &&
        c.modifiedEndLineNumber === modifiedEndLineNumber,
    );
    if (!relevantChange) return;

    // Get both models
    const modifiedModel = diffEditor.getModel()?.modified;
    const originalModel = diffEditor.getModel()?.original;
    if (!modifiedModel || !originalModel) return;

    // Get the full content of both models
    const originalContent = originalModel.getValue();
    const modifiedContent = modifiedModel.getValue();

    const modifiedLines = modifiedContent.split("\n");

    // Handle deletion (when modifiedEndLineNumber is 0)
    if (relevantChange.modifiedEndLineNumber === 0) {
      // Get the original lines for this change
      const originalLines = originalContent.split("\n");
      const changedContent = originalLines
        .slice(
          relevantChange.originalStartLineNumber - 1,
          relevantChange.originalEndLineNumber,
        )
        .join("\n");

      // Insert back the deleted lines
      modifiedLines.splice(
        relevantChange.modifiedStartLineNumber,
        0,
        changedContent,
      );
    } else {
      // Get the original lines for this change
      const originalLines = originalContent.split("\n");
      const changedContent = originalLines
        .slice(
          relevantChange.originalStartLineNumber - 1,
          relevantChange.originalEndLineNumber,
        )
        .join("\n");

      // Handle insertion of new lines (when originalEndLineNumber is 0)
      if (relevantChange.originalEndLineNumber === 0) {
        // Remove the inserted lines
        modifiedLines.splice(
          relevantChange.modifiedStartLineNumber - 1,
          relevantChange.modifiedEndLineNumber -
            relevantChange.modifiedStartLineNumber +
            1,
        );
      } else {
        // Regular replacement
        modifiedLines.splice(
          relevantChange.modifiedStartLineNumber - 1,
          relevantChange.modifiedEndLineNumber -
            relevantChange.modifiedStartLineNumber +
            1,
          changedContent,
        );
      }
    }

    const newContent = modifiedLines.join("\n");
    onReject(newContent);
  };

  return (
    <div className="flex w-full justify-end gap-1">
      <button
        onClick={handleClick}
        className="rounded-b bg-blue-500 px-2 py-0.5 text-xs font-bold text-white hover:bg-blue-700"
      >
        Accept
      </button>
      <button
        onClick={handleReject}
        className="rounded-b bg-red-500 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-700"
      >
        Reject
      </button>
    </div>
  );
};
