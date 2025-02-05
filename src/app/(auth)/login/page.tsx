"use client";

import { Card } from "@/components/ui/card";
import { LogoFormer } from "@/components/utils/LogoFormer";
import { PATH_SIGNUP } from "@/lib/paths";
import Link from "next/link";
import { AuthFormComponent } from "../_components/AuthFormComponent";

export default function LoginPage() {
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
          <h1 className="text-center text-xl font-semibold">Login to Former</h1>
          <AuthFormComponent />

          <div className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href={PATH_SIGNUP} className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
