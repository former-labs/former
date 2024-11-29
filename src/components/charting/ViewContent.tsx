import dynamic from "next/dynamic";
import { type Data } from "plotly.js";
import { useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import {
  type ColumnDefinitions,
  type DataRow,
  type ViewData,
} from "./chartTypes";

// Dynamically import Plot with no SSR to prevent 'self is not defined' error
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export const ViewContent = ({
  view,
  data,
  columnDefinitions,
}: {
  view: ViewData | null;
  data: DataRow[];
  columnDefinitions: ColumnDefinitions;
}) => {
  if (!view) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2">
        <h2 className="text-xl font-bold">{view.name}</h2>
      </div>

      {view.description && (
        <p className="mb-4 text-sm text-gray-500">{view.description}</p>
      )}

      <div className="flex flex-grow">
        {isViewDataValid({ viewData: view, columnDefinitions }) ? (
          <ChartRenderer
            view={view}
            filteredData={data}
            columnDefinitions={columnDefinitions}
          />
        ) : (
          <div className="flex w-full items-center justify-center text-red-500">
            This visualization references columns that no longer exist in the
            data.
          </div>
        )}
      </div>
    </div>
  );
};

const ChartRenderer = ({
  view,
  filteredData,
  columnDefinitions,
}: {
  view: ViewData;
  filteredData: DataRow[];
  columnDefinitions: ColumnDefinitions;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Having this unused variable seems to make the plot reactively resize
  // instead of only when you finish the resize.
  // I'm guessing because it forces it to rerender somehow
  // Anyway ima keep it :)
  const size = useResizeObserver({ ref: containerRef });

  const baseLayout = {
    // title: view.name,
    autosize: true, // Let Plotly handle autosizing
    margin: { l: 50, r: 50, b: 50, t: 0, pad: 4 },
  };

  const getAxisType = (metric: keyof ColumnDefinitions) => {
    const columnDefinition = columnDefinitions[metric];
    if (!columnDefinition) {
      throw new Error(`Column definition not found for metric: ${metric}`);
    }

    const type = columnDefinition.type;
    switch (type) {
      case "date":
        return "date";
      case "number":
        return "numeric";
      case "string":
        return "category";
    }
  };

  const renderPlot = ({
    trace,
    layout = {},
  }: {
    trace: Partial<Data>[] | Partial<Data>;
    layout?: Record<string, any>;
  }) => (
    <div ref={containerRef} className="h-full w-full">
      <Plot
        data={Array.isArray(trace) ? trace : [trace]}
        layout={{ ...baseLayout, ...layout }}
        config={{ responsive: true, displayModeBar: true }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );

  if (view.viewType === "lineChart") {
    const { xAxis, yAxis } = view.viewTypeMetadata;
    const trace: Partial<Data> = {
      x: filteredData.map((item) => item[xAxis] ?? null),
      y: filteredData.map((item) => item[yAxis] ?? null),
      type: "scatter",
      mode: "lines+markers",
      marker: { color: "blue" },
    };

    return renderPlot({
      trace,
      layout: {
        xaxis: { title: xAxis, type: getAxisType(xAxis) },
        yaxis: { title: yAxis, type: getAxisType(yAxis) },
      },
    });
  }

  if (view.viewType === "scatterChart") {
    const { xAxis, yAxis } = view.viewTypeMetadata;
    const trace: Partial<Data> = {
      x: filteredData.map((item) => item[xAxis] ?? null),
      y: filteredData.map((item) => item[yAxis] ?? null),
      type: "scatter",
      mode: "markers",
      marker: { color: "blue" },
    };

    return renderPlot({
      trace,
      layout: {
        xaxis: { title: xAxis, type: getAxisType(xAxis) },
        yaxis: { title: yAxis, type: getAxisType(yAxis) },
      },
    });
  }

  if (view.viewType === "pieChart") {
    const { labels, values } = view.viewTypeMetadata;
    const trace: Partial<Data> = {
      labels: filteredData.map((item) => item[labels] ?? null),
      values: filteredData.map((item) => item[values] ?? null),
      type: "pie",
    };

    return renderPlot({ trace });
  }

  if (view.viewType === "barChart") {
    const { xAxis, yAxis } = view.viewTypeMetadata;
    const trace: Partial<Data> = {
      x: filteredData.map((item) => item[xAxis] ?? null),
      y: filteredData.map((item) => item[yAxis] ?? null),
      type: "bar",
    };

    return renderPlot({
      trace,
      layout: {
        xaxis: { title: xAxis, type: getAxisType(xAxis) },
        yaxis: { title: yAxis, type: getAxisType(yAxis) },
      },
    });
  }

  if (view.viewType === "boxPlot") {
    const { x, y } = view.viewTypeMetadata;
    const trace: Partial<Data> = {
      x: filteredData.map((item) => item[x] ?? null),
      y: filteredData.map((item) => item[y] ?? null),
      type: "box",
    };

    return renderPlot({
      trace,
      layout: {
        xaxis: { title: x, type: getAxisType(x) },
        yaxis: { title: y, type: getAxisType(y) },
      },
    });
  }

  if (view.viewType === "clusteredChart") {
    const { xAxis, yAxis, groupBy } = view.viewTypeMetadata;

    // Group the data by groupBy field
    const groups = Array.from(
      new Set(filteredData.map((item) => item[groupBy])),
    );

    // Prepare traces for each group
    const traces: Data[] = groups.map((groupValue) => {
      const groupData = filteredData.filter(
        (item) => item[groupBy] === groupValue,
      );
      return {
        x: groupData.map((item) => item[xAxis] ?? null),
        y: groupData.map((item) => item[yAxis] ?? null),
        name: groupValue?.toString() ?? "",
        type: "bar",
      };
    });

    return renderPlot({
      trace: traces,
      layout: {
        xaxis: { title: xAxis, type: getAxisType(xAxis) },
        yaxis: { title: yAxis, type: getAxisType(yAxis) },
      },
    });
  }

  const _exhaustiveCheck: never = view;
};

const isViewDataValid = ({
  viewData,
  columnDefinitions,
}: {
  viewData: ViewData;
  columnDefinitions: ColumnDefinitions;
}): boolean => {
  switch (viewData.viewType) {
    case "lineChart":
    case "scatterChart":
    case "barChart":
      return (
        viewData.viewTypeMetadata.xAxis in columnDefinitions &&
        viewData.viewTypeMetadata.yAxis in columnDefinitions
      );
    case "pieChart":
      return (
        viewData.viewTypeMetadata.labels in columnDefinitions &&
        viewData.viewTypeMetadata.values in columnDefinitions
      );
    case "boxPlot":
      return (
        viewData.viewTypeMetadata.x in columnDefinitions &&
        viewData.viewTypeMetadata.y in columnDefinitions
      );
    case "clusteredChart":
      return (
        viewData.viewTypeMetadata.xAxis in columnDefinitions &&
        viewData.viewTypeMetadata.yAxis in columnDefinitions &&
        viewData.viewTypeMetadata.groupBy in columnDefinitions
      );
  }
};
