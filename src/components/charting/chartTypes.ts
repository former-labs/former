import { z } from "zod";

export type ColumnDefinition = {
  type: "date" | "number" | "string";
  // description: string;
};

export type ColumnDefinitions = Record<string, ColumnDefinition>;

export type DataRow = Record<string, string | number>;

export type Metric = keyof ColumnDefinitions;

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "isEmpty"
  | "isNotEmpty"
  | "is"
  | "isNot"
  | "contains"
  | "doesNotContain"
  | "startsWith"
  | "endsWith"
  | "isBefore"
  | "isAfter"
  | "isOnOrBefore"
  | "isOnOrAfter";

export type Filter = {
  id: string;
  column: Metric;
  operator: FilterOperator;
  value: string;  // TODO: Be careful when comparing since this is a string
};

export type FilterData = {
  filters: Filter[];
}

export type SharedViewFields = {
  name: string;
  description: string;
};

export type LineChartView = SharedViewFields & {
  viewType: "lineChart";
  viewTypeMetadata: {
    xAxis: Metric;
    yAxis: Metric;
  };
};

export type ScatterChartView = SharedViewFields & {
  viewType: "scatterChart";
  viewTypeMetadata: {
    xAxis: Metric;
    yAxis: Metric;
  };
};

export type PieChartView = SharedViewFields & {
  viewType: "pieChart";
  viewTypeMetadata: {
    labels: Metric;
    values: Metric;
  };
};

export type BarChartView = SharedViewFields & {
  viewType: "barChart";
  viewTypeMetadata: {
    xAxis: Metric;
    yAxis: Metric;
  };
};

export type BoxPlotView = SharedViewFields & {
  viewType: "boxPlot";
  viewTypeMetadata: {
    x: Metric;
    y: Metric;
  };
};

export type ClusteredChartView = SharedViewFields & {
  viewType: "clusteredChart";
  viewTypeMetadata: {
    xAxis: Metric;
    yAxis: Metric;
    groupBy: Metric;
  };
};

export type ViewData = LineChartView | PieChartView | ClusteredChartView | ScatterChartView | BarChartView | BoxPlotView;


export const viewDataSchema = z.discriminatedUnion("viewType", [
  z.object({
    viewType: z.literal("lineChart"),
    name: z.string(),
    description: z.string(),
    viewTypeMetadata: z.object({
      xAxis: z.string(),
      yAxis: z.string(),
    }),
  }),
  z.object({
    viewType: z.literal("scatterChart"),
    name: z.string(),
    description: z.string(),
    viewTypeMetadata: z.object({
      xAxis: z.string(),
      yAxis: z.string(),
    }),
  }),
  z.object({
    viewType: z.literal("pieChart"),
    name: z.string(),
    description: z.string(),
    viewTypeMetadata: z.object({
      labels: z.string(),
      values: z.string(),
    }),
  }),
  z.object({
    viewType: z.literal("barChart"),
    name: z.string(),
    description: z.string(),
    viewTypeMetadata: z.object({
      xAxis: z.string(),
      yAxis: z.string(),
    }),
  }),
  z.object({
    viewType: z.literal("boxPlot"),
    name: z.string(),
    description: z.string(),
    viewTypeMetadata: z.object({
      x: z.string(),
      y: z.string(),
    }),
  }),
  z.object({
    viewType: z.literal("clusteredChart"),
    name: z.string(),
    description: z.string(),
    viewTypeMetadata: z.object({
      xAxis: z.string(),
      yAxis: z.string(),
      groupBy: z.string(),
    }),
  }),
]);
