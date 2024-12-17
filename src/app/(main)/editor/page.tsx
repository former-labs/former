"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useData } from "@/contexts/DataContext";
import dynamic from "next/dynamic";
import { ChatSidebar } from "./_components/Chat";

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
  const { warehouseMetadata } = useData();

  if (!warehouseMetadata) {
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
          <div className="h-full px-4 pt-8">
            <SqlEditor />
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
