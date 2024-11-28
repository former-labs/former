import { ReportEditor } from "@/components/navbar/googleAnalyticsReportEditor/ReportEditor";
import { Loading } from "@/components/utils/Loading";
import type { GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { api } from "@/trpc/react";

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

  const updateReportMutation =
    api.googleAnalytics.updateGoogleAnalyticsReportParameters.useMutation();
  const utils = api.useUtils();

  const handleReportSave = async ({
    reportParameters,
  }: {
    title: string;
    description: string;
    reportParameters: GoogleAnalyticsReportParameters;
  }) => {
    await updateReportMutation.mutateAsync({
      googleAnalyticsReportId,
      reportParameters,
    });

    void utils.googleAnalytics.getGoogleAnalyticsReport.invalidate();
  };

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
    <ReportEditor
      report={{
        title: report.title,
        description: report.description,
        reportParameters: report.reportParameters,
      }}
      onReportSave={handleReportSave}
      isSaving={updateReportMutation.isPending}
      onClose={onClose}
    />
  );
};
