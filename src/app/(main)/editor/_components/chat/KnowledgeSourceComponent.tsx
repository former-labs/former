"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { Editor, type Monaco } from "@monaco-editor/react";
import { BookOpen } from "lucide-react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useState } from "react";
import { useEditorDecorations } from "../editor/useEditorDecorations";

export const KnowledgeSourceComponent = ({
  knowledgeId,
}: {
  knowledgeId: string;
}) => {
  const [open, setOpen] = useState(false);
  const { data: knowledge } = api.knowledge.getKnowledge.useQuery({
    knowledgeId,
  });

  if (!knowledge) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 px-2 py-1 text-xs text-gray-600"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-3 w-3" />
        {knowledge.name}
      </Button>

      <KnowledgeSourceDialog
        open={open}
        onOpenChange={setOpen}
        knowledge={knowledge}
        newQuery={`\
SELECT 
  oi.user_id, 
  oi.order_id, 
  SUM(oi.sale_price) AS order_value
FROM \`bigquery-public-data.thelook_ecommerce.order_items\` AS oi
GROUP BY oi.user_id, oi.order_id`}
      />
    </>
  );
};

const KnowledgeSourceDialog = ({
  open,
  onOpenChange,
  knowledge,
  newQuery,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledge: {
    name: string;
    description: string;
    query: string;
  };
  newQuery: string;
}) => {
  const [similarities, setSimilarities] = useState<string | null>(null);
  const [newQueryLines, setNewQueryLines] = useState<number[] | null>(null);
  const [sourceQueryLines, setSourceQueryLines] = useState<number[] | null>(
    null,
  );

  const { mutate: fetchComparison } =
    api.editor.getKnowledgeComparison.useMutation({
      onSuccess: (data) => {
        setSimilarities(data.similarities);
        setNewQueryLines(data.newQueryLines);
        setSourceQueryLines(data.sourceQueryLines);
      },
    });

  useEffect(() => {
    if (open) {
      fetchComparison({
        newQuery: newQuery,
        sourceQuery: knowledge.query,
      });
    }
  }, [open, fetchComparison, newQuery, knowledge.query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-2xl">
        <DialogHeader>
          <DialogTitle>{knowledge.name}</DialogTitle>
          <DialogDescription>{knowledge.description}</DialogDescription>
        </DialogHeader>

        <div className="flex h-[500px] space-x-4">
          <div className="flex-1 border">
            <KnowledgeComparisonEditor
              query={knowledge.query}
              highlightedQueryLines={sourceQueryLines ?? []}
            />
          </div>
          <div className="flex-1 border">
            <KnowledgeComparisonEditor
              query={newQuery}
              highlightedQueryLines={newQueryLines ?? []}
            />
          </div>
        </div>
        {(similarities || newQueryLines || sourceQueryLines) && (
          <div className="mt-4 border-t p-4">
            <h2 className="text-lg font-semibold">Comparison Result</h2>
            {similarities && (
              <p>
                <strong>Similarities:</strong> {similarities}
              </p>
            )}
            {newQueryLines && (
              <p>
                <strong>New Query Lines:</strong> {newQueryLines.join(", ")}
              </p>
            )}
            {sourceQueryLines && (
              <p>
                <strong>Source Query Lines:</strong>{" "}
                {sourceQueryLines.join(", ")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const KnowledgeComparisonEditor = ({
  query,
  highlightedQueryLines,
}: {
  query: string;
  highlightedQueryLines: number[];
}) => {
  const [codeEditor, setCodeEditor] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  useEditorDecorations({
    decorations: highlightedQueryLines.map((lineNumber) => ({
      id: `line-${lineNumber}`,
      lineNumberStart: lineNumber,
      lineNumberEnd: lineNumber,
      className: "lineHightlightKnowledgeSource",
    })),
    codeEditor,
    monaco,
  });

  return (
    <Editor
      height="100%"
      language="sql"
      value={query}
      onMount={(editor, monaco) => {
        setCodeEditor(editor);
        setMonaco(monaco);
      }}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        lineDecorationsWidth: 0,
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          ignoreHorizontalScrollbarInContentHeight: true,
          alwaysConsumeMouseWheel: false,
        },
      }}
    />
  );
};
