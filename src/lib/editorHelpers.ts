/*
  Maybe this is a dodgy place but ima put code that is shared between server and client here.
*/

export const getEditorSelectionContent = ({
  editorSelection,
  editorContent,
}: {
  editorSelection:
    | {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
      }
    | {
        startLineNumber: number;
        endLineNumber: number;
      }
    | null;
  editorContent: string;
}) => {
  if (!editorSelection || !editorContent) return null;

  if (
    "startColumn" in editorSelection &&
    "endColumn" in editorSelection &&
    editorSelection.startLineNumber === editorSelection.endLineNumber &&
    editorSelection.startColumn === editorSelection.endColumn
  ) {
    return null;
  }

  const getPositionOffset = (
    content: string,
    lineNumber: number,
    column?: number,
  ) => {
    let offset = 0;
    let currentLine = 1;

    // Find the start of the target line
    while (currentLine < lineNumber) {
      const nextNewline = content.indexOf("\n", offset);
      if (nextNewline === -1) break;
      offset = nextNewline + 1;
      currentLine++;
    }

    // Add the column offset if provided
    return column ? offset + column - 1 : offset;
  };

  if ("startColumn" in editorSelection && "endColumn" in editorSelection) {
    return editorContent.slice(
      getPositionOffset(
        editorContent,
        editorSelection.startLineNumber,
        editorSelection.startColumn,
      ),
      getPositionOffset(
        editorContent,
        editorSelection.endLineNumber,
        editorSelection.endColumn,
      ),
    );
  } else {
    const startOffset = getPositionOffset(
      editorContent,
      editorSelection.startLineNumber,
    );
    const endOffset = getPositionOffset(
      editorContent,
      editorSelection.endLineNumber + 1,
    ) - 1;
    return editorContent.slice(startOffset, endOffset);
  }
};
