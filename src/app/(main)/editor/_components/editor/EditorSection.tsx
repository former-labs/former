"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { SchemaContextAlert } from "./SchemaContextAlert";
import { SqlEditorDynamic } from "./SqlEditorDynamic";
import { useEditor } from "./editorStore";

export const EditorSection = () => {
  const {
    editorList,
    activeEditorId,
    setActiveEditorId,
    createEditor,
    deleteEditor,
  } = useEditor();

  return (
    <div className="flex h-full flex-col">
      <SchemaContextAlert />
      <div className="flex items-center border-b">
        <div className="flex items-end">
          {editorList.map((editor) => (
            <div
              key={editor.id}
              className={cn(
                "flex min-w-28 cursor-pointer items-center justify-between gap-2 rounded-t-md border border-b-0 px-3 py-1 text-sm",
                "duration-200 animate-in fade-in slide-in-from-left-2",
                editor.id === activeEditorId ? "bg-gray-50" : "bg-gray-200",
              )}
              onClick={() => setActiveEditorId(editor.id)}
            >
              <div className="">{editor.title}</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-1 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEditor(editor.id);
                }}
              >
                <X />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={createEditor}
            className="ml-1 h-7 w-7"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <SqlEditorDynamic />
      </div>
    </div>
  );
};
