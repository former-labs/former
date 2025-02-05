"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_HOME } from "@/lib/paths";
import { api } from "@/trpc/react";

export const CreateWorkspaceDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { handleWorkspaceSwitch } = useAuth();

  const formSchema = z.object({
    workspaceName: z.string().min(3, "Must be at least 3 characters"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspaceName: "",
    },
  });

  const createWorkspace = api.onboarding.createWorkspace.useMutation();

  const handleCreateWorkspace = async (values: z.infer<typeof formSchema>) => {
    setError("");
    setIsLoading(true);

    try {
      const { role } = await createWorkspace.mutateAsync({
        workspaceName: values.workspaceName,
      });

      if (!role) {
        setError("Failed to create workspace");
        return;
      }

      await handleWorkspaceSwitch(role);
      onOpenChange(false);
      router.push(PATH_HOME);
    } catch (err) {
      setError("An error occurred while creating the workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateWorkspace)}
              className="flex flex-col space-y-4"
            >
              <FormField
                control={form.control}
                name="workspaceName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your workspace name..."
                      />
                    </FormControl>
                    <FormMessage className="text-error-500" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                variant="secondary"
                className="flex w-full items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Create Workspace
              </Button>
            </form>
          </Form>
        </div>
        {error && (
          <p className="self-center pt-2 text-center text-red-500">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
