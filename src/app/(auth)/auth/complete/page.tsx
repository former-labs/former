"use client";

import { PATH_HOME } from "@/lib/paths";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function AuthCompleteContent() {
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  const [hasRedirected, setHasRedirected] = useState(false);

  const handleRedirect = useCallback(() => {
    setHasRedirected(true);
    const target = searchParams.get("target");
    if (target) {
      const redirectUrl = new URL(target);
      redirectUrl.searchParams.set("code", searchParams.get("code") || "");
      redirectUrl.searchParams.set(
        "next",
        searchParams.get("next") || PATH_HOME,
      );
      window.location.href = redirectUrl.toString();
    }
    // window.close();
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
          Launching the Former desktop app
        </h1>
        {countdown > 0 ? (
          <p className="mb-6">Redirecting in {countdown} seconds...</p>
        ) : (
          <p className="mb-6">
            Desktop app launched. You may now close this window.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthComplete() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCompleteContent />
    </Suspense>
  );
}
