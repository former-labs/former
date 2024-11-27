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
  isLoadingData,
}: {
  messageId: string;
  columnDefinitions: ColumnDefinitions | null;
  data: DataRow[] | null;
  isLoadingData: boolean;
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

  if (isLoadingData) {
    return <div>Loading data...</div>;
  }

  if (!columnDefinitions || !data) {
    throw new Error("Data or column definitions missing");
  }

  return (
    <ChartView
      viewData={plotView?.viewData ?? null}
      setViewData={async (view) => {
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
