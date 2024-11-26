"use client";

import { TableDataView } from "@/components/charting/TableDataView";
import { useRightSidebar } from "@/components/navbar/right-sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/utils/Loading";
import { getDebugMode } from "@/lib/debugMode";
import { exportGoogleAnalyticsToCsv } from "@/lib/googleAnalytics/exportGoogleAnalytics";
import {
  type GoogleAnalyticsReportSelect,
  type MessageSelect,
} from "@/server/db/schema";
import { api, type RouterOutputs } from "@/trpc/react";
import { Download, Pencil, Play, Save } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [activeTab, setActiveTab] = useState<string>("resultTable");
  const [reportResult, setReportResult] = useState<
    GoogleAnalyticsReportResultType["data"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const { openGoogleAnalyticsReport } = useRightSidebar();

  const executeReportMutation =
    api.googleAnalytics.executeGoogleAnalyticsReport.useMutation();

  useEffect(() => {
    const executeReport = async () => {
      try {
        const response = await executeReportMutation.mutateAsync({
          googleAnalyticsReportId: report.id,
        });
        if (response.success) {
          setReportResult(response.data);
          setError(null);
        } else {
          setReportResult(null);
          setError(response.error);
        }
      } catch (err) {
        console.error("Error executing GA4 report:", err);
        setReportResult(null);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    };

    void executeReport();
  }, [report]); // Reactively listen for entire report to change, not just ID

  const handleExportCsv = () => {
    exportGoogleAnalyticsToCsv(reportResult);
  };

  const handleEditReport = () => {
    openGoogleAnalyticsReport(report.id);
  };

  const handleRunReport = async () => {
    try {
      const response = await executeReportMutation.mutateAsync({
        googleAnalyticsReportId: report.id,
      });
      if (response.success) {
        setReportResult(response.data);
        setError(null);
      } else {
        setReportResult(null);
        setError(response.error);
      }
    } catch (err) {
      console.error("Error executing GA4 report:", err);
      setReportResult(null);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const handleSaveToDashboard = () => {
    console.log("Save to dashboard clicked");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="shadow-xs flex flex-row items-center justify-between rounded-md bg-blue-100 px-3.5 py-2.5">
        <div className="flex w-full flex-col">
          <div className="w-fit text-xl font-semibold text-gray-900">
            Google Analytics Report
          </div>
          <div className="text-md font-normal text-gray-600">
            Report details and visualization
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-y-2 rounded-md bg-gray-200 p-4">
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
              onClick={handleSaveToDashboard}
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
            <div className="p-4">INSERT VISUALISATION</div>
          )}
        </div>
      </div>
    </div>
  );
};
