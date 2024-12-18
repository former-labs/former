"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/editor");
  }, [router]);

  return null;
}
