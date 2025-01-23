"use client";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useData } from "@/contexts/DataContext";
import { useEventListener } from "usehooks-ts";
import { ChatSidebar } from "./_components/chat/Chat";
import { useChat } from "./_components/chat/chatStore";
import { EditorSection } from "./_components/editor/EditorSection";
import { getActiveEditor } from "./_components/editor/editorStore";

export default function EditorPage() {
  const { databaseMetadata } = useData();
  const { createChat } = useChat();

  useEventListener("keydown", (e) => {
    // Check for Cmd+L (Mac) or Ctrl+L (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "l") {
      e.preventDefault();
      createChat({
        editorSelectionContent: getActiveEditor().editorSelectionContent,
      });
    }
  });

  if (!databaseMetadata) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-lg text-gray-500">
          Please connect a database to continue
        </div>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/integrations")}
          className="mt-4"
        >
          Connect Database
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full max-h-[100vh]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={15}>
          <div className="h-full pt-12">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70} minSize={30}>
                <EditorSection />
              </ResizablePanel>
              {/* <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={15}>
                <QueryResultPane />
              </ResizablePanel> */}
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
