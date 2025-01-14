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
import { Editor } from "@monaco-editor/react";
import { BookOpen } from "lucide-react";
import { useState } from "react";

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
      />
    </>
  );
};

const KnowledgeSourceDialog = ({
  open,
  onOpenChange,
  knowledge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledge: {
    name: string;
    description: string;
    query: string;
  };
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-md">
        <DialogHeader>
          <DialogTitle>{knowledge.name}</DialogTitle>
          <DialogDescription>{knowledge.description}</DialogDescription>
        </DialogHeader>

        <div className="h-[300px] rounded-md border">
          <Editor
            height="100%"
            language="sql"
            value={knowledge.query}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
