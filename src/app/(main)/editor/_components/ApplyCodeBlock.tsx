"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Check, Copy, ListCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useEditor } from "./editorStore";
import { StaticEditor } from "./StaticEditor";

export const ApplyCodeBlock = ({ codeContent }: { codeContent: string }) => {
  const { editorContent, setEditorContentPending } = useEditor();
  const [isCopied, setIsCopied] = useState(false);

  const applyChangeMutation = api.editor.applyChange.useMutation();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleApply = async () => {
    const response = await applyChangeMutation.mutateAsync({
      editorContent,
      applyContent: codeContent,
    });
    setEditorContentPending(response);
  };

  return (
    <div>
      <div className="relative overflow-x-auto rounded-sm border">
        <StaticEditor value={codeContent} />
      </div>
      <div className="mt-1 flex justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1"
        >
          Copy
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleApply}
          className="gap-1"
          disabled={applyChangeMutation.isPending}
        >
          Apply
          {applyChangeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ListCheck className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
