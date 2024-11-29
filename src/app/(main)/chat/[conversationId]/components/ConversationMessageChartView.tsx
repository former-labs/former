import {
  type ColumnDefinitions,
  type DataRow,
} from "@/components/charting/chartTypes";
import { ViewContent } from "@/components/charting/ViewContent";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
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
  const {
    data: plotView,
    isLoading: isLoadingPlotView,
    isError: isErrorPlotView,
  } = api.conversation.getMessagePlotView.useQuery({ messageId: messageId });

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
    <>
      {data[0] && data.length === 1 ? (
        <SingleValueRenderer data={data[0]} />
      ) : (
        <ViewContent
          view={plotView?.viewData ?? null}
          data={data}
          columnDefinitions={columnDefinitions}
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
