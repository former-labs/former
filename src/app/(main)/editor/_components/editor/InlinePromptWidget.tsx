"use client";

import { Button } from "@/components/ui/button";
import { TextareaAutoResize } from "@/components/ui/custom/textarea-auto-resize";
import { useData } from "@/contexts/DataContext";
import { api } from "@/trpc/react";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useEventListener, useResizeObserver } from "usehooks-ts";
import { useEditor } from "./editorStore";

export const InlinePromptWidget = ({
  id,
  onRemove,
  onHeightChange,
}: {
  id: string;
  onRemove: () => void;
  onHeightChange: (height: number) => void;
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Watch container height changes
  const { height = 0 } = useResizeObserver({
    ref: containerRef,
  });

  // Report height changes to parent
  useEffect(() => {
    if (height > 0) {
      onHeightChange(height);
    }
  }, [height]);

  const { editorContent, editorSelection, setEditorContentPending } =
    useEditor();
  const { databaseMetadata } = useData();
  const { data: knowledgeList = [] } = api.knowledge.listKnowledge.useQuery();

  const inlineEditMutation = api.editor.inlineEdit.useMutation();

  useEffect(() => {
    // Focus when first mounted
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      document.activeElement === textareaRef.current
    ) {
      onRemove();
    }
  };

  useEventListener("keydown", handleKeyDown);

  const handleSubmit = async () => {
    if (!text.trim() || !databaseMetadata) return;

    const response = await inlineEditMutation.mutateAsync({
      userMessage: text,
      editorContent,
      editorSelection: null,
      databaseMetadata,
      knowledge: knowledgeList,
    });

    setEditorContentPending(response);
    onRemove();
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-fit w-96 flex-col gap-1 rounded-lg border bg-gray-100 p-1"
    >
      <Button
        onClick={onRemove}
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-4 w-4"
      >
        <X />
      </Button>

      <TextareaAutoResize
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleTextareaKeyDown}
        className="bg-white p-1 text-sm"
        placeholder="Enter your prompt..."
        rows={2}
      />

      <Button
        onClick={handleSubmit}
        size="sm"
        className="h-6 self-end"
        loading={inlineEditMutation.isPending}
      >
        Submit
      </Button>
    </div>
  );
};
