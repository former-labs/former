import {
  type ColumnDefinitions,
  type DataRow,
} from "@/components/charting/chartTypes";
import { ViewContent } from "@/components/charting/ViewContent";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
import { api } from "@/trpc/react";

export const ConversationMessageChartView = ({
  messageItemId,
  columnDefinitions,
  data,
}: {
  messageItemId: string;
  columnDefinitions: ColumnDefinitions | null;
  data: DataRow[] | null;
}) => {
  const {
    data: plotView,
    isLoading: isLoadingPlotView,
    isError: isErrorPlotView,
  } = api.conversation.getMessageItemPlotView.useQuery({
    messageItemId,
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

  // Case 1: Single row with single key
  if (data[0] && Object.keys(data[0]).length === 1) {
    return <SingleValueRenderer data={data[0]} />;
  }

  // Case 2: Single row with multiple keys
  if (data[0] && data.length === 1) {
    const metricsInData = Object.keys(data[0]).filter((key) =>
      googleAnalyticsDefinitions.metrics.some((metric) => metric.name === key),
    );

    if (metricsInData.length > 0) {
      const gridColsClass =
        metricsInData.length === 1
          ? "grid-cols-1"
          : metricsInData.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

      return (
        <div className={`grid h-full gap-4 ${gridColsClass}`}>
          {metricsInData.map((metricKey) => (
            <SingleValueRenderer
              key={metricKey}
              data={{ [metricKey]: data[0]![metricKey]! }}
            />
          ))}
        </div>
      );
    }
  }

  // Case 3: Default to ViewContent

  return (
    <ViewContent
      view={plotView?.viewData ?? null}
      data={data}
      columnDefinitions={columnDefinitions}
    />
  );
};

export const SingleValueRenderer = ({ data }: { data: DataRow }) => {
  const value = Object.values(data)[0];
  if (value === undefined) return null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-white p-8 shadow-md">
        <div className="text-6xl font-bold">{formatValue(value)}</div>
        <div className="mt-4 text-xl text-gray-500">
          {googleAnalyticsDefinitions.metrics.find(
            (metric) => metric.name === Object.keys(data)[0],
          )?.displayName ?? Object.keys(data)[0]}
        </div>
      </div>
    </div>
  );
};

const formatValue = (value: string | number) => {
  return Number.isInteger(Number(value))
    ? Number(value)
    : Number(value).toFixed(2);
};
