import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef } from "react";
import { DiffWidget } from "./DiffWidget";

export const useEditorDiffWidgets = ({
  diffEditor,
  setEditorContentOld,
  setEditorContent,
}: {
  diffEditor: editor.IStandaloneDiffEditor | null;
  setEditorContentOld: (content: string | null) => void;
  setEditorContent: (content: string) => void;
}) => {
  const diffWidgetsRef = useRef<editor.IContentWidget[]>([]);

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
          setEditorContentOld(newContent);
        },
        onReject: (newContent: string) => {
          setEditorContent(newContent);
        },
        originalLineCount: originalModel.getLineCount(),
      });
      editor.getModifiedEditor().addContentWidget(widget);
      diffWidgetsRef.current.push(widget);
    });
  };

  useEffect(() => {
    if (!diffEditor) return;

    // Listen for diff updates instead of content changes
    const updateDiffListener = diffEditor.onDidUpdateDiff(() => {
      updateDiffWidgets(diffEditor);
    });

    // Create the widgets when we first activate the diff editor
    setTimeout(() => {
      updateDiffWidgets(diffEditor);
    }, 0);

    return () => {
      updateDiffListener.dispose();
    };
  }, [diffEditor]);
};
