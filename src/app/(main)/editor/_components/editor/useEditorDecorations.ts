"use client";

import { type Monaco } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";
import styles from './useEditorDecorations.module.css';

/*
  This will apply decorations to the editor in ranges, and also track the ranges as they change.
  It's complex, but the interface is hopefully simple enough and not a leaky abstraction.

  This is reactive to the input decorations array prop, but it will only be reactive at a granular level
  of the IDs. If the input array reference changes but the decorations are the same, it will not be reactive.
*/
export const useEditorDecorations = ({
  decorations,
  onDecorationsChange,
  codeEditor,
  monaco,
}: {
  decorations: {
    id: string;
    lineNumberStart: number;
    lineNumberEnd: number;
    className: 'lineHightlightCommandK' | 'lineHightlightKnowledgeSource';
  }[];
  onDecorationsChange?: (changedDecorations: { id: string; lineNumberStart: number; lineNumberEnd: number; }[]) => void;
  codeEditor: editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}) => {
  // Use ref to track decorations with a map from id to decoration string
  const existingDecorationsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!codeEditor) return;

    /*
      Tbh I dont 100% trust the logic here.
      But essentially we want to trigger updates when we detect changes to the decorations.
      And not just when onDidChange runs, but specifically when we detect the monaco decorations
      have different line numbers to the decorations array prop, which means the user must have
      performed some editor action which moved the decorations.
    */
    const decorationChangeListener = codeEditor.onDidChangeModelDecorations(() => {
      const currentDecorations = codeEditor.getModel()?.getAllDecorations();
      if (!currentDecorations || !onDecorationsChange) return;

      const updatedDecorations: { id: string; lineNumberStart: number; lineNumberEnd: number; }[] = [];
      let hasChanges = false;

      currentDecorations.forEach((decoration) => {
        const decorationId = decoration.id;
        const decorationKey = Array.from(existingDecorationsRef.current.entries()).find(
          ([, value]) => value === decorationId
        )?.[0];
        if (!decorationKey) return;

        const originalDecoration = decorations.find(d => d.id === decorationKey);
        if (!originalDecoration) return;

        const { startLineNumber, endLineNumber } = decoration.range;
        const updatedDecoration = {
          id: decorationKey,
          lineNumberStart: startLineNumber,
          lineNumberEnd: endLineNumber,
        };
        updatedDecorations.push(updatedDecoration);

        if (startLineNumber !== originalDecoration.lineNumberStart || endLineNumber !== originalDecoration.lineNumberEnd) {
          console.log(`Decoration changed: ${decorationKey}, from (${originalDecoration.lineNumberStart}, ${originalDecoration.lineNumberEnd}) to (${startLineNumber}, ${endLineNumber})`);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        onDecorationsChange(updatedDecorations);
      }
    });

    return () => {
      decorationChangeListener.dispose();
    };
  }, [codeEditor, decorations, onDecorationsChange]);

  useEffect(() => {
    if (!codeEditor || !monaco) return;

    // Determine which decorations to add and which to remove
    const newDecorationMap = new Map<string, editor.IModelDeltaDecoration>();
    decorations.forEach((decoration) => {
      newDecorationMap.set(decoration.id, {
        range: new monaco.Range(decoration.lineNumberStart, 1, decoration.lineNumberEnd, 1),
        options: {
          isWholeLine: true,
          className: `${styles.lineHighlight} ${styles[decoration.className]}`,
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
