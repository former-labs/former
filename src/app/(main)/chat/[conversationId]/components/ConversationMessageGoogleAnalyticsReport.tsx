"use client";

import { SidebarGoogleAnalyticsReportEditor } from "@/components/analytics/googleAnalyticsReportEditor/SidebarGoogleAnalyticsReportEditor";
import { type ColumnDefinitions } from "@/components/charting/chartTypes";
import { TableDataView } from "@/components/charting/TableDataView";
import {
  RightSidebarPortal,
  useRightSidebarLock,
} from "@/components/navbar/right-sidebar";
import { Button } from "@/components/ui/button";
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
import { Download, Pencil, Play, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { ConversationMessageChartView } from "./ConversationMessageChartView";
import { SaveToDashboardDialog } from "./SaveToDashboardDialog";

export const ConversationMessageGoogleAnalyticsReport = ({
  message,
}: {
  message: MessageSelect;
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
    />
  );
};

type GoogleAnalyticsReportResultType =
  RouterOutputs["googleAnalytics"]["executeGoogleAnalyticsReport"];

const ConversationMessageGoogleAnalyticsReportContent = ({
  message,
  report,
}: {
  message: MessageSelect;
  report: GoogleAnalyticsReportSelect;
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
  const [isEditingReport, setIsEditingReport] = useRightSidebarLock(report.id);

  const executeReportMutation =
    api.googleAnalytics.executeGoogleAnalyticsReport.useMutation();

  useEffect(() => {
    const executeReport = async () => {
      if (!activeProperty) {
        setError("Please select a Google Analytics property first");
        handleReportResultChange(null);
        return;
      }

      try {
        const response = await executeReportMutation.mutateAsync({
          googleAnalyticsReportId: report.id,
          propertyId: activeProperty.propertyId,
        });
        if (response.success) {
          handleReportResultChange(response.data);
          setError(null);
        } else {
          handleReportResultChange(null);
          setError(response.error);
        }
      } catch (err) {
        console.error("Error executing GA4 report:", err);
        handleReportResultChange(null);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    };

    void executeReport();
  }, [report]); // Reactively listen for entire report to change, not just ID

  const handleExportCsv = () => {
    exportGoogleAnalyticsToCsv(reportResult);
  };

  const handleEditReport = () => {
    setIsEditingReport(true);
  };

  const handleReportResultChange = (
    result: GoogleAnalyticsReportResultType["data"] | null,
  ) => {
    setReportResult(result);
    if (result?.rows.length === 1) {
      setActiveTab("visualisation");
    }
  };

  const handleRunReport = async () => {
    if (!activeProperty) {
      setError("Please select a Google Analytics property first");
      handleReportResultChange(null);
      return;
    }

    try {
      const response = await executeReportMutation.mutateAsync({
        googleAnalyticsReportId: report.id,
        propertyId: activeProperty.propertyId,
      });
      if (response.success) {
        handleReportResultChange(response.data);
        setError(null);
      } else {
        handleReportResultChange(null);
        setError(response.error);
      }
    } catch (err) {
      console.error("Error executing GA4 report:", err);
      handleReportResultChange(null);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
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
              className="flex gap-x-2"
              variant="secondary"
              size="sm"
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4" />
              Save to Dashboard
            </Button>
            <Button
              className="flex gap-x-2"
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              className="flex gap-x-2"
              variant="secondary"
              size="sm"
              onClick={handleEditReport}
            >
              <Pencil className="h-4 w-4" />
              Edit Report
            </Button>
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
              isLoadingData={executeReportMutation.isPending}
            />
          )}
        </div>
      </div>

      <SaveToDashboardDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        messageId={message.id}
      />

      {isEditingReport && (
        <RightSidebarPortal>
          <SidebarGoogleAnalyticsReportEditor
            googleAnalyticsReportId={report.id}
            onClose={() => {
              setIsEditingReport(false);
            }}
          />
        </RightSidebarPortal>
      )}
    </div>
  );
};
