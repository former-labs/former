"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/trpc/react";
import { Editor, type Monaco } from "@monaco-editor/react";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useState } from "react";
import { useEditorDecorations } from "../editor/useEditorDecorations";

export const KnowledgeSourceComponent = ({
  knowledgeId,
  newQuery,
}: {
  knowledgeId: string;
  newQuery: string;
}) => {
  const [open, setOpen] = useState(false);

  const { data: knowledge, isLoading: knowledgeLoading } =
    api.knowledge.getKnowledge.useQuery({
      knowledgeId,
    });

  const { data: comparison, isLoading: comparisonLoading } =
    api.editor.getKnowledgeComparison.useQuery(
      {
        newQuery: newQuery,
        sourceQuery: knowledge?.query ?? "",
      },
      {
        enabled: !!knowledge?.query,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    );

  if (knowledgeLoading || comparisonLoading) {
    return <Loader2 className="m-1 h-4 w-4 animate-spin" />;
  }

  if (!knowledge) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 max-w-full gap-1.5 px-2 py-1 text-xs text-gray-600"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="h-3 w-3 shrink-0" />
        <span className="truncate">{knowledge.name}</span>
      </Button>

      <KnowledgeSourceDialog
        open={open}
        onOpenChange={setOpen}
        knowledge={knowledge}
        newQuery={newQuery}
        comparisonData={comparison ?? null}
      />
    </>
  );
};

const KnowledgeSourceDialog = ({
  open,
  onOpenChange,
  knowledge,
  newQuery,
  comparisonData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledge: {
    name: string;
    description: string;
    query: string;
  };
  newQuery: string;
  comparisonData: {
    similarities: string;
    newQueryLines: number[];
    sourceQueryLines: number[];
  } | null;
}) => {
  const similarities = comparisonData?.similarities;
  const newQueryLines = comparisonData?.newQueryLines;
  const sourceQueryLines = comparisonData?.sourceQueryLines;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-2xl">
        <div className="mb-8 flex w-full flex-col gap-2 text-center">
          <DialogTitle className="text-2xl">Query References</DialogTitle>
          <DialogDescription className="text-base text-black">
            See how the generated query (right) was generated using the
            reference query (left).
          </DialogDescription>
          <Separator className="mt-4" />
        </div>

        <div className="flex space-x-24">
          <div className="flex flex-1 flex-col space-y-2">
            <h3 className="text-md font-semibold">{knowledge.name}</h3>
            <p className="text-sm text-gray-500">{knowledge.description}</p>
          </div>
          <div className="flex flex-1 flex-col space-y-2">
            <h3 className="text-md font-semibold">Generated Query</h3>
            <p className="text-sm text-gray-500">{similarities}</p>
          </div>
        </div>

        <div className="flex h-[500px]">
          <div className="flex-1 border">
            <KnowledgeComparisonEditor
              query={knowledge.query}
              highlightedQueryLines={sourceQueryLines ?? []}
            />
          </div>
          <div className="flex w-24 items-center justify-center">
            <ArrowRight className="h-12 w-12" />
          </div>
          <div className="flex-1 border">
            <KnowledgeComparisonEditor
              query={newQuery}
              highlightedQueryLines={newQueryLines ?? []}
            />
          </div>
        </div>

        {/* {(similarities || newQueryLines || sourceQueryLines) && (
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
        )} */}
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
