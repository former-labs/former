"use client";

import { useEffect, useState } from "react";

import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Form, useForm } from "react-hook-form";
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

export const OnboardingPage = () => {
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

    const { workspaceId } = await createWorkspace.mutateAsync({
      workspaceName: values.workspaceName,
    });

    if (!workspaceId) {
      setError("Failed to create workspace");
      setIsLoading(false);
      return;
    }

    // Send them to Google Analytics
    await connectGoogleAnalytics.mutateAsync({
      workspaceId,
    });
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6">
      <div className="z-10 flex w-full max-w-sm flex-col rounded-lg border-2 border-gray-200 bg-white p-8 shadow-sm">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleCreateWorkspace)}
            className="flex h-full flex-col justify-between space-y-10"
          >
            <FormField
              control={form.control}
              name="workspaceName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Choose a name for your workspace"
                    />
                  </FormControl>
                  <FormMessage className="text-error-500" />
                </FormItem>
              )}
            />
            <div className="flex gap-x-2">
              <Button type="submit" disabled={isLoading}>
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
        <p className="text-error-500 self-center text-center">{error}</p>
      )}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(950px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-50%] h-[200%] skew-y-12",
        )}
      />
    </div>
  );
};
