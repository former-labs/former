import {
  type ColumnDefinitions,
  type DataRow,
} from "@/components/charting/chartTypes";
import { ChartView } from "@/components/charting/ChartView";
import { api } from "@/trpc/react";

export const ConversationMessageChartView = ({
  messageId,
  columnDefinitions,
  data,
}: {
  messageId: string;
  columnDefinitions: ColumnDefinitions | null;
  data: DataRow[] | null;
}) => {
  const utils = api.useUtils();

  const {
    data: plotView,
    isLoading: isLoadingPlotView,
    isError: isErrorPlotView,
  } = api.conversation.getMessagePlotView.useQuery({ messageId: messageId });

  const setMessagePlotView = api.conversation.setMessagePlotView.useMutation({
    onSuccess: async () => {
      await utils.conversation.getMessagePlotView.invalidate({ messageId });
    },
  });

  if (isLoadingPlotView) {
    return <div>Loading...</div>;
  }

  if (isErrorPlotView) {
    return <div>Error loading plot.</div>;
  }

  if (!columnDefinitions || !data) {
    return <div>Loading data...</div>;
  }

  return (
    <ChartView
      viewData={plotView?.viewData ?? null}
      setViewData={async (view) => {
        // Nice lil optimistic update in the case where the view is being edited
        if (view && plotView) {
          utils.conversation.getMessagePlotView.setData(
            { messageId },
            { ...plotView, viewData: view },
          );
        }

        await setMessagePlotView.mutateAsync({
          messageId,
          viewData: view,
        });
      }}
      columnDefinitions={columnDefinitions}
      data={data}
      editMode={true}
    />
  );
};
