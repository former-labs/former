"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { SchemaContextAlert } from "./SchemaContextAlert";
import { SqlEditorDynamic } from "./SqlEditorDynamic";
import { useEditor } from "./editorStore";

export const EditorSection = () => {
  const { editorList, activeEditorId, setActiveEditorId, createEditor } =
    useEditor();

  return (
    <div className="flex h-full flex-col">
      <SchemaContextAlert />
      <div className="flex items-center border-b px-2">
        <div className="flex items-end gap-2">
          {editorList.map((editor) => (
            <div
              key={editor.id}
              onClick={() => setActiveEditorId(editor.id)}
              className={cn(
                "min-w-24 cursor-pointer rounded-t-md border border-b-0 px-3 py-1 text-center text-sm",
                editor.id === activeEditorId ? "bg-gray-50" : "bg-gray-100",
              )}
            >
              Query {editor.id.slice(0, 3)}
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
