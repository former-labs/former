import {
  type ColumnDefinitions,
  type DataRow,
} from "@/components/charting/chartTypes";
import { ChartView } from "@/components/charting/ChartView";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
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
    <>
      {data[0] && data.length === 1 ? (
        <SingleValueRenderer data={data[0]} />
      ) : (
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
      )}
    </>
  );
};

export const SingleValueRenderer = ({ data }: { data: DataRow }) => (
  <div className="flex h-full w-full flex-col items-center justify-center">
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-white p-8 shadow-md">
      <div className="text-6xl font-bold">{Object.values(data)[0]}</div>
      <div className="mt-4 text-xl text-gray-500">
        {googleAnalyticsDefinitions.metrics.find(
          (metric) => metric.name === Object.keys(data)[0],
        )?.displayName ?? Object.keys(data)[0]}
      </div>
    </div>
  </div>
);
