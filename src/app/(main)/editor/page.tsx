"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatSidebar } from "./_components/Chat";
import { SqlEditor } from "./_components/SqlEditor";

export default function Page() {
  return (
    <div className="h-full">
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
