"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import type { DatabaseMetadata } from "@/types/connections";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { JSONEditor } from "./_components/JSONEditor";
import { MetadataCSVUpload } from "./_components/MetadataCSVUpload";
import { ParseDatabaseMetadata } from "./_components/ParseDatabaseMetadata";

export default function Page() {
  const [metadata, setMetadata] = useState("");
  const utils = api.useUtils();
  const { toast } = useToast();

  const { data: existingMetadata, isLoading } =
    api.databaseMetadata.getDatabaseMetadata.useQuery();

  useEffect(() => {
    if (existingMetadata) {
      setMetadata(JSON.stringify(existingMetadata || {}, null, 2));
    }
  }, [existingMetadata]);

  const saveMetadataMutation =
    api.databaseMetadata.setDatabaseMetadata.useMutation({
      onSuccess: () => {
        void utils.databaseMetadata.getDatabaseMetadata.invalidate();
        toast({
          title: "Success",
          description: "Database metadata has been saved successfully",
          variant: "default",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to save database metadata",
          variant: "destructive",
        });
      },
    });

  const handleSave = () => {
    try {
      const parsedMetadata = JSON.parse(metadata);
      saveMetadataMutation.mutate({
        databaseMetadata: parsedMetadata,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Invalid JSON",
        description: "Please ensure your JSON is properly formatted.",
      });
    }
  };

  const handleReset = () => {
    if (existingMetadata) {
      setMetadata(JSON.stringify(existingMetadata || {}, null, 2));
    }
  };

  const handleMetadataUpdate = (metadata: DatabaseMetadata) => {
    setMetadata(JSON.stringify(metadata, null, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-[22px] font-semibold leading-7">
              Current Database Schema
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Reset Changes
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                Save Changes
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              You can update this schema by either directly editing the JSON in
              the editor above, uploading a CSV file with your schema details,
              or using AI to parse your database schema description.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <JSONEditor value={metadata} onChange={setMetadata} />
          <ExampleDatabaseMetadata />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="mb-1 text-[22px] font-semibold leading-7">
            Upload New Database Schema
          </h1>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">1. CSV Upload:</span> We will give
              you instructions on how to format and upload a CSV file with your
              schema details (tables, fields, types). We&apos;ll help map the
              columns to the required format.
            </p>
            <p>
              <span className="font-medium">2. AI-Powered Parsing:</span> Paste
              your schema in any format (CREATE TABLE, docs, etc) and our AI
              will convert it to structured JSON.
            </p>
          </div>
        </div>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList>
            <TabsTrigger value="csv">CSV Upload (Recommended)</TabsTrigger>
            <TabsTrigger value="ai">Parse with AI</TabsTrigger>
          </TabsList>
          <TabsContent value="csv">
            <MetadataCSVUpload onSubmitAction={handleMetadataUpdate} />
          </TabsContent>
          <TabsContent value="ai">
            <ParseDatabaseMetadata onParsedAction={handleMetadataUpdate} />
          </TabsContent>
        </Tabs>
      </div>
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
