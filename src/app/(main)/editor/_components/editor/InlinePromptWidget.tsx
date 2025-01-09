"use client";

import { Button } from "@/components/ui/button";
import { TextareaAutoResize } from "@/components/ui/custom/textarea-auto-resize";
import { useData } from "@/contexts/DataContext";
import { api } from "@/trpc/react";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useEventListener } from "usehooks-ts";
import {
  useActiveEditor,
  useActiveEditorInlinePromptWidget,
} from "./editorStore";

export const InlinePromptWidget = ({ id }: { id: string }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    editorContent,
    setEditorContentDiff,
    setShouldFocus: setActiveEditorFocus,
  } = useActiveEditor();
  const {
    removePromptWidget,
    text,
    setText,
    lineNumberStart,
    lineNumberEnd,
    shouldFocus,
    setShouldFocus,
  } = useActiveEditorInlinePromptWidget(id);

  const { databaseMetadata } = useData();
  const { data: knowledgeList = [] } = api.knowledge.listKnowledge.useQuery();

  const inlineEditMutation = api.editor.inlineEdit.useMutation();

  // Get selection content
  // const selectionContent = getEditorSelectionContent({
  //   editorSelection: {
  //     startLineNumber: lineNumberStart,
  //     endLineNumber: lineNumberEnd,
  //   },
  //   editorContent,
  // });

  useEffect(() => {
    // Focus this inline prompt widget if shouldFocus is true
    if (textareaRef.current && shouldFocus) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        setShouldFocus(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [textareaRef, shouldFocus]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      document.activeElement === textareaRef.current
    ) {
      removePromptWidget();
      setActiveEditorFocus(true);
    }
  };

  useEventListener("keydown", handleKeyDown);

  const handleSubmit = async () => {
    if (!text.trim() || !databaseMetadata) return;

    const response = await inlineEditMutation.mutateAsync({
      userMessage: text,
      editorContent,
      editorSelection: {
        startLineNumber: lineNumberStart,
        endLineNumber: lineNumberEnd,
      },
      databaseMetadata,
      knowledge: knowledgeList,
    });

    setEditorContentDiff(response);
    removePromptWidget();
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
    <div className="py-1">
      <div className="relative flex h-full w-96 flex-col gap-1 rounded-lg border bg-gray-100 p-1">
        <Button
          onClick={removePromptWidget}
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 h-4 w-4"
        >
          <X />
        </Button>

        {/* {selectionContent && (
          <div className="border pr-3">
            <StaticEditor value={selectionContent} />
          </div>
        )} */}

        <TextareaAutoResize
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          className="bg-white p-1 text-base"
          placeholder="Enter your prompt..."
          rows={2}
        />

        <div className="flex items-center justify-between">
          <div className="pl-1 text-xs text-gray-500">
            Line {lineNumberStart}-{lineNumberEnd}
          </div>
          <Button
            onClick={handleSubmit}
            size="sm"
            className="h-5"
            loading={inlineEditMutation.isPending}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};
