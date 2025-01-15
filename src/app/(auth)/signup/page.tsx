"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoFormer } from "@/components/utils/LogoFormer";
import { env } from "@/electron/env.electron";
import { PATH_ELECTRON_CALLBACK } from "@/lib/paths";
import { loginWithProvider } from "@/server/auth/actions";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      {/* Logo */}
      <div className="z-10 mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md">
          <LogoFormer className="h-10 w-10" />
        </div>
      </div>

      <Card className="z-10 w-[400px] bg-white p-6 shadow-lg">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Create your Former account
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign up with Google to get started.
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={async () => {
              if (typeof window !== "undefined" && window.electron) {
                console.log("ELECTRON LOGIN");
                const result = await loginWithProvider({
                  provider: "google",
                  redirectTo: `${env.DASHBOARD_URI}${PATH_ELECTRON_CALLBACK}`,
                  isElectron: true,
                });
                const url = typeof result === "string" ? result : result.url;
                window.electron.send("open-external", url);
                return;
              } else {
                await loginWithProvider({ provider: "google" });
              }
            }}
          >
            <Image
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </Button>

          <div className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </Card>

      <p className="z-10 mt-8 text-center text-sm text-muted-foreground">
        By signing up, you agree to our
        <br />
        <Link
          href="https://formerlabs.com/terms-and-conditions"
          className="hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="https://formerlabs.com/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
