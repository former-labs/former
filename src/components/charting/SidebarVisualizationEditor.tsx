"use client";

import {
  type ColumnDefinitions,
  type ViewData,
} from "@/components/charting/chartTypes";
import { ViewForm } from "@/components/charting/ViewForm";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";

export const SidebarVisualizationEditor = ({
  messageItemId,
  columnDefinitions,
}: {
  messageItemId: string;
  columnDefinitions: ColumnDefinitions;
}) => {
  const utils = api.useUtils();

  const {
    data: plotView,
    isLoading: isLoadingPlotView,
    isError: isErrorPlotView,
  } = api.conversation.getMessageItemPlotView.useQuery({ messageItemId });

  const setMessagePlotView =
    api.conversation.setMessageItemPlotView.useMutation({
      onSuccess: async () => {
        await utils.conversation.getMessageItemPlotView.invalidate({
          messageItemId,
        });
      },
    });

  if (isLoadingPlotView) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isErrorPlotView) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Error loading visualization
      </div>
    );
  }

  const handleSetView = async (view: ViewData | null) => {
    // Optimistic update
    if (view && plotView) {
      utils.conversation.getMessageItemPlotView.setData(
        { messageItemId: messageItemId },
        { ...plotView, viewData: view },
      );
    }

    await setMessagePlotView.mutateAsync({
      messageItemId,
      viewData: view,
    });
  };

  return (
    <div className="p-4">
      <ViewForm
        initialData={plotView?.viewData}
        columnDefinitions={columnDefinitions}
        onSubmit={handleSetView}
        submitLabel="Update View"
      />
    </div>
  );
};
