"use client";

import { PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK } from "@/lib/paths";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ElectronAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    // Only run in Electron environment
    if (typeof window !== "undefined" && "electron" in window) {
      // Listen for the auth token event from main process
      window.electron.on("send-token", (token) => {
        console.log("Received token from Electron:", token);
        // Use complete URL including origin for Electron environment
        const callbackUrl = `${window.location.origin}${PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK}?code=${token}`;
        console.log("Redirecting to:", callbackUrl);
        router.push(callbackUrl);
      });
    }
  }, [router]);

  return null;
}
