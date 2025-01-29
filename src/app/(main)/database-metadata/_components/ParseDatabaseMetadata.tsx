"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { DatabaseMetadata } from "@/types/connections";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const ParseDatabaseMetadata = ({
  onParsedAction,
}: {
  onParsedAction: (metadata: DatabaseMetadata) => void;
}) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  });

  const parseDatabaseMetadata =
    api.databaseMetadata.parseDatabaseMetadataWithAI.useMutation({
      onSuccess: (data) => {
        onParsedAction(data);
        form.reset();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error parsing metadata",
          description: error.message,
        });
      },
    });

  const onSubmit = (values: FormValues) => {
    parseDatabaseMetadata.mutate(values);
  };

  return (
    <div className="space-y-4 pt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description{" "}
                  <span className="text-blue-500">
                    (This may take a while for large databases)
                  </span>
                </FormLabel>
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
            <Button type="submit" loading={parseDatabaseMetadata.isPending}>
              Parse
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
