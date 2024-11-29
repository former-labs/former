"use client";

import { SidebarGoogleAnalyticsReportEditor } from "@/components/analytics/googleAnalyticsReportEditor/SidebarGoogleAnalyticsReportEditor";
import { type ColumnDefinitions } from "@/components/charting/chartTypes";
import { TableDataView } from "@/components/charting/TableDataView";
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
import {
  type GoogleAnalyticsReportSelect,
  type MessageSelect,
} from "@/server/db/schema";
import { api, type RouterOutputs } from "@/trpc/react";
import { BarChart3, Download, Pencil, RefreshCw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarVisualizationEditor } from "../../../../../components/charting/SidebarVisualizationEditor";
import { ConversationMessageChartView } from "./ConversationMessageChartView";
import { SaveToDashboardDialog } from "./SaveToDashboardDialog";

export const ConversationMessageGoogleAnalyticsReport = ({
  message,
  scrollToBottom,
}: {
  message: MessageSelect;
  scrollToBottom: () => void;
}) => {
  if (!message.googleAnalyticsReportId) {
    throw new Error("Message does not have a google analytics report id");
  }

  const { data: report, isLoading } =
    api.googleAnalytics.getGoogleAnalyticsReport.useQuery(
      {
        googleAnalyticsReportId: message.googleAnalyticsReportId,
      },
      {
        enabled: !!message.googleAnalyticsReportId,
      },
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-red-500">Failed to load Google Analytics report</div>
    );
  }

  return (
    <ConversationMessageGoogleAnalyticsReportContent
      message={message}
      report={report}
      scrollToBottom={scrollToBottom}
    />
  );
};

type GoogleAnalyticsReportResultType =
  RouterOutputs["googleAnalytics"]["executeGoogleAnalyticsReport"];

const ConversationMessageGoogleAnalyticsReportContent = ({
  message,
  report,
  scrollToBottom,
}: {
  message: MessageSelect;
  report: GoogleAnalyticsReportSelect;
  scrollToBottom: () => void;
}) => {
  const { activeProperty } = useGoogleAnalytics();
  const [activeTab, setActiveTab] = useState<string>(
    message.plotViewId ? "visualisation" : "resultTable",
  );
  const [reportResult, setReportResult] = useState<
    GoogleAnalyticsReportResultType["data"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useRightSidebarLock(
    `edit-message-${message.id}`,
  );
  const [sidebarTab, setSidebarTab] = useState<"dataSource" | "visualisation">(
    "dataSource",
  );

  const executeReportMutation =
    api.googleAnalytics.executeGoogleAnalyticsReport.useMutation({
      onSuccess: (response) => {
        if (response.success) {
          handleReportResultChange(response.data);
          setError(null);
        } else {
          handleReportResultChange(null);
          setError(response.error);
        }
      },
      onError: (err) => {
        console.error("Error executing GA4 report:", err);
        handleReportResultChange(null);
        setError(err.message);
      },
    });

  useEffect(() => {
    scrollToBottom();
  }, []);

  const executeReport = async () => {
    if (!activeProperty) {
      setError("Please select a Google Analytics property first");
      handleReportResultChange(null);
      return;
    }

    await executeReportMutation.mutateAsync({
      googleAnalyticsReportId: report.id,
      propertyId: activeProperty.propertyId,
    });
  };

  useEffect(() => {
    if (activeProperty) {
      void executeReport();
    } else {
      handleReportResultChange(null);
    }
  }, [report, activeProperty]); // Reactively listen for entire report to change, not just ID

  const handleReportResultChange = (
    result: GoogleAnalyticsReportResultType["data"] | null,
  ) => {
    setReportResult(result);
    if (result?.rows.length === 1) {
      setActiveTab("visualisation");
    }
  };
  const handleExportCsv = () => {
    exportGoogleAnalyticsToCsv(reportResult);
  };

  const handleEditReport = () => {
    setIsEditingMessage(true);
    setSidebarTab("dataSource");
  };

  const handleEditVisualization = () => {
    setIsEditingMessage(true);
    setSidebarTab("visualisation");
  };

  const columnDefinitions = reportResult
    ? reportResult.columns.reduce((acc, column) => {
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
      }, {} as ColumnDefinitions)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-y-2 rounded-md bg-gray-200 p-4">
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
              onClick={() => setIsSaveDialogOpen(true)}
              title="Save to Dashboard"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportCsv}
              title="Export CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
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
            <Button
              variant="outline"
              size="icon"
              onClick={executeReport}
              disabled={executeReportMutation.isPending}
              title="Refresh Data"
            >
              <RefreshCw
                className={`h-4 w-4 ${executeReportMutation.isPending ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {error && <div className="mb-4 text-red-500">Error: {error}</div>}

        <div className="h-[500px] overflow-y-auto">
          {activeTab === "resultTable" && reportResult && (
            <TableDataView data={reportResult.rows} className="h-full" />
          )}

          {activeTab === "resultJson" && (
            <pre className="overflow-auto rounded-md bg-white p-4">
              {JSON.stringify(reportResult ?? { error }, null, 2)}
            </pre>
          )}

          {activeTab === "visualisation" && (
            <ConversationMessageChartView
              messageId={message.id}
              columnDefinitions={columnDefinitions}
              data={reportResult?.rows ?? null}
            />
          )}
        </div>
      </div>

      <SaveToDashboardDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        messageId={message.id}
      />

      {isEditingMessage && (
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
                onClick={() => setIsEditingMessage(false)}
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sidebarTab === "dataSource" && (
                <SidebarGoogleAnalyticsReportEditor
                  googleAnalyticsReportId={report.id}
                />
              )}
              {sidebarTab === "visualisation" && columnDefinitions && (
                <SidebarVisualizationEditor
                  messageId={message.id}
                  columnDefinitions={columnDefinitions}
                />
              )}
            </div>
          </div>
        </RightSidebarPortal>
      )}
    </div>
  );
};
