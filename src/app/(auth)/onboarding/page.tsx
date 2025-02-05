"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegrations } from "@/contexts/DataContext";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { PATH_HOME } from "@/lib/paths";
import { api } from "@/trpc/react";
import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Comment
const getErrorDetails = (error: string) => {
  switch (error) {
    case "callback_failed":
      return {
        title: "Authentication Failed",
        description:
          "Failed to authenticate with service. Please try again or contact elliott@formerlabs.com",
      };
    default:
      return {
        title: "Unknown Error",
        description:
          "An unknown error occurred. Please try again or contact elliott@formerlabs.com",
      };
  }
};

export default function OnboardingPage() {
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { handleWorkspaceSwitch } = useAuth();
  const { addIntegration } = useIntegrations();

  const createDemoWorkspace = api.onboarding.createDemoWorkspace.useMutation();
  const createUser = api.user.createUser.useMutation();
  const { refetch: fetchDemoIntegration } =
    api.onboarding.retrieveDemoIntegration.useQuery(
      undefined, // no input params
      { enabled: false }, // disable automatic querying
    );

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

  const handleCreateWorkspace = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Ensure user exists first
      await createUser.mutateAsync();

      const { role } = await createDemoWorkspace.mutateAsync();

      if (!role) {
        setError("Failed to create workspace");
        return;
      }

      await handleWorkspaceSwitch(role);

      // Only fetch demo integration after workspace is created
      if (env.NEXT_PUBLIC_PLATFORM === "desktop") {
        const { data: demoIntegration } = await fetchDemoIntegration();
        if (demoIntegration) {
          await addIntegration({
            integration: {
              ...demoIntegration,
              workspaceId: role.workspace.id,
            },
          });
        }
      }

      router.push(PATH_HOME);
    } catch (err) {
      setError("An error occurred while creating the workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="z-10 flex w-full max-w-sm flex-col rounded-lg border-2 border-border bg-background p-8 shadow-sm">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to Former!</h1>
          <p className="mt-3 text-muted-foreground">
            Get started by creating a demo workspace with mock data to explore
            our AI features.
          </p>
        </div>

        <Button
          onClick={handleCreateWorkspace}
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
          Create Demo Workspace
        </Button>
      </div>
      {error && (
        <p className="self-center pt-2 text-center text-red-500">{error}</p>
      )}
    </div>
  );
}
