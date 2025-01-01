"use client";

import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { createRoot } from "react-dom/client";

interface DiffWidgetProps {
  id: string;
  originalStartLineNumber: number;
  originalEndLineNumber: number;
  modifiedStartLineNumber: number;
  modifiedEndLineNumber: number;
  diffEditor: editor.IStandaloneDiffEditor;
  onApply: (newContent: string) => void;
  onReject: (newContent: string) => void;
  originalLineCount: number;
}

export class DiffWidget implements editor.IContentWidget {
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

    /*
      Also, because of how monaco diff editor works, there is a weird case where the diff
      is equal to a deletion of the bottom lines of the original editor.
      In this case we override and do a BELOW position. It's not perfectly consistent but
      it is usable, unlike EXACT which does not render properly because the original editor
      has no lines to place it on.
    */
    const isDeleteOriginalBottom =
      this.props.modifiedEndLineNumber === 0 &&
      this.props.originalEndLineNumber === this.props.originalLineCount;

    return {
      position: {
        lineNumber:
          this.props.modifiedEndLineNumber === 0
            ? this.props.modifiedStartLineNumber + 1
            : this.props.modifiedEndLineNumber,
        column: 1,
      },
      preference: [
        isDeleteOriginalBottom || this.props.modifiedEndLineNumber !== 0
          ? editor.ContentWidgetPositionPreference.BELOW
          : editor.ContentWidgetPositionPreference.EXACT,
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
    <div className="flex w-full justify-end gap-1 pr-4">
      <button
        onClick={handleClick}
        className="rounded-b bg-green-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-green-700"
      >
        Accept
      </button>
      <button
        onClick={handleReject}
        className="rounded-b bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-700"
      >
        Reject
      </button>
    </div>
  );
};
