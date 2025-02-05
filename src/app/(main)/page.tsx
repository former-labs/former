"use client";

import { PATH_EDITOR } from "@/lib/paths";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.push(PATH_EDITOR);
  }, [router]);

  return null;
}
