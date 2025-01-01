"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/DataContext";
import { env } from "@/env";
import { DiffEditor, Editor, type Monaco } from "@monaco-editor/react";
import { Loader2, Play } from "lucide-react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { useQueryResult } from "../queryResultStore";
import { DiffWidget } from "./DiffWidget";
import { useActiveEditor } from "./editorStore";
import { InlinePromptWidget } from "./InlinePromptWidget";
import { useAutocomplete } from "./useAutocomplete";
import { useEditorKeybind } from "./useEditorKeybind";
import { useEditorSelection } from "./useEditorSelection";
import { useViewZones } from "./useViewZones";

export const SqlEditor = () => {
  const {
    editorContent,
    editorContentPending,
    setEditorContent,
    setEditorContentPending,
    editorSelectionContent,
    editorSelection,
    inlinePromptWidgets,
    setInlinePromptWidgets,
  } = useActiveEditor();

  const { executeQuery, resultLoading } = useQueryResult();
  const { databaseMetadata } = useData();

  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [codeEditor, setCodeEditor] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [diffEditor, setDiffEditor] =
    useState<editor.IStandaloneDiffEditor | null>(null);
  const diffWidgetsRef = useRef<editor.IContentWidget[]>([]);
  const [renderSideBySide, setRenderSideBySide] = useState(false);

  const { renderViewZone } = useViewZones({
    viewZoneInstances: inlinePromptWidgets,
    codeEditor,
    monaco,
  });

  useEffect(() => {
    console.log("Database metadata changed:", databaseMetadata);
  }, [databaseMetadata]);

  useAutocomplete(monaco);
  useEditorSelection({
    codeEditor,
    diffEditor,
  });

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
        triggerCharacters: [" ", "."],
      });
    }
  };

  // Add Cmd+K binding for view zone
  useEditorKeybind({
    id: "add-view-zone",
    callback: async () => {
      if (!codeEditor) return;

      if (!editorSelection) {
        throw new Error("No editor selection.");
      }

      const newId = crypto.randomUUID();
      setInlinePromptWidgets([
        ...inlinePromptWidgets,
        {
          id: newId,
          lineNumber: editorSelection.startLineNumber - 1,
          text: "",
        },
      ]);
    },
    keybinding: monaco ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK : null,
    codeEditor,
    diffEditor,
  });

  // Add Cmd+Enter binding to execute query
  useEditorKeybind({
    id: "execute-query",
    callback: () => executeQuery({ editorSelectionContent, editorContent }),
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
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-shrink-0 gap-2 overflow-x-auto bg-gray-50 px-2 py-1">
        <Button
          variant="ghost"
          onClick={() =>
            executeQuery({ editorSelectionContent, editorContent })
          }
          disabled={resultLoading}
        >
          {resultLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        {env.NEXT_PUBLIC_NODE_ENV === "development" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Debug Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={setInitialContent}>
                Set Initial Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startDiff}>
                Start diff
              </DropdownMenuItem>
              <DropdownMenuItem onClick={endDiff}>End diff</DropdownMenuItem>
              <DropdownMenuItem onClick={printContent}>
                Print editor content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={setDecorations}>
                Set decorations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printDecorations}>
                Print decorations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={removeWidgets}>
                Remove widgets
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => diffEditor && updateDiffWidgets(diffEditor)}
              >
                Update diff widgets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={enableIntellisense}>
                Intellisense
              </DropdownMenuItem>
              <DropdownMenuItem onClick={printSelection}>
                Print Selection
              </DropdownMenuItem>
              {editorContentPending !== null && (
                <DropdownMenuItem
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
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="min-h-0 flex-1 border-t">
        {editorContentPending === null ? (
          <Editor
            height="100%"
            className="overflow-hidden"
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
            <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              <Button
                onClick={() => {
                  if (editorContentPending) {
                    setEditorContent(editorContentPending);
                    setEditorContentPending(null);
                  }
                }}
                className="bg-green-600"
              >
                Accept All
              </Button>
              <Button
                onClick={() => {
                  setEditorContentPending(null);
                }}
                className="bg-red-600"
              >
                Reject All
              </Button>
            </div>
            <DiffEditor
              height="100%"
              className="overflow-hidden"
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
      {inlinePromptWidgets.map((widget) => {
        return renderViewZone(widget.id, <InlinePromptWidget id={widget.id} />);
      })}
    </div>
  );
};
