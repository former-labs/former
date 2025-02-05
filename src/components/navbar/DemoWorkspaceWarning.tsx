"use client";

import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

export const DemoWorkspaceWarning = () => {
  const { activeRole } = useAuth();

  if (!activeRole?.workspace.demo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded border bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>This is a demo workspace.</span>
      </div>
      <div className="text-xs">
        Please create a workspace using the above selector to use your own data.
      </div>
    </div>
  );
};
