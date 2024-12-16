"use client";

import { Button } from "@/components/ui/button";
import { DiffEditor, Editor } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useRef, useState } from "react";
import { DiffWidget } from "./DiffWidget";
import { useEditor } from "./editorStore";

export const SqlEditor = () => {
  const {
    editorContent,
    editorContentPending,
    setEditorContent,
    setEditorContentPending,
  } = useEditor();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const diffWidgetsRef = useRef<editor.IContentWidget[]>([]);
  const [renderSideBySide, setRenderSideBySide] = useState(false);

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

    modifiedEditor.updateOptions({
      lineNumbers: renderSideBySide ? "on" : "off",
    });

    // Create the widgets when we first activate the diff editor
    // This is dumb but we apparently need to use a timeout for this to work
    // Tbh idk if this is stable on a slow machine
    // I'm sure there's a better way to do this
    setTimeout(() => {
      updateDiffWidgets(editor);
    }, 0);
  };

  const updateDiffWidgets = (editor: editor.IStandaloneDiffEditor) => {
    // Remove existing widgets
    if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      diffWidgetsRef.current.forEach((widget) => {
        modifiedEditor.removeContentWidget(widget);
      });
    }

    diffWidgetsRef.current = [];

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
          // Disable the diff editor if we accept all changes
          if (newContent === editorContentPending) {
            setEditorContentPending(null);
          }
        },
        onReject: (newContent: string) => {
          setEditorContentPending(newContent);
        },
      });
      editor.getModifiedEditor().addContentWidget(widget);
      diffWidgetsRef.current.push(widget);
    });
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
      diffWidgetsRef.current.forEach((widget) => {
        modifiedEditor.removeContentWidget(widget);
      });
      diffWidgetsRef.current = [];
    }
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

  return (
    <div className="flex h-full w-full flex-col pt-4">
      <div className="mb-4 flex gap-2">
        <Button onClick={setInitialContent}>Set Initial Content</Button>
        <Button onClick={startDiff}>Start diff</Button>
        <Button onClick={endDiff}>End diff</Button>
        <Button onClick={printContent}>Print editor content</Button>
        <Button onClick={setDecorations}>Set decorations</Button>
        <Button onClick={printDecorations}>Print decorations</Button>
        <Button onClick={removeWidgets}>Remove widgets</Button>
        <Button onClick={() => updateDiffWidgets(diffEditorRef.current!)}>
          Update diff widgets
        </Button>
        {editorContentPending !== null && (
          <Button
            onClick={() => {
              const newRenderSideBySide = !renderSideBySide;
              setRenderSideBySide(newRenderSideBySide);

              // Update line numbers when toggling view
              if (diffEditorRef.current) {
                diffEditorRef.current.getModifiedEditor().updateOptions({
                  lineNumbers: newRenderSideBySide ? "on" : "off",
                });
              }
            }}
          >
            {renderSideBySide ? "Inline View" : "Side by Side View"}
          </Button>
        )}
      </div>
      <div className="flex-1 pb-4">
        {editorContentPending === null ? (
          <Editor
            height="100%"
            className="overflow-hidden border"
            language="sql"
            value={editorContent}
            onChange={(value) => setEditorContent(value ?? "")}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              scrollBeyondLastLine: true,
            }}
          />
        ) : (
          <div className="relative h-full">
            <div className="absolute right-8 top-4 z-10 flex gap-2">
              <Button
                onClick={() => {
                  if (editorContentPending) {
                    setEditorContent(editorContentPending);
                    setEditorContentPending(null);
                  }
                }}
              >
                Accept All
              </Button>
              <Button
                onClick={() => {
                  setEditorContentPending(null);
                }}
              >
                Reject All
              </Button>
            </div>
            <DiffEditor
              height="100%"
              className="overflow-hidden border"
              language="sql"
              original={editorContent}
              modified={editorContentPending}
              onMount={handleDiffEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                scrollBeyondLastLine: true,
                renderSideBySide,

                lightbulb: {
                  // This is actually buggy and will not disable in renderSideBySide mode
                  // https://github.com/microsoft/monaco-editor/issues/3873
                  enabled: editor.ShowLightbulbIconMode.Off,
                },

                // We give this extra width so that it is the same as the regular editor
                lineDecorationsWidth: 26,

                // The wider scrollbar on the right that shows green/red where diffs are
                // We might want this back
                renderOverviewRuler: false,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
