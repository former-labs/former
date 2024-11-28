"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";

const getErrorDetails = (error: string) => {
  switch (error) {
    case "callback_failed":
      return {
        title: "Authentication Failed",
        description:
          "Failed to authenticate with service. Please try again or contact elliott@itsverve.com",
      };
    default:
      return {
        title: "Unknown Error",
        description:
          "An unknown error occurred. Please try again or contact elliott@itsverve.com",
      };
  }
};

export default function OnboardingPage() {
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
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

  const connectGoogleAnalytics =
    api.integration.connectGoogleAnalytics.useMutation({
      onError: (error) => {
        setError(error.message);
        setIsLoading(false);
      },
    });
  const createWorkspace = api.onboarding.createWorkspace.useMutation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get("error");

    if (error && toast) {
      console.log("Error in onboarding:", error);
      setTimeout(() => {
        const { title, description } = getErrorDetails(error);
        toast({
          variant: "destructive",
          title,
          description,
        });
      }, 1000);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [toast]);

  const handleCreateWorkspace = async (values: z.infer<typeof formSchema>) => {
    setError("");
    setIsLoading(true);

    const { role } = await createWorkspace.mutateAsync({
      workspaceName: values.workspaceName,
    });

    if (!role) {
      setError("Failed to create workspace");
      setIsLoading(false);
      return;
    } else {
      await handleWorkspaceSwitch(role);
    }

    // Send them to Google Analytics
    const { redirectUrl } = await connectGoogleAnalytics.mutateAsync({
      workspaceId: role.workspaceId,
    });

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      setError("Failed to connect Google Analytics");
      setIsLoading(false);
    }
  };

  return (
    <div className="z-10 flex w-full max-w-sm flex-col rounded-lg border-2 border-border bg-background p-8 shadow-sm">
      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateWorkspace)}
            className="flex h-full flex-col justify-between space-y-4"
          >
            <div>
              <h1 className="mb-4 text-center text-xl font-semibold">
                Create a workspace
              </h1>
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
            </div>
            <div className="flex gap-x-2">
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
                  <Image
                    src="https://storage.googleapis.com/verve-assets/logos/google-analytics.svg"
                    alt="Google Analytics"
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                )}
                Connect Google Analytics
              </Button>
            </div>
          </form>
        </Form>
      </div>
      {error && (
        <p className="self-center text-center text-destructive-foreground">
          {error}
        </p>
      )}
    </div>
  );
}
