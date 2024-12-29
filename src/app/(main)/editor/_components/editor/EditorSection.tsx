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
      <div className="flex items-center border-b px-2">
        <div className="flex items-end gap-2">
          {editorList.map((editor) => (
            <div
              key={editor.id}
              className={cn(
                "flex min-w-24 items-center justify-between gap-2 rounded-t-md border border-b-0 px-3 py-1 text-sm",
                "duration-200 animate-in fade-in slide-in-from-left-2",
                editor.id === activeEditorId ? "bg-gray-50" : "bg-gray-200",
              )}
            >
              <div
                className="cursor-pointer"
                onClick={() => setActiveEditorId(editor.id)}
              >
                Query {editor.id.slice(0, 3)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEditor(editor.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="icon" onClick={createEditor}>
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
