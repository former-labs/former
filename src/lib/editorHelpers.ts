/*
  Maybe this is a dodgy place but ima put code that is shared between server and client here.
*/

export const getEditorSelectionContent = ({
  editorSelection,
  editorContent
}: {
  editorSelection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;
  editorContent: string;
}) => {
  if (!editorSelection || !editorContent) return null;

  if (
    editorSelection.startLineNumber === editorSelection.endLineNumber &&
    editorSelection.startColumn === editorSelection.endColumn
  ) {
    return null;
  }

  const getPositionOffset = (content: string, lineNumber: number, column: number) => {
    let offset = 0;
    let currentLine = 1;

    // Find the start of the target line
    while (currentLine < lineNumber) {
      const nextNewline = content.indexOf('\n', offset);
      if (nextNewline === -1) break;
      offset = nextNewline + 1;
      currentLine++;
    }

    // Add the column offset
    return offset + column - 1;
  };

  return editorContent.slice(
    getPositionOffset(
      editorContent,
      editorSelection.startLineNumber,
      editorSelection.startColumn
    ),
    getPositionOffset(
      editorContent,
      editorSelection.endLineNumber,
      editorSelection.endColumn
    )
  );
};
