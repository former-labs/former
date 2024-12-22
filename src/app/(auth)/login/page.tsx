"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoVerve } from "@/components/utils/LogoVerve";
import { PATH_AUTH_OAUTH_FORWARDING } from "@/lib/paths";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      {/* Logo */}
      <div className="z-10 mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md">
          <LogoVerve className="h-10 w-10" />
        </div>
      </div>

      <Card className="z-10 w-[400px] bg-white p-6 shadow-lg">
        <div className="space-y-6">
          <h1 className="text-center text-xl font-semibold">Login to Verve</h1>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={async () => {
              if (typeof window !== "undefined" && window.electron) {
                window.electron.send(
                  "open-external",
                  "http://localhost:3000" + PATH_AUTH_OAUTH_FORWARDING,
                );
                return;
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
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
