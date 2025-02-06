"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { BigQueryCredentials, Integration } from "@/types/connections";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  projectId: z.string().min(1, "Project ID is required"),
  credentials: z.string().min(1, "Service account credentials are required"),
});

type FormValues = z.infer<typeof formSchema>;

export function BigQueryConnectModal({
  open,
  onOpenChange,
  integration,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration;
  onSubmit: ({
    id,
    integration,
  }: {
    id: string | null;
    integration: Omit<Integration, "id" | "createdAt">;
  }) => void;
}) {
  const { toast } = useToast();
  const { activeRole } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      projectId: "",
      credentials: "",
    },
  });

  // Update form values when integration changes
  useEffect(() => {
    if (integration) {
      form.reset({
        name: integration.name,
        projectId: (integration.credentials as BigQueryCredentials).project_id,
        credentials: JSON.stringify(integration.credentials, null, 2),
      });
    }
  }, [integration, form]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        projectId: "",
        credentials: "",
      });
      setUploadedFile(null);
    }
  }, [open, form]);

  const updateProjectIdFromCredentials = (jsonString: string) => {
    try {
      const credentials = JSON.parse(jsonString);
      if (credentials.project_id && !form.getValues("projectId")) {
        form.setValue("projectId", credentials.project_id, {
          shouldValidate: true,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnect = (values: FormValues) => {
    try {
      // Validate JSON
      const credentials = JSON.parse(values.credentials);

      const workspaceId = activeRole?.workspace.id;
      if (!workspaceId) {
        throw new Error("No active workspace found");
      }

      onSubmit({
        id: integration?.id ?? null,
        integration: {
          workspaceId,
          type: "bigquery",
          credentials,
          name: values.name,
          config: {
            projectId: values.projectId,
          },
        },
      });

      toast({
        title: integration ? "Updated successfully" : "Connected successfully",
        description: integration
          ? "BigQuery integration has been updated."
          : "BigQuery integration has been set up.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Invalid JSON credentials",
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const text = await file.text();
        // Validate JSON
        JSON.parse(text);
        form.setValue("credentials", text, { shouldValidate: true });
        updateProjectIdFromCredentials(text);
        setUploadedFile({
          name: file.name,
          size: file.size,
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Invalid JSON file",
          description: "Please upload a valid service account JSON file",
          variant: "destructive",
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, toast],
  );

  const handleRemoveFile = () => {
    setUploadedFile(null);
    form.setValue("credentials", "");
    if (!form.getValues("projectId")) {
      form.setValue("projectId", "");
    }
  };

  const handleCredentialsChange = (value: string) => {
    form.setValue("credentials", value, { shouldValidate: true });
    updateProjectIdFromCredentials(value);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      void onDrop(acceptedFiles);
    },
    accept: {
      "application/json": [".json"],
    },
    maxSize: 1024 * 1024, // 1MB
    multiple: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {integration ? "Edit BigQuery Connection" : "Connect BigQuery"}
          </DialogTitle>
          <DialogDescription>
            {integration
              ? "Update your BigQuery connection details."
              : "Connect to BigQuery by providing your project ID and service account credentials."}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConnect)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My BigQuery Integration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project ID</FormLabel>
                  <FormControl>
                    <Input placeholder="your-project-id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Account JSON</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {!uploadedFile ? (
                        <Card
                          {...getRootProps()}
                          className={cn(
                            "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                            isDragActive
                              ? "border-primary bg-muted/30"
                              : "border-muted-foreground/25",
                          )}
                        >
                          <input {...getInputProps()} />
                          <UploadCloud className="h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm font-medium">
                            <span className="text-primary">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            JSON file only (max. 1MB)
                          </p>
                        </Card>
                      ) : (
                        <Card className="relative flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {uploadedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(uploadedFile.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Card>
                      )}

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or paste credentials
                          </span>
                        </div>
                      </div>

                      <Textarea
                        placeholder="Paste your service account JSON here..."
                        className="min-h-[200px]"
                        {...field}
                        onChange={(e) =>
                          handleCredentialsChange(e.target.value)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {integration ? "Save Changes" : "Connect BigQuery"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
