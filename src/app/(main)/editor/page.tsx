"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useData } from "@/contexts/DataContext";
import dynamic from "next/dynamic";
import { useEventListener } from "usehooks-ts";
import { ChatSidebar } from "./_components/Chat";
import { useChat } from "./_components/chatStore";

/*
  If this is not dynamic, hot reload seems to cause the entire page to reload.
*/
const SqlEditor = dynamic(
  () => import("./_components/SqlEditor").then((mod) => mod.SqlEditor),
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>,
  },
);

export default function Page() {
  const { databaseMetadata } = useData();
  const { createChat } = useChat();

  useEventListener("keydown", (e) => {
    // Check for Cmd+L (Mac) or Ctrl+L (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "l") {
      console.log("create chat cmd+l");
      e.preventDefault();
      createChat();
    }
  });

  if (!databaseMetadata) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-lg text-gray-500">
          Please connect a database to continue
        </div>
        <div className="text-gray-500">
          tbh we can probs let ppl edit regardless but for now this simplifies
          the cases i need to handle
        </div>
      </div>
    );
  }

  return (
    <div className="h-full max-h-[100vh]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={15}>
          <div className="h-full pt-8">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                <SqlEditor />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={15}>
                <div className="h-full bg-red-50 p-4">Run table</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
          <ChatSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
