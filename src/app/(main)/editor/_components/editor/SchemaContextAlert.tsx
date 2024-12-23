"use client";

import { useData } from "@/contexts/DataContext";
import { AlertCircle } from "lucide-react";
import { filterDatabaseMetadataContext } from "../chat/chatStore";

export const SchemaContextAlert = () => {
  const { databaseMetadata } = useData();

  if (!databaseMetadata) return null;

  const filteredMetadata = filterDatabaseMetadataContext(databaseMetadata);
  if (filteredMetadata.projects.length > 0) return null;

  return (
    <div className="flex p-2">
      <div className="flex h-full w-full items-center gap-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800">
        <AlertCircle className="h-6 w-6" />
        <div className="text-sm">
          You do not have any tables included in the AI schema context. To
          generate SQL that matches the schema you must include some tables
          using the schema view on the left.
        </div>
      </div>
    </div>
  );
};
