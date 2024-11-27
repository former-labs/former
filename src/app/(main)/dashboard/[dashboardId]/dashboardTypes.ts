import { type ViewData } from "@/components/charting/chartTypes";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";

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
  plotView: {
    viewData: ViewData;
  } | null;
  googleAnalyticsReport: {
    title: string;
    description: string;
    reportParameters: GoogleAnalyticsReportParameters;
  } | null;
};

export type DashboardType = {
  id: string;
  title: string;
  description: string | null;
  items: DashboardGridItemType[];
};
