"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export const GoogleAnalyticsConnectButton = ({
  className,
  onError,
}: {
  className?: string;
  onError?: (error: string) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const connectGoogleAnalytics =
    api.integration.connectGoogleAnalytics.useMutation({
      onError: (error) => {
        setIsLoading(false);
        onError?.(error.message);
      },
    });

  const handleConnectGoogleAnalytics = async () => {
    setIsLoading(true);
    const { redirectUrl } = await connectGoogleAnalytics.mutateAsync();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      disabled={isLoading}
      size="lg"
      variant="secondary"
      className={`flex w-full items-center justify-center ${className ?? ""}`}
      onClick={handleConnectGoogleAnalytics}
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
  );
};
