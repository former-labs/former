"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  return (
    <div className="h-full max-h-[100vh]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={80} minSize={15}>
          <div className="h-full px-4 pt-8">
            <SqlEditor />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
          <ChatSidebar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
