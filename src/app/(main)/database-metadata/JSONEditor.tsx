"use client";

import { Editor } from "@monaco-editor/react";

export const JSONEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="h-[800px] border">
      <div className="h-full">
        <Editor
          height="100%"
          className="overflow-hidden"
          language="json"
          value={value}
          onChange={(value) => onChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: "off",
            lineDecorationsWidth: 0,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              ignoreHorizontalScrollbarInContentHeight: true,
              alwaysConsumeMouseWheel: false,
            },
            renderLineHighlight: "none",
          }}
        />
      </div>
    </div>
  );
};
