"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SchemaContextAlert } from "./SchemaContextAlert";
import { SqlEditorDynamic } from "./SqlEditorDynamic";

export const EditorSection = () => {
  return (
    <div className="flex h-full flex-col">
      <SchemaContextAlert />
      <div className="flex items-center border-b px-2">
        <div className="flex items-end gap-2">
          <div className="min-w-24 rounded-t-md border border-b-0 bg-gray-50 px-3 py-1 text-center text-sm">
            Query 1
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log("New tab")}
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
