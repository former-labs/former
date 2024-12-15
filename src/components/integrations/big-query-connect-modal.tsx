"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";
import * as React from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

interface BigQueryConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BigQueryConnectModal({
  open,
  onOpenChange,
}: BigQueryConnectModalProps) {
  const { toast } = useToast();
  const [jsonContent, setJsonContent] = React.useState<string>("");

  const connectBigQuery = api.integration.connectBigQuery.useMutation({
    onSuccess: () => {
      toast({
        title: "Connected successfully",
        description: "BigQuery integration has been set up.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const text = await file.text();
        // Validate JSON
        JSON.parse(text);
        setJsonContent(text);
      } catch (error) {
        toast({
          title: "Invalid JSON file",
          description: "Please upload a valid service account JSON file",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxSize: 1024 * 1024, // 1MB
    multiple: false,
  });

  const handleConnect = () => {
    if (!jsonContent) return;
    connectBigQuery.mutate({ credentials: jsonContent });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect BigQuery</DialogTitle>
          <DialogDescription>
            Upload your BigQuery service account JSON file or paste the contents below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Card
            {...getRootProps()}
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              isDragActive
                ? "border-primary bg-muted/30"
                : "border-muted-foreground/25"
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              JSON file only (max. 1MB)
            </p>
          </Card>

          <textarea
            className="h-[200px] w-full rounded-md border p-2"
            placeholder="Or paste your service account JSON here..."
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
          />

          <Button onClick={handleConnect} disabled={!jsonContent}>
            Connect BigQuery
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 