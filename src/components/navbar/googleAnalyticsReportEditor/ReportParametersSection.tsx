import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type GoogleAnalyticsReportSelect } from "@/server/db/schema";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { ReportDateRangesSection } from "./ReportDateRangeSection";
import { ReportDimensionsSection } from "./ReportDimensionsSection";
import { ReportFiltersSection } from "./ReportFiltersSection";
import { ReportMetricsSection } from "./ReportMetricsSection";
import { ReportOrderBySection } from "./ReportOrderBySection";

export const ReportParametersSection = ({
  report,
}: {
  report: GoogleAnalyticsReportSelect;
}) => {
  const updateReportMutation =
    api.googleAnalytics.updateGoogleAnalyticsReportParameters.useMutation();
  const utils = api.useUtils();

  const [localReport, setLocalReport] =
    useState<GoogleAnalyticsReportSelect>(report);

  useEffect(() => {
    setLocalReport(report);
  }, [report]);

  const handleSave = async () => {
    await updateReportMutation.mutateAsync({
      googleAnalyticsReportId: report.id,
      reportParameters: localReport.reportParameters,
    });

    void utils.googleAnalytics.getGoogleAnalyticsReport.invalidate();
  };

  const handleMetricsChange = (metrics: { name: string }[]) => {
    const metricNames = new Set(metrics.map((m) => m.name));
    let orderBys = localReport.reportParameters.orderBys;
    let metricFilter = localReport.reportParameters.metricFilter;

    // Remove orderBy if it references a metric that no longer exists
    if (orderBys?.metric && !metricNames.has(orderBys.metric.metricName)) {
      orderBys = undefined;
    }

    // Remove metric filters that reference removed metrics
    if (metricFilter) {
      if (
        metricFilter.filter &&
        !metricNames.has(metricFilter.filter.fieldName)
      ) {
        metricFilter = undefined;
      } else if (metricFilter.andGroup) {
        const validExpressions = metricFilter.andGroup.expressions.filter(
          (expr) => metricNames.has(expr.filter.fieldName),
        );
        if (validExpressions.length === 0) {
          metricFilter = undefined;
        } else if (
          validExpressions.length !== metricFilter.andGroup.expressions.length
        ) {
          metricFilter = {
            andGroup: { expressions: validExpressions },
          };
        }
      }
    }

    setLocalReport({
      ...localReport,
      reportParameters: {
        ...localReport.reportParameters,
        metrics,
        orderBys,
        metricFilter,
      },
    });
  };

  const handleDimensionsChange = (dimensions: { name: string }[]) => {
    const dimensionNames = new Set(dimensions.map((d) => d.name));
    let orderBys = localReport.reportParameters.orderBys;
    let dimensionFilter = localReport.reportParameters.dimensionFilter;

    // Remove orderBy if it references a dimension that no longer exists
    if (
      orderBys?.dimension &&
      !dimensionNames.has(orderBys.dimension.dimensionName)
    ) {
      orderBys = undefined;
    }

    // Remove dimension filters that reference removed dimensions
    if (dimensionFilter) {
      if (
        dimensionFilter.filter &&
        !dimensionNames.has(dimensionFilter.filter.fieldName)
      ) {
        dimensionFilter = undefined;
      } else if (dimensionFilter.andGroup) {
        const validExpressions = dimensionFilter.andGroup.expressions.filter(
          (expr) => dimensionNames.has(expr.filter.fieldName),
        );
        if (validExpressions.length === 0) {
          dimensionFilter = undefined;
        } else if (
          validExpressions.length !==
          dimensionFilter.andGroup.expressions.length
        ) {
          dimensionFilter = {
            andGroup: { expressions: validExpressions },
          };
        }
      }
    }

    setLocalReport({
      ...localReport,
      reportParameters: {
        ...localReport.reportParameters,
        dimensions,
        orderBys,
        dimensionFilter,
      },
    });
  };

  const handleDateRangesChange = (
    dateRanges: {
      startDate: string;
      endDate: string;
      name?: string;
    }[],
  ) => {
    setLocalReport({
      ...localReport,
      reportParameters: {
        ...localReport.reportParameters,
        dateRanges,
      },
    });
  };

  const handleLimitChange = (value: string) => {
    const limit = value === "" ? undefined : parseInt(value);
    setLocalReport({
      ...localReport,
      reportParameters: {
        ...localReport.reportParameters,
        limit,
      },
    });
  };

  const handleOrderByChange = ({
    orderBys,
  }: {
    orderBys: GoogleAnalyticsReportParameters["orderBys"] | null;
  }) => {
    setLocalReport({
      ...localReport,
      reportParameters: {
        ...localReport.reportParameters,
        orderBys: orderBys ?? undefined,
      },
    });
  };

  const handleFilterChange = ({
    metricFilter,
    dimensionFilter,
  }: {
    metricFilter?: GoogleAnalyticsReportParameters["metricFilter"];
    dimensionFilter?: GoogleAnalyticsReportParameters["dimensionFilter"];
  }) => {
    setLocalReport({
      ...localReport,
      reportParameters: {
        ...localReport.reportParameters,
        metricFilter,
        dimensionFilter,
      },
    });
  };

  return (
    <div className="space-y-4 rounded-md bg-white p-4">
      <ReportMetricsSection
        metrics={localReport.reportParameters.metrics}
        onMetricsChange={handleMetricsChange}
      />

      <ReportDimensionsSection
        dimensions={localReport.reportParameters.dimensions}
        onDimensionsChange={handleDimensionsChange}
      />

      <ReportDateRangesSection
        dateRanges={localReport.reportParameters.dateRanges}
        onDateRangesChange={handleDateRangesChange}
      />

      <ReportFiltersSection
        metrics={localReport.reportParameters.metrics}
        dimensions={localReport.reportParameters.dimensions}
        metricFilter={localReport.reportParameters.metricFilter}
        dimensionFilter={localReport.reportParameters.dimensionFilter}
        onFilterChange={handleFilterChange}
      />

      <ReportOrderBySection
        metrics={localReport.reportParameters.metrics}
        dimensions={localReport.reportParameters.dimensions}
        orderBys={localReport.reportParameters.orderBys}
        onOrderByChange={handleOrderByChange}
      />

      <div>
        <h3 className="mb-2 font-bold text-gray-900">Limit</h3>
        <div className="">
          <Input
            type="number"
            placeholder="Enter row limit"
            value={localReport.reportParameters.limit ?? ""}
            onChange={(e) => handleLimitChange(e.target.value)}
            className="max-w-[200px]"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        className="mb-4"
        disabled={
          updateReportMutation.isPending ||
          localReport.reportParameters.metrics.length === 0 ||
          localReport.reportParameters.dateRanges.length === 0
        }
      >
        {updateReportMutation.isPending ? "Saving..." : "Save Report"}
      </Button>
    </div>
  );
};
