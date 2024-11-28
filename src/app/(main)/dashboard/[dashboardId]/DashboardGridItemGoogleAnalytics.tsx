import {
  type ColumnDefinitions,
  type ViewData,
} from "@/components/charting/chartTypes";
import { ChartView } from "@/components/charting/ChartView";
import { TableDataView } from "@/components/charting/TableDataView";
import { ReportEditor } from "@/components/navbar/googleAnalyticsReportEditor/ReportEditor";
import {
  RightSidebarPortal,
  useRightSidebarLock,
} from "@/components/navbar/right-sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/utils/Loading";
import { getDebugMode } from "@/lib/debugMode";
import { exportGoogleAnalyticsToCsv } from "@/lib/googleAnalytics/exportGoogleAnalytics";
import type { GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { api, type RouterOutputs } from "@/trpc/react";
import { Download, Pencil, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { type DashboardGridItemType } from "./dashboardTypes";

type GoogleAnalyticsReportResultType =
  RouterOutputs["dashboard"]["executeGoogleAnalyticsReport"]["data"];

export const DashboardGridItemGoogleAnalytics = ({
  item,
  onDelete,
  onUpdateItem,
  editMode,
}: {
  item: DashboardGridItemType;
  onDelete: () => void;
  onUpdateItem: (item: DashboardGridItemType) => void;
  editMode: boolean;
}) => {
  if (!item.googleAnalyticsReport) {
    return (
      <div className="text-error-500">
        Failed to load Google Analytics report
      </div>
    );
  }

  return (
    <DashboardGridItemGoogleAnalyticsContent
      item={item}
      onDelete={onDelete}
      onUpdateItem={onUpdateItem}
      editMode={editMode}
    />
  );
};

export const DashboardGridItemGoogleAnalyticsContent = ({
  item,
  onDelete,
  onUpdateItem,
  editMode,
}: {
  item: DashboardGridItemType;
  onDelete: () => void;
  onUpdateItem: (item: DashboardGridItemType) => void;
  editMode: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    item.plotView?.viewData ? "visualisation" : "resultTable",
  );
  const [reportResult, setReportResult] =
    useState<GoogleAnalyticsReportResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingReport, setIsEditingReport] = useRightSidebarLock(
    item.localId,
  );

  const executeReportMutation =
    api.dashboard.executeGoogleAnalyticsReport.useMutation({
      onSuccess: (response) => {
        if (response.success) {
          setReportResult(response.data);
          setError(null);
        } else {
          setReportResult(null);
          setError(response.error);
        }
      },
      onError: (err) => {
        console.error("Error executing GA4 report:", err);
        setReportResult(null);
        setError(err.message);
      },
    });

  const handleRunReport = async () => {
    if (!item.googleAnalyticsReport) return;

    await executeReportMutation.mutateAsync({
      reportParameters: item.googleAnalyticsReport.reportParameters,
    });
  };

  useEffect(() => {
    if (item.googleAnalyticsReport) {
      void handleRunReport();
    }
  }, [item.googleAnalyticsReport]);

  // Disable report editor when not in edit mode
  useEffect(() => {
    if (!editMode && isEditingReport) {
      setIsEditingReport(false);
    }
  }, [editMode]);

  const handleExportCsv = () => {
    if (reportResult) {
      exportGoogleAnalyticsToCsv(reportResult);
    }
  };

  const handleEditReport = () => {
    setIsEditingReport(true);
  };

  const handleUpdateView = (viewData: ViewData | null) => {
    onUpdateItem({
      ...item,
      plotView: viewData
        ? {
            viewData,
          }
        : null,
    });
  };

  const handleReportSave = async ({
    title,
    description,
    reportParameters,
  }: {
    title: string;
    description: string;
    reportParameters: GoogleAnalyticsReportParameters;
  }) => {
    onUpdateItem({
      ...item,
      googleAnalyticsReport: {
        ...item.googleAnalyticsReport,
        reportParameters,
      },
    });
  };

  const columnDefinitions = reportResult
    ? reportResult.columns.reduce((acc: ColumnDefinitions, column) => {
        if (column.columnType === "dimension") {
          acc[column.name] = {
            type: column.dataType,
          };
        } else {
          acc[column.name] = {
            type: "number",
          };
        }
        return acc;
      }, {})
    : null;

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-auto bg-white p-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="resultTable">Result Table</TabsTrigger>
            {getDebugMode() && (
              <TabsTrigger value="resultJson">Result JSON</TabsTrigger>
            )}
            <TabsTrigger value="visualisation">Visualisation</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            className="flex gap-x-2"
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            disabled={!reportResult}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          {editMode && (
            <Button
              className="flex gap-x-2"
              variant="secondary"
              size="sm"
              onClick={handleEditReport}
            >
              <Pencil className="h-4 w-4" />
              Edit Report
            </Button>
          )}
          <Button
            className="flex gap-x-2"
            variant="secondary"
            size="sm"
            onClick={handleRunReport}
            disabled={executeReportMutation.isPending}
          >
            <Play className="h-4 w-4" />
            {executeReportMutation.isPending ? "Running..." : "Run Report"}
          </Button>
          {editMode && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-error-500 mx-16 my-16 text-center">
          <div className="mb-2 text-lg font-medium">
            There was an issue fetching this data.
          </div>
          <div className="mt-4 italic">{error}</div>
        </div>
      )}

      <div className="h-[500px] overflow-y-auto">
        {executeReportMutation.isPending ? (
          <div className="flex items-center justify-center p-4">
            <Loading />
          </div>
        ) : (
          <>
            {activeTab === "resultTable" && reportResult && (
              <TableDataView data={reportResult.rows} className="h-full" />
            )}

            {activeTab === "resultJson" && reportResult && (
              <pre className="overflow-auto rounded-md bg-gray-100 p-4">
                {JSON.stringify(reportResult, null, 2)}
              </pre>
            )}

            {activeTab === "visualisation" && (
              <>
                {!columnDefinitions || !reportResult?.rows ? (
                  <div className="flex items-center justify-center p-4">
                    <Loading />
                  </div>
                ) : (
                  <ChartView
                    viewData={item.plotView?.viewData ?? null}
                    setViewData={handleUpdateView}
                    columnDefinitions={columnDefinitions}
                    data={reportResult.rows}
                    editMode={editMode}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {isEditingReport && (
        <RightSidebarPortal>
          <ReportEditor
            report={{
              title: item.googleAnalyticsReport.title,
              description: item.googleAnalyticsReport.description,
              reportParameters: item.googleAnalyticsReport.reportParameters,
            }}
            onReportSave={handleReportSave}
            isSaving={false}
            onClose={() => setIsEditingReport(false)}
          />
        </RightSidebarPortal>
      )}
    </div>
  );
};
