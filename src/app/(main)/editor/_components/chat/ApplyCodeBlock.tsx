"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Check, Copy, ListCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useActiveEditor } from "../editor/editorStore";
import { useChat } from "./chatStore";
import { KnowledgeSourceComponent } from "./KnowledgeSourceComponent";
import { StaticEditor } from "./StaticEditor";

export const ApplyCodeBlock = ({
  codeContent,
  knowledgeSources,
}: {
  codeContent: string;
  knowledgeSources: {
    key: number;
    knowledgeSourceIds: string[];
  }[];
}) => {
  const { editorContent, setEditorContentDiff } = useActiveEditor();
  const { activeChat } = useChat();
  const [isCopied, setIsCopied] = useState(false);

  const applyChangeMutation = api.editor.applyChange.useMutation();

  const { key, codeContentClean } = parseCodeContent(codeContent);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContentClean);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleApply = async () => {
    const response = await applyChangeMutation.mutateAsync({
      editorContent,
      applyContent: codeContentClean,
      messages: activeChat?.messages ?? [],
    });
    setEditorContentDiff(response);
  };

  return (
    <div>
      {/* {key && <div className="mb-1 text-sm text-gray-500">Query #{key}</div>} */}
      <div className="relative overflow-x-auto rounded-sm border">
        <StaticEditor value={codeContentClean} />
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
      <div className="mt-3 rounded-sm border border-gray-300 bg-gray-300 p-2">
        <div className="text-xs font-medium text-gray-600">Sources</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {knowledgeSources
            .find((source) => source.key === key)
            ?.knowledgeSourceIds.map((knowledgeId) => (
              <KnowledgeSourceComponent
                key={knowledgeId}
                knowledgeId={knowledgeId}
                newQuery={codeContentClean}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

const parseCodeContent = (
  codeContent: string,
): {
  key: number;
  codeContentClean: string;
} => {
  const lines = codeContent.split("\n");

  const keyMatch = lines[0]?.match(/^--- key: (\d+)$/);
  if (!keyMatch) {
    throw new Error("Invalid code content: missing key");
  }

  const keyString = keyMatch[1];
  if (!keyString) {
    throw new Error("Invalid code content: key match group not found");
  }

  const key = parseInt(keyString, 10);
  if (isNaN(key)) {
    throw new Error("Invalid code content: key must be a number");
  }

  const codeContentClean = lines.slice(1).join("\n").trim();
  return { key, codeContentClean };
};
