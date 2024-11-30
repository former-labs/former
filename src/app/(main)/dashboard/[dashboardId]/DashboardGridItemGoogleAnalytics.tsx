import { ReportEditor } from "@/components/analytics/googleAnalyticsReportEditor/ReportEditor";
import {
  type ColumnDefinitions,
  type ViewData,
} from "@/components/charting/chartTypes";
import { TableDataView } from "@/components/charting/TableDataView";
import { ViewContent } from "@/components/charting/ViewContent";
import { ViewForm } from "@/components/charting/ViewForm";
import {
  RightSidebarPortal,
  useRightSidebarLock,
} from "@/components/navbar/right-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/utils/Loading";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";
import { getDebugMode } from "@/lib/debugMode";
import { exportGoogleAnalyticsToCsv } from "@/lib/googleAnalytics/exportGoogleAnalytics";
import type { GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { api, type RouterOutputs } from "@/trpc/react";
import {
  BarChart3,
  Download,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type DashboardGridItemType } from "./dashboardTypes";

type GoogleAnalyticsReportResultType =
  RouterOutputs["googleAnalytics"]["executeGoogleAnalyticsReportDirect"]["data"];

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
  const { activeProperty } = useGoogleAnalytics();
  const [activeTab, setActiveTab] = useState<string>(
    item.plotView?.viewData ? "visualisation" : "resultTable",
  );
  const [reportResult, setReportResult] =
    useState<GoogleAnalyticsReportResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingReport, setIsEditingReport] = useRightSidebarLock(
    item.localId,
  );
  const [sidebarTab, setSidebarTab] = useState<"dataSource" | "visualisation">(
    "dataSource",
  );

  const executeReportDirectMutation =
    api.googleAnalytics.executeGoogleAnalyticsReportDirect.useMutation({
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
    if (!item.googleAnalyticsReport || !activeProperty) {
      setError("Please select a Google Analytics property first");
      setReportResult(null);
      return;
    }

    await executeReportDirectMutation.mutateAsync({
      reportParameters: item.googleAnalyticsReport.reportParameters,
      propertyId: activeProperty.propertyId,
    });
  };

  useEffect(() => {
    if (item.googleAnalyticsReport && activeProperty) {
      void handleRunReport();
    } else {
      setReportResult(null);
    }
  }, [item.googleAnalyticsReport, activeProperty]);

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
    setSidebarTab("dataSource");
  };

  const handleEditVisualization = () => {
    setIsEditingReport(true);
    setSidebarTab("visualisation");
  };

  const handleUpdateView = async (viewData: ViewData | null) => {
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
    <div className="flex h-full w-full flex-col gap-2 overflow-auto rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="visualisation">Visualisation</TabsTrigger>
            <TabsTrigger value="resultTable">Result Table</TabsTrigger>
            {getDebugMode() && (
              <TabsTrigger value="resultJson">Result JSON</TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportCsv}
            disabled={!reportResult}
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
          {editMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Edit Options">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={handleEditReport}
                  className="font-semibold"
                >
                  <Pencil className="h-4 w-4 cursor-pointer" />
                  Edit Data Source
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleEditVisualization}
                  className="font-semibold"
                >
                  <BarChart3 className="h-4 w-4 cursor-pointer" />
                  Edit Visualization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRunReport}
            disabled={executeReportDirectMutation.isPending || !activeProperty}
            title="Refresh Data"
          >
            <RefreshCw
              className={`h-4 w-4 ${executeReportDirectMutation.isPending ? "animate-spin" : ""}`}
            />
          </Button>
          {editMode && (
            <Button variant="destructive" size="icon" onClick={onDelete}>
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
        {executeReportDirectMutation.isPending ? (
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
                  <ViewContent
                    view={item.plotView?.viewData ?? null}
                    columnDefinitions={columnDefinitions}
                    data={reportResult.rows}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {isEditingReport && (
        <RightSidebarPortal>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between p-4">
              <Tabs
                value={sidebarTab}
                onValueChange={(value) =>
                  setSidebarTab(value as "dataSource" | "visualisation")
                }
              >
                <TabsList>
                  <TabsTrigger value="dataSource">Data Source</TabsTrigger>
                  <TabsTrigger value="visualisation">Visualisation</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="icon"
                className="p-0"
                onClick={() => setIsEditingReport(false)}
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sidebarTab === "dataSource" && (
                <ReportEditor
                  report={{
                    title: item.googleAnalyticsReport.title,
                    description: item.googleAnalyticsReport.description,
                    reportParameters:
                      item.googleAnalyticsReport.reportParameters,
                  }}
                  onReportSave={handleReportSave}
                  isSaving={false}
                />
              )}
              {sidebarTab === "visualisation" && columnDefinitions && (
                <div className="p-4">
                  <ViewForm
                    initialData={item.plotView?.viewData}
                    columnDefinitions={columnDefinitions}
                    onSubmit={handleUpdateView}
                    submitLabel="Update Visualization"
                  />
                </div>
              )}
            </div>
          </div>
        </RightSidebarPortal>
      )}
    </div>
  );
};
