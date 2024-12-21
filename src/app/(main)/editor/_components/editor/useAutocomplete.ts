"use client";

import { useData } from "@/contexts/DataContext";
import { api } from "@/trpc/react";
import { type Monaco } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { filterDatabaseMetadataContext } from "../chat/chatStore";
import { getEditorSelectionContent, useEditor } from "./editorStore";

export const useAutocomplete = (monaco: Monaco | null) => {
  const { databaseMetadata } = useData();

  const { editorContent } = useEditor();
  const getAutocomplete = api.editor.getAutocomplete.useMutation();

  /*
    A lot of the code here is purely to allow a specific debouncing setup.
  */
  const pendingRequestRef = useRef<Promise<string | undefined> | null>(null);
  const latestArgsRef = useRef<{
    editorContent: string;
    editorContentBeforeCursor: string;
  } | null>(null);

  useEffect(() => {
    if (!monaco) return;
    if (!databaseMetadata) return;

    // Register inline completion provider that triggers on every character
    const disposable = monaco.languages.registerInlineCompletionsProvider(
      "sql",
      {
        provideInlineCompletions: async (model, position, context, token) => {
          const beforeCursorSelection = {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          };

          const editorContentBeforeCursor = getEditorSelectionContent({
            editorSelection: beforeCursorSelection,
            editorContent
          }) ?? "";

          const args = {
            editorContent,
            editorContentBeforeCursor,
          };

          // Store latest args
          latestArgsRef.current = args;

          // If there's a pending request, wait for it to finish before potentially making a new one
          if (pendingRequestRef.current) {
            await pendingRequestRef.current;
          }

          // Only make a new request if these are still the latest args
          if (latestArgsRef.current === args) {
            pendingRequestRef.current = getAutocomplete.mutateAsync({
              ...args,
              databaseMetadata: filterDatabaseMetadataContext(databaseMetadata),
            });
            const result = await pendingRequestRef.current;
            pendingRequestRef.current = null;

            if (result === undefined) {
              return {
                items: [],
              };
            }

            return {
              items: [
                {
                  insertText: result,
                  range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                  },
                },
              ],
            };
          }

          return {
            items: [],
          };
        },
        freeInlineCompletions: () => {},
      },
    );

    return () => {
      disposable.dispose();
    };
  }, [monaco, editorContent, getAutocomplete]);
};