import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type GoogleAnalyticsReportSelect } from "@/server/db/schema";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Filter,
  Layers,
} from "lucide-react";

const operatorMap = {
  EQUAL: "=",
  LESS_THAN: "<",
  LESS_THAN_OR_EQUAL: "≤",
  GREATER_THAN: ">",
  GREATER_THAN_OR_EQUAL: "≥",
  BEGINS_WITH: "starts:",
  ENDS_WITH: "ends:",
  CONTAINS: "~",
  FULL_SPECIFIED: "is:",
  IN_LIST: "in:",
  NUMERIC_LESS_THAN: "<",
  NUMERIC_LESS_THAN_OR_EQUAL: "≤",
  NUMERIC_GREATER_THAN: ">",
  NUMERIC_GREATER_THAN_OR_EQUAL: "≥",
} as const;

const formatDimensionFilter = (
  filter: NonNullable<GoogleAnalyticsReportParameters["dimensionFilter"]>,
) => {
  if (filter?.andGroup?.expressions?.[0]?.filter) {
    const firstFilter = filter.andGroup.expressions[0].filter;
    const { fieldName } = firstFilter;

    if (firstFilter.stringFilter) {
      const matchType = firstFilter.stringFilter.matchType;
      const value = firstFilter.stringFilter.value;
      const op =
        operatorMap[matchType as keyof typeof operatorMap] ?? matchType;
      return `${fieldName} ${op} ${value}`;
    }
  }

  if (filter?.filter?.fieldName) {
    const { fieldName } = filter.filter;
    if (filter.filter.stringFilter) {
      const matchType = filter.filter.stringFilter.matchType;
      const value = filter.filter.stringFilter.value;
      const op =
        operatorMap[matchType as keyof typeof operatorMap] ?? matchType;
      return `${fieldName} ${op} ${value}`;
    }
  }
  return null;
};

const formatMetricFilter = (
  filter: NonNullable<GoogleAnalyticsReportParameters["metricFilter"]>,
) => {
  if (filter?.andGroup?.expressions?.[0]?.filter) {
    const firstFilter = filter.andGroup.expressions[0].filter;
    const { fieldName } = firstFilter;

    if (firstFilter.numericFilter) {
      const operation = firstFilter.numericFilter.operation;
      const value =
        firstFilter.numericFilter.value?.doubleValue ??
        firstFilter.numericFilter.value?.intValue ??
        "unknown";
      const op =
        operatorMap[operation as keyof typeof operatorMap] ?? operation;
      return `${fieldName} ${op} ${value}`;
    }
  }

  if (filter?.filter?.fieldName) {
    const { fieldName } = filter.filter;
    if (filter.filter.numericFilter) {
      const operation = filter.filter.numericFilter.operation;
      const value =
        filter.filter.numericFilter.value?.doubleValue ??
        filter.filter.numericFilter.value?.intValue ??
        "unknown";
      const op =
        operatorMap[operation as keyof typeof operatorMap] ?? operation;
      return `${fieldName} ${op} ${value}`;
    }
  }
  return null;
};

export const ReportSummary = ({
  report,
  onClick,
  className,
}: {
  report: Pick<
    GoogleAnalyticsReportSelect,
    "title" | "description" | "reportParameters"
  >;
  onClick?: () => void;
  className?: string;
}) => {
  console.log("Report parameters:", {
    dimensionFilter: report.reportParameters.dimensionFilter,
    metricFilter: report.reportParameters.metricFilter,
  });

  return (
    <TooltipProvider>
      <div
        className={cn(
          "w-full cursor-pointer rounded-lg bg-white p-4 transition-colors hover:bg-gray-50",
          className,
        )}
        onClick={onClick}
      >
        <div className="flex flex-col gap-3">
          {/* Top row: Metrics, Dimensions, Dates */}
          <div className="flex flex-wrap gap-3">
            {/* Metrics Badge Group */}
            {report.reportParameters.metrics.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1">
                    <BarChart3 className="size-3 text-blue-500" />
                    {report.reportParameters.metrics.map((metric) => (
                      <Badge
                        key={metric.name}
                        variant="default"
                        className="rounded-full bg-blue-400/20 px-2 py-0.5 text-xs font-normal text-blue-700 hover:bg-blue-400/30"
                      >
                        {metric.name}
                      </Badge>
                    ))}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Edit metrics</TooltipContent>
              </Tooltip>
            )}

            {/* Dimensions Badge Group */}
            {report.reportParameters.dimensions.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1">
                    <Layers className="size-3 text-green-500" />
                    {report.reportParameters.dimensions.map((dimension) => (
                      <Badge
                        key={dimension.name}
                        variant="default"
                        className="rounded-full bg-green-400/20 px-2 py-0.5 text-xs font-normal text-green-700 hover:bg-green-400/30"
                      >
                        {dimension.name}
                      </Badge>
                    ))}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Edit dimensions</TooltipContent>
              </Tooltip>
            )}

            {/* Date Ranges Badge Group */}
            {report.reportParameters.dateRanges.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1">
                    <CalendarDays className="size-3 text-purple-500" />
                    {report.reportParameters.dateRanges.map((dateRange) => (
                      <Badge
                        key={`${dateRange.startDate}-${dateRange.endDate}`}
                        variant="default"
                        className="rounded-full bg-purple-400/20 px-2 py-0.5 text-xs font-normal text-purple-700 hover:bg-purple-400/30"
                      >
                        {dateRange.name ??
                          `${dateRange.startDate} - ${dateRange.endDate}`}
                      </Badge>
                    ))}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Edit date ranges</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Bottom row: Sorts and Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Sort Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1">
                  {report.reportParameters.orderBys?.desc ? (
                    <ArrowDown className="size-3 text-yellow-500" />
                  ) : (
                    <ArrowUp className="size-3 text-yellow-500" />
                  )}
                  {report.reportParameters.orderBys ? (
                    <Badge
                      key={
                        report.reportParameters.orderBys.metric?.metricName ??
                        report.reportParameters.orderBys.dimension
                          ?.dimensionName
                      }
                      variant="default"
                      className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-normal text-yellow-700 hover:bg-yellow-400/30"
                    >
                      {report.reportParameters.orderBys.metric?.metricName ??
                        report.reportParameters.orderBys.dimension
                          ?.dimensionName}
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-normal text-yellow-700 hover:bg-yellow-400/30"
                    >
                      No sorting applied
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>Edit sorting</TooltipContent>
            </Tooltip>

            {/* Filter Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1">
                  <Filter className="size-3 text-orange-500" />
                  {report.reportParameters.dimensionFilter ||
                  report.reportParameters.metricFilter ? (
                    <div className="flex gap-1">
                      {report.reportParameters.dimensionFilter && (
                        <Badge
                          key={JSON.stringify(
                            report.reportParameters.dimensionFilter,
                          )}
                          variant="default"
                          className="rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-normal text-orange-700 hover:bg-orange-400/30"
                        >
                          {formatDimensionFilter(
                            report.reportParameters.dimensionFilter,
                          )}
                        </Badge>
                      )}
                      {report.reportParameters.metricFilter && (
                        <Badge
                          key={JSON.stringify(
                            report.reportParameters.metricFilter,
                          )}
                          variant="default"
                          className="rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-normal text-orange-700 hover:bg-orange-400/30"
                        >
                          {formatMetricFilter(
                            report.reportParameters.metricFilter,
                          )}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Badge
                      variant="default"
                      className="rounded-full bg-orange-400/20 px-2 py-0.5 text-xs font-normal text-orange-700 hover:bg-orange-400/30"
                    >
                      No filters applied
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>Edit filters</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
