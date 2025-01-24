"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { JSONEditor } from "./JSONEditor";
import { ParseDatabaseMetadataDialog } from "./ParseDatabaseMetadataDialog";

export default function Page() {
  const [metadata, setMetadata] = useState("");
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const utils = api.useUtils();
  const { toast } = useToast();

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
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please ensure your JSON is properly formatted.",
      });
      // console.error("Invalid JSON", e);
    }
  };

  const handleReset = () => {
    if (existingMetadata) {
      setMetadata(JSON.stringify(existingMetadata, null, 2));
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
              Set your database schema here in JSON form. Use the &apos;Load
              schema with AI&apos; button to load your schema in with AI from a
              description or unstructured format.
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setParseDialogOpen(true)}>
              Load schema with AI
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              loading={saveMetadataMutation.isPending}
              disabled={!hasChanges || saveMetadataMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <JSONEditor value={metadata} onChange={setMetadata} />

        <ExampleDatabaseMetadata />
      </div>

      <ParseDatabaseMetadataDialog
        open={parseDialogOpen}
        onOpenChange={setParseDialogOpen}
        onParsed={setMetadata}
      />
    </div>
  );
}

const ExampleDatabaseMetadata = () => {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm text-muted-foreground">
        View example schema format
      </summary>
      <div className="mt-2 rounded-lg border p-4">
        <p className="mb-2 text-sm text-muted-foreground">
          This is an example of the expected schema format:
        </p>
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {JSON.stringify(
            {
              projects: [
                {
                  id: "example-project",
                  name: "Example Project",
                  datasets: [
                    {
                      id: "example-dataset",
                      name: "Example Dataset",
                      tables: [
                        {
                          id: "table1",
                          name: "Table 1",
                          fields: [
                            {
                              name: "field1",
                              type: "STRING",
                              description: "First field in the table",
                            },
                            {
                              name: "field2",
                              type: "INTEGER",
                              description: "Second field in the table",
                            },
                            {
                              name: "field3",
                              type: "BOOLEAN",
                              description: "Third field in the table",
                            },
                          ],
                          description: "First table example",
                        },
                        {
                          id: "table2",
                          name: "Table 2",
                          fields: [
                            {
                              name: "field1",
                              type: "FLOAT",
                              description: "First field in the table",
                            },
                            {
                              name: "field2",
                              type: "DATE",
                              description: "Second field in the table",
                            },
                            {
                              name: "field3",
                              type: "STRING",
                              description: "Third field in the table",
                            },
                          ],
                          description: "Second table example",
                        },
                      ],
                      tableCount: 2,
                      description:
                        "A dataset containing two tables with three fields each",
                    },
                  ],
                  description: "A project to demonstrate schema parsing",
                },
              ],
            },
            null,
            2,
          )}
        </pre>
      </div>
    </details>
  );
};
