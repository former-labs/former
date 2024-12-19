"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Editor } from "@monaco-editor/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  query: z.string().min(1, "Query is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const UpsertKnowledgeDialog = ({
  open,
  onOpenChange,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    name: string;
    description: string;
    query: string;
  };
}) => {
  console.log("initialData", initialData);

  const utils = api.useUtils();
  const createKnowledge = api.knowledge.createKnowledge.useMutation({
    onSuccess: async () => {
      await utils.knowledge.listKnowledge.invalidate();
      onOpenChange(false);
      form.reset();
    },
  });

  const updateKnowledge = api.knowledge.updateKnowledge.useMutation({
    onSuccess: async () => {
      await utils.knowledge.listKnowledge.invalidate();
      onOpenChange(false);
      form.reset();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      query: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialData || {
          name: "",
          description: "",
          query: "",
        },
      );
    }
  }, [form, initialData, open]);

  const onSubmit = (values: FormValues) => {
    if (initialData) {
      updateKnowledge.mutate({
        knowledgeId: initialData.id,
        ...values,
      });
    } else {
      createKnowledge.mutate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Add"} Example Query
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Update" : "Create"} an example query that the AI can
            use as a reference for more accurate SQL.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example query name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this query does"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Query</FormLabel>
                  <FormControl>
                    <div className="h-[300px] rounded-md border">
                      <QueryEditor
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createKnowledge.isPending || updateKnowledge.isPending}
              >
                {initialData ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const QueryEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <Editor
      height="100%"
      language="sql"
      value={value}
      onChange={(value) => onChange(value ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        lineDecorationsWidth: 0,
        padding: { top: 8, bottom: 8 },
        scrollbar: {
          ignoreHorizontalScrollbarInContentHeight: true,
          alwaysConsumeMouseWheel: false,
        },
      }}
    />
  );
};
