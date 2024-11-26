import { ReportParametersSection } from "@/components/navbar/googleAnalyticsReportEditor/ReportParametersSection";
import { Loading } from "@/components/utils/Loading";
import { getDebugMode } from "@/lib/debugMode";
import { api } from "@/trpc/react";
import { X } from "lucide-react";

export const SidebarGoogleAnalyticsReportEditor = ({
  googleAnalyticsReportId,
  onClose,
}: {
  googleAnalyticsReportId: string;
  onClose: () => void;
}) => {
  const { data: report, isLoading } =
    api.googleAnalytics.getGoogleAnalyticsReport.useQuery({
      googleAnalyticsReportId,
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!googleAnalyticsReportId) {
    return <div>No Google Analytics report ID provided.</div>;
  }

  if (!report) {
    return (
      <div className="text-error-500">
        Failed to load Google Analytics report
      </div>
    );
  }

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {report.title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{report.description}</p>
        {getDebugMode() && (
          <details>
            <summary className="cursor-pointer text-sm text-gray-500">
              View Report JSON
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-white p-4">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        )}
      </div>
      <ReportParametersSection report={report} />
    </div>
  );
};
