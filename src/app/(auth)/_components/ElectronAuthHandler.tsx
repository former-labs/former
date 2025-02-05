"use client";

import { PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK } from "@/lib/paths";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ElectronAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    // Listen for the auth token event from main process
    // This is probs dodge on remount
    if (typeof window !== "undefined" && "electron" in window) {
      window.electron.on("send-token", (token) => {
        console.log("Received token from Electron:", token);
        // Use complete URL including origin for Electron environment
        const callbackUrl = `${window.location.origin}${PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK}?code=${token}`;
        console.log("Redirecting to:", callbackUrl);
        window.location.href = callbackUrl;
      });
    }
  }, [router]);

  return null;
}
