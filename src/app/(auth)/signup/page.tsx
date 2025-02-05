"use client";

import { Card } from "@/components/ui/card";
import { LogoFormer } from "@/components/utils/LogoFormer";
import { PATH_LOGIN } from "@/lib/paths";
import Link from "next/link";
import { AuthFormComponent } from "../_components/AuthFormComponent";

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

          <AuthFormComponent />

          <div className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href={PATH_LOGIN} className="text-blue-600 hover:underline">
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
