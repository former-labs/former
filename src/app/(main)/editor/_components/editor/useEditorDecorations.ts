"use client";

import { type Monaco } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";
import styles from './useEditorDecorations.module.css';

/*
TODO:
Make this reactive for the decorations input.
This should take in decorations and also provide some setter I think maybe.
Like the goal is to have the source of truth for the range of each decoration
stored externally. This should just make it easy to apply them to the editor
and also track them as they change.

Use
codeEditor.onDidChangeModelDecorations
*/
export const useEditorDecorations = ({
  decorations,
  codeEditor,
  monaco,
}: {
  decorations: {
    id: string;
    lineNumber: number;
  }[];
  codeEditor: editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}) => {
  // Use ref to track decorations with a map from id to decoration string
  const existingDecorationsRef = useRef<Map<string, string>>(new Map());

  if (codeEditor) {
    const currentDecorations = codeEditor?.getModel()?.getAllDecorations();
    if (currentDecorations) {
      currentDecorations.forEach((decoration) => {
        const decorationId = decoration.id;
        const decorationKey = Array.from(existingDecorationsRef.current.entries()).find(
          ([, value]) => value === decorationId
        )?.[0];

        if (decorationKey) {
          console.log(`Decoration Key: ${decorationKey}, Editor Decoration ID: ${decorationId}`, decoration);
        }
      });
    }
  }

  useEffect(() => {
    if (!codeEditor || !monaco) return;

    // Determine which decorations to add and which to remove
    const newDecorationMap = new Map<string, editor.IModelDeltaDecoration>();
    decorations.forEach((decoration) => {
      newDecorationMap.set(decoration.id, {
        range: new monaco.Range(decoration.lineNumber, 1, decoration.lineNumber, 1),
        options: {
          isWholeLine: true,
          className: styles.lineHighlight,
        },
      });
    });

    const decorationIdsToRemove: string[] = [];

    // Remove decorations that are no longer present
    existingDecorationsRef.current.forEach((_, id) => {
      if (!newDecorationMap.has(id)) {
        decorationIdsToRemove.push(id);
      }
    });

    // Remove old decorations
    codeEditor.deltaDecorations(
      decorationIdsToRemove.map(id => existingDecorationsRef.current.get(id)!).filter(Boolean),
      []
    );

    // Apply new decorations one by one
    newDecorationMap.forEach((decoration, id) => {
      if (!existingDecorationsRef.current.has(id)) {
        const newDecorationId = codeEditor.deltaDecorations([], [decoration])[0];
        if (!newDecorationId) {
          throw new Error("Failed to apply decoration");
        };
        existingDecorationsRef.current.set(id, newDecorationId);
      }
    });

    // Remove old decoration IDs from the map
    decorationIdsToRemove.forEach((id) => {
      existingDecorationsRef.current.delete(id);
    });
  }, [codeEditor, decorations, monaco]);
};
