"use client";

import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { DiffEditor, Editor, type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { DiffWidget } from "./DiffWidget";
import { useEditor } from "./editorStore";
import { useQueryResult } from "./queryResultStore";

export const SqlEditor = () => {
  const {
    editorContent,
    editorContentPending,
    setEditorContent,
    setEditorContentPending,
    setEditorSelection,
  } = useEditor();

  const { executeQuery } = useQueryResult();
  const { databaseMetadata } = useData();

  // We use the same monaco for both editors, seems to work?
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [codeEditor, setCodeEditor] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [diffEditor, setDiffEditor] =
    useState<editor.IStandaloneDiffEditor | null>(null);
  const diffWidgetsRef = useRef<editor.IContentWidget[]>([]);
  const [renderSideBySide, setRenderSideBySide] = useState(false);

  useEffect(() => {
    console.log("Database metadata changed:", databaseMetadata);
  }, [databaseMetadata]);

  const enableIntellisense = () => {
    // Example table names - replace with actual table names from your schema
    const tableNames = [
      "users",
      "orders",
      "products",
      "categories",
      "customers",
    ];

    if (monaco) {
      // Clear existing completions first
      monaco.languages.registerCompletionItemProvider("sql", {
        provideCompletionItems: () => ({ suggestions: [] }),
      });

      // Register new completions
      monaco.languages.registerCompletionItemProvider("sql", {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = tableNames.map((table) => ({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table,
            range: range,
          }));

          // Add SQL keywords
          const keywords = [
            "SELECT",
            "FROM",
            "WHERE",
            "GROUP BY",
            "ORDER BY",
            "HAVING",
            "JOIN",
            "LEFT JOIN",
            "RIGHT JOIN",
          ];
          const keywordSuggestions = keywords.map((keyword) => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
          }));

          return {
            suggestions: [...suggestions, ...keywordSuggestions],
          };
        },
      });
    }
  };

  // Add Cmd+K binding for view zone
  useEditorKeybind({
    id: "add-view-zone",
    callback: async () => {
      if (!codeEditor) return;
      const position = codeEditor.getPosition();
      if (!position) return;

      codeEditor.changeViewZones(function (changeAccessor) {
        const domNode = document.createElement("div");
        domNode.style.background = "lightgreen";
        changeAccessor.addZone({
          afterLineNumber: position.lineNumber - 1,
          heightInLines: 3,
          domNode: domNode,
        });
      });
    },
    keybinding: monaco ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK : null,
    codeEditor,
    diffEditor,
  });

  // Add Cmd+Enter binding to execute query
  useEditorKeybind({
    id: "execute-query",
    callback: executeQuery,
    keybinding: monaco ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter : null,
    codeEditor,
    diffEditor,
  });

  // Add Cmd+L binding to simulate original keybinding
  useEditorKeybind({
    id: "open-chat",
    callback: async () => {
      // Stop existing keybinding from being triggered and propagate up
      const event = new KeyboardEvent("keydown", {
        key: "l",
        code: "KeyL",
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    },
    keybinding: monaco ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL : null,
    codeEditor,
    diffEditor,
  });

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    setCodeEditor(editor);
    setMonaco(monaco);

    // Add selection change listener
    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getSelection();
      setEditorSelection(selection);
    });
  };

  const handleDiffEditorDidMount = (
    editor: editor.IStandaloneDiffEditor,
    monaco: Monaco,
  ) => {
    setDiffEditor(editor);
    setMonaco(monaco);

    // Override the default Cmd+L binding in the modified editor
    const modifiedEditor = editor.getModifiedEditor();

    // Listen for diff updates instead of content changes
    editor.onDidUpdateDiff(() => {
      updateDiffWidgets(editor);
    });

    modifiedEditor.onDidChangeModelContent(() => {
      setEditorContentPending(modifiedEditor.getValue());
    });

    // Add selection change listener for diff editor
    modifiedEditor.onDidChangeCursorSelection((e) => {
      const selection = modifiedEditor.getSelection();
      setEditorSelection(selection);
    });

    modifiedEditor.updateOptions({
      lineNumbers: renderSideBySide ? "on" : "off",
    });

    // Create the widgets when we first activate the diff editor
    setTimeout(() => {
      updateDiffWidgets(editor);
    }, 0);
  };

  const updateDiffWidgets = (editor: editor.IStandaloneDiffEditor) => {
    // Remove existing widgets
    const modifiedEditor = editor.getModifiedEditor();
    diffWidgetsRef.current.forEach((widget) => {
      modifiedEditor.removeContentWidget(widget);
    });

    diffWidgetsRef.current = [];

    // Add new widgets for each change
    const changes = editor.getLineChanges();
    const originalModel = editor.getModel()?.original;
    if (!originalModel) return;

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
        originalLineCount: originalModel.getLineCount(),
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

    console.log(diffEditor?.getLineChanges());
  };

  const setDecorations = () => {
    // Example: Adding decorations if needed
  };

  const printDecorations = () => {
    if (diffEditor) {
      console.log(diffEditor.getModel()?.modified.getAllDecorations());
    }
  };

  const removeWidgets = () => {
    if (diffEditor) {
      const modifiedEditor = diffEditor.getModifiedEditor();
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

  const printSelection = () => {
    if (codeEditor) {
      const selection = codeEditor.getSelection();
      if (selection) {
        const selectedText = codeEditor.getModel()?.getValueInRange(selection);
        console.log("Selected text:", selectedText);
      }
    } else if (diffEditor) {
      const modifiedEditor = diffEditor.getModifiedEditor();
      const selection = modifiedEditor.getSelection();
      if (selection) {
        const selectedText = modifiedEditor
          .getModel()
          ?.getValueInRange(selection);
        console.log("Selected text:", selectedText);
      }
    }
  };

  return (
    <div className="flex h-full w-full flex-col pt-4">
      <div className="mb-4 flex flex-shrink-0 gap-2 overflow-x-auto">
        <Button onClick={executeQuery}>Execute</Button>
        <Button onClick={setInitialContent}>Set Initial Content</Button>
        <Button onClick={startDiff}>Start diff</Button>
        <Button onClick={endDiff}>End diff</Button>
        <Button onClick={printContent}>Print editor content</Button>
        <Button onClick={setDecorations}>Set decorations</Button>
        <Button onClick={printDecorations}>Print decorations</Button>
        <Button onClick={removeWidgets}>Remove widgets</Button>
        <Button onClick={() => diffEditor && updateDiffWidgets(diffEditor)}>
          Update diff widgets
        </Button>
        <Button onClick={enableIntellisense}>Intellisense</Button>
        <Button onClick={printSelection}>Print Selection</Button>
        {editorContentPending !== null && (
          <Button
            onClick={() => {
              const newRenderSideBySide = !renderSideBySide;
              setRenderSideBySide(newRenderSideBySide);

              // Update line numbers when toggling view
              if (diffEditor) {
                diffEditor.getModifiedEditor().updateOptions({
                  lineNumbers: newRenderSideBySide ? "on" : "off",
                });
              }
            }}
          >
            {renderSideBySide ? "Inline View" : "Side by Side View"}
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1">
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

const useEditorKeybind = ({
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
