"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Editor } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const [metadata, setMetadata] = useState("");
  const utils = api.useUtils();

  const { data: existingMetadata, isLoading } =
    api.databaseMetadata.getDatabaseMetadata.useQuery();

  useEffect(() => {
    if (existingMetadata) {
      setMetadata(JSON.stringify(existingMetadata, null, 2));
    }
  }, [existingMetadata]);

  const saveMetadataMutation =
    api.databaseMetadata.setDatabaseMetadata.useMutation({
      onSuccess: () => {
        void utils.databaseMetadata.getDatabaseMetadata.invalidate();
      },
    });

  const handleSave = () => {
    try {
      const parsedMetadata = JSON.parse(metadata);
      saveMetadataMutation.mutate({ databaseMetadata: parsedMetadata });
    } catch (e) {
      // TODO: Show error toast
      console.error("Invalid JSON", e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasChanges = existingMetadata
    ? JSON.stringify(existingMetadata, null, 2) !== metadata
    : metadata !== "";

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-24">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="mb-1 text-[22px] font-semibold leading-7">
              Database Metadata
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Database schema and metadata in JSON format
            </p>
          </div>
          <Button
            onClick={handleSave}
            loading={saveMetadataMutation.isPending}
            disabled={!hasChanges || saveMetadataMutation.isPending}
          >
            Save Changes
          </Button>
        </div>

        <JSONEditor value={metadata} onChange={setMetadata} />
      </div>
    </div>
  );
}

const JSONEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="h-[800px] border">
      <div className="h-full">
        <Editor
          height="100%"
          className="overflow-hidden"
          language="json"
          value={value}
          onChange={(value) => onChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: "off",
            lineDecorationsWidth: 0,
            padding: { top: 8, bottom: 8 },
            scrollbar: {
              ignoreHorizontalScrollbarInContentHeight: true,
              alwaysConsumeMouseWheel: false,
            },
            renderLineHighlight: "none",
          }}
        />
      </div>
    </div>
  );
};
