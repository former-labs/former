"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AuthComplete() {
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  const [hasRedirected, setHasRedirected] = useState(false);

  const handleRedirect = useCallback(() => {
    setHasRedirected(true);
    const target = searchParams.get("target");
    if (target) {
      const redirectUrl = new URL(target);
      redirectUrl.searchParams.set("code", searchParams.get("code") || "");
      redirectUrl.searchParams.set("next", searchParams.get("next") || "/");
      window.location.href = redirectUrl.toString();
    }
    window.close();
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0 && !hasRedirected) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !hasRedirected) {
      handleRedirect();
    }
  }, [countdown, hasRedirected, handleRedirect]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">
          Launching the Verve desktop app
        </h1>
        {countdown > 0 ? (
          <p className="mb-6">Redirecting in {countdown} seconds...</p>
        ) : (
          <p className="mb-6">
            Click &apos;Open Verve&apos; to launch the desktop app. You may then
            close this window.
          </p>
        )}
      </div>
    </div>
  );
}
