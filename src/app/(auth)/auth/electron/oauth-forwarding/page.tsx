"use client";

import { PATH_ELECTRON_CALLBACK } from "@/lib/paths";
import { loginWithProvider } from "@/server/auth/actions";
import { useEffect } from "react";

export default function ElectronAuthForwarder() {
  useEffect(() => {
    void (async () => {
      console.log("ELECTRON OAUTH FORWARDING", PATH_ELECTRON_CALLBACK);
      await loginWithProvider({
        provider: "google",
        redirectTo: `http://localhost:3000${PATH_ELECTRON_CALLBACK}`,
      });
    })();
  }, []);

  return null;
}
