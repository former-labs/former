import { type ViewData, viewDataSchema } from "@/components/charting/chartTypes";
import { type GoogleAnalyticsReportParameters, googleAnalyticsReportParametersSchema } from "@/server/googleAnalytics/reportParametersSchema";
import { z } from "zod";

/*
We hold a list of these items locally.
Local updates will update these items in local state via the localId.

Pressing save will send this full list to the server.
*/
export type DashboardGridItemType = {
  localId: string;
  dashboardItem: {
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
  };
  googleAnalyticsReport: {
    title: string;
    description: string;
    reportParameters: GoogleAnalyticsReportParameters;
  };
  plotView: {
    viewData: ViewData;
  } | null;
};

export type DashboardType = {
  id: string;
  title: string;
  description: string | null;
  items: DashboardGridItemType[];
};

export const dashboardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  items: z.array(z.object({
    localId: z.string(),
    dashboardItem: z.object({
      gridX: z.number(),
      gridY: z.number(),
      gridWidth: z.number(),
      gridHeight: z.number()
    }),
    googleAnalyticsReport: z.object({
      title: z.string(),
      description: z.string(),
      reportParameters: googleAnalyticsReportParametersSchema
    }),
    plotView: z.object({
      viewData: viewDataSchema
    }).nullable(),
  }))
});
