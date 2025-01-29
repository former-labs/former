"use client";

import { TableDataView } from "@/app/(main)/editor/_components/resultPane/QueryResultPane";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DATABASE_INSTRUCTIONS } from "@/lib/databaseInstructions";
import { CSVRow, transformToMetadata } from "@/lib/metadataTransformer";
import { cn } from "@/lib/utils";
import type {
  DatabaseInstructions,
  DatabaseMetadata,
  DatabaseType,
} from "@/types/connections";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSideRowModelModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { CheckCircle2, Trash2, UploadCloud } from "lucide-react";
import Papa from "papaparse";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Control, useForm } from "react-hook-form";
import { z } from "zod";

const DATABASE_TYPES: DatabaseType[] = [
  "bigquery",
  "postgres",
  "mysql",
  "sqlserver",
  "snowflake",
  "databricks",
];

const formSchema = z.object({
  databaseType: z.enum([
    "bigquery",
    "postgres",
    "mysql",
    "sqlserver",
    "snowflake",
    "databricks",
  ] as const),
  columnMappings: z.object({
    projectId: z.string().min(1, "Project ID mapping is required"),
    datasetId: z.string().min(1, "Dataset ID mapping is required"),
    tableName: z.string().min(1, "Table Name mapping is required"),
    tableDescription: z.string().optional(),
    columnName: z.string().min(1, "Column Name mapping is required"),
    columnType: z.string().min(1, "Column Type mapping is required"),
    columnDescription: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;
type ColumnMappingKey = keyof DatabaseInstructions["columnMappings"];

interface MetadataCSVUploadProps {
  onSubmitAction: (
    metadata: DatabaseMetadata,
    databaseType: DatabaseType,
  ) => void;
}

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DatabaseTypeSelectorProps {
  control: Control<FormValues>;
  selectedType: DatabaseType;
}

function DatabaseTypeSelector({
  control,
  selectedType,
}: DatabaseTypeSelectorProps) {
  const databaseInstructions = selectedType
    ? DATABASE_INSTRUCTIONS[selectedType]
    : null;

  return (
    <>
      <FormField
        control={control}
        name="databaseType"
        render={({ field }) => (
          <FormItem className="max-w-[300px]">
            <FormLabel>Database Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a database type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DATABASE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {databaseInstructions && (
        <Card className="p-4">
          <h3 className="mb-2 font-medium">Instructions</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {databaseInstructions.description}
          </p>
          <div className="rounded-md bg-muted p-4">
            <pre className="whitespace-pre-wrap text-sm">
              {databaseInstructions.query}
            </pre>
          </div>
        </Card>
      )}
    </>
  );
}

interface FileUploadZoneProps {
  onFileAccepted: (data: CSVRow[], columns: string[]) => void;
  uploadedFile: { name: string; size: number } | null;
  onRemoveFile: () => void;
}

function FileUploadZone({
  onFileAccepted,
  uploadedFile,
  onRemoveFile,
}: FileUploadZoneProps) {
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      Papa.parse<CSVRow>(file, {
        complete: (results) => {
          if (!Array.isArray(results.data) || results.data.length === 0) {
            toast({
              title: "Error",
              description: "Invalid or empty CSV file",
              variant: "destructive",
            });
            return;
          }

          if (!results.data[0]) return;
          const headers = Object.keys(results.data[0]);
          onFileAccepted(results.data, headers);
        },
        header: true,
        skipEmptyLines: true,
      });
    },
    [toast, onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      onDrop(acceptedFiles).catch(console.error);
    },
    accept: {
      "text/csv": [".csv"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!uploadedFile) {
    return (
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
          <span className="text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          CSV file only (max. 10MB)
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <div>
          <p className="text-sm font-medium">{uploadedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(uploadedFile.size)}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemoveFile}
        className="text-destructive hover:text-destructive/90"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}

interface ColumnMappingFormProps {
  control: Control<FormValues>;
  csvColumns: string[];
  databaseInstructions: DatabaseInstructions;
}

function ColumnMappingForm({
  control,
  csvColumns,
  databaseInstructions,
}: ColumnMappingFormProps) {
  return (
    <Card className="p-4">
      <h3 className="mb-2 font-medium">Column Mappings</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(databaseInstructions.columnMappings).map(
          ([key, expectedColumn]) => (
            <FormField
              key={key}
              control={control}
              name={`columnMappings.${key}` as any}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel
                    className={cn(
                      "text-xs",
                      !field.value && "text-destructive",
                    )}
                  >
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({expectedColumn})
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={cn("h-8", !field.value && "bg-destructive")}
                      >
                        <SelectValue placeholder="Select a column" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {csvColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ),
        )}
      </div>
    </Card>
  );
}

export function MetadataCSVUpload({ onSubmitAction }: MetadataCSVUploadProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [csvColumns, setCSVColumns] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      databaseType: "" as DatabaseType,
      columnMappings: {
        projectId: "",
        datasetId: "",
        tableName: "",
        columnName: "",
        columnType: "",
        tableDescription: "",
        columnDescription: "",
      },
    },
  });

  const selectedDatabaseType = form.watch("databaseType");
  const databaseInstructions = DATABASE_INSTRUCTIONS[selectedDatabaseType];

  useEffect(() => {
    const updateMappings = async () => {
      if (csvColumns.length > 0) {
        const findMatch = (pattern: RegExp, columns: string[]) => {
          for (const col of columns) {
            if (pattern.test(col.toLowerCase())) return col;
          }
          return "";
        };

        type MappingPatterns = Record<
          keyof FormValues["columnMappings"],
          RegExp
        >;

        const patterns: MappingPatterns = {
          projectId: /^project_id$/i,
          datasetId: /^dataset_id$/i,
          tableName: /^table_name$/i,
          tableDescription: /^table_description$/i,
          columnName: /^column_name$/i,
          columnType: /^data_type$/i,
          columnDescription: /^column_description$/i,
        };

        const mappings = Object.entries(patterns).reduce(
          (acc, [key, pattern]) => {
            const match = findMatch(pattern, csvColumns);
            if (match && key in databaseInstructions.columnMappings) {
              acc[key as keyof FormValues["columnMappings"]] = match;
            }
            return acc;
          },
          {} as FormValues["columnMappings"],
        );

        form.setValue("columnMappings", mappings, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });

        await form.trigger();
      }
    };
    void updateMappings();
  }, [csvColumns, form, databaseInstructions?.columnMappings]);

  const handleFileAccepted = (data: CSVRow[], columns: string[]) => {
    setCSVData(data);
    setCSVColumns(columns);
    setUploadedFile({
      name: "uploaded.csv",
      size: new Blob([JSON.stringify(data)]).size,
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setCSVData([]);
    setCSVColumns([]);
    form.setValue("columnMappings", {
      projectId: "",
      datasetId: "",
      tableName: "",
      columnName: "",
      columnType: "",
      tableDescription: "",
      columnDescription: "",
    });
  };

  const handleSubmit = (values: FormValues) => {
    if (!csvData.length) {
      toast({
        title: "Error",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    const requiredMappings = Object.entries(
      databaseInstructions.columnMappings,
    ).filter(
      ([key]) =>
        !values.columnMappings[key as keyof FormValues["columnMappings"]],
    );

    if (requiredMappings.length > 0) {
      toast({
        title: "Error",
        description: `Missing column mappings: ${requiredMappings
          .map(([key]) => key)
          .join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const metadata = transformToMetadata(csvData, values.columnMappings);
      onSubmitAction(metadata, values.databaseType);
      toast({
        title: "Success",
        description: "Metadata has been processed successfully",
        variant: "default",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to process metadata",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <DatabaseTypeSelector
            control={form.control}
            selectedType={selectedDatabaseType}
          />

          {selectedDatabaseType && (
            <>
              <FileUploadZone
                onFileAccepted={handleFileAccepted}
                uploadedFile={uploadedFile}
                onRemoveFile={handleRemoveFile}
              />

              {csvData.length > 0 && (
                <div style={{ height: "400px", width: "100%" }}>
                  <TableDataView data={csvData} />
                </div>
              )}

              {csvColumns.length > 0 && (
                <ColumnMappingForm
                  control={form.control}
                  csvColumns={csvColumns}
                  databaseInstructions={databaseInstructions}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!csvData.length || !form.formState.isValid}
              >
                Process Metadata
              </Button>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
