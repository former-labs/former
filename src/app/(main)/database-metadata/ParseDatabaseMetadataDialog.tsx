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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const ParseDatabaseMetadataDialog = ({
  open,
  onOpenChange,
  onParsed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParsed: (metadata: string) => void;
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const parseDatabaseMetadata =
    api.databaseMetadata.parseDatabaseMetadataWithAI.useMutation({
      onSuccess: (data) => {
        onParsed(JSON.stringify(data, null, 2));
        onOpenChange(false);
        form.reset();
      },
    });

  const onSubmit = (values: FormValues) => {
    parseDatabaseMetadata.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen-md">
        <DialogHeader>
          <DialogTitle>Parse Database Metadata</DialogTitle>
          <DialogDescription>
            Describe your database schema in any form and let AI convert it to
            structured metadata JSON. You can paste a CREATE TABLE script here,
            or any other kind of database schema export.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your database schema..."
                      className="h-[300px]"
                      {...field}
                    />
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
              <Button type="submit" loading={parseDatabaseMetadata.isPending}>
                Parse
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
