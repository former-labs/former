import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { type GoogleAnalyticsReportParametersWithOptionals } from "@/server/googleAnalytics/reportParametersSchemaVariants";

export const verifyEvalResponse = ({
  outputQuery,
  targetQuery,
}: {
  outputQuery: GoogleAnalyticsReportParameters;
  targetQuery: GoogleAnalyticsReportParametersWithOptionals;
}) => {
  // Check if date ranges match (order doesn't matter)
  const dateRangesMatch =
    outputQuery.dateRanges.length === targetQuery.dateRanges.length &&
    outputQuery.dateRanges.every((outRange) =>
      targetQuery.dateRanges.some(
        (targetRange) =>
          targetRange.startDate === outRange.startDate &&
          targetRange.endDate === outRange.endDate,
      ),
    );

  // TODO: ALLOW DATE VALUES TO BE A LIST OF VALUES WHERE IT CAN BE ANY OF THE VALUES

  // Check if dimensions match (order doesn't matter, and handles optional dimensions)
  const dimensionsMatch =
    outputQuery.dimensions.every(
      (
        outDim, // All output dimensions must be valid targets
      ) =>
        targetQuery.dimensions.some(
          (targetDim) => targetDim.name === outDim.name,
        ),
    ) &&
    targetQuery.dimensions
      .filter((targetDim) => !targetDim.optional) // Get required dimensions only
      .every(
        (
          requiredDim, // All required dimensions must be present
        ) =>
          outputQuery.dimensions.some(
            (outDim) => outDim.name === requiredDim.name,
          ),
      );
  // TODO: ALLOW DIMENSION VALUES TO BE A LIST OF VALUES WHERE IT CAN BE ANY OF THE VALUES

  // Check if metrics match (order doesn't matter, and handles optional metrics)
  const metricsMatch =
    outputQuery.metrics.every(
      (
        outMetric, // All output metrics must be valid targets
      ) =>
        targetQuery.metrics.some(
          (targetMetric) => targetMetric.name === outMetric.name,
        ),
    ) &&
    targetQuery.metrics
      .filter((targetMetric) => !targetMetric.optional) // Get required metrics only
      .every(
        (
          requiredMetric, // All required metrics must be present
        ) =>
          outputQuery.metrics.some(
            (outMetric) => outMetric.name === requiredMetric.name,
          ),
      );

  // TODO: ALLOW METRIC VALUES TO BE A LIST OF VALUES WHERE IT CAN BE ANY OF THE VALUES

  // Check if metric filter matches
  const metricFilterMatch =
    JSON.stringify(outputQuery.metricFilter) ===
    JSON.stringify(targetQuery.metricFilter);
  // TODO: MAKE METRIC FILTERS MATCH MORE ROBUSTLY WITH TOLERANCE FOR 'OPTIONAL' FILTERS

  // Check if dimension filter matches
  const dimensionFilterMatch =
    JSON.stringify(outputQuery.dimensionFilter) ===
    JSON.stringify(targetQuery.dimensionFilter);
  // TODO: MAKE DIMENSION FILTERS MATCH MORE ROBUSTLY WITH TOLERANCE FOR 'OPTIONAL' FILTERS

  // Check if order bys match and ensure date dimension has an orderBy
  const hasDateDimension = [
    ...outputQuery.dimensions,
    ...targetQuery.dimensions,
  ].some((dim) => dim.name.toLowerCase().includes("date"));

  const orderBysMatch = hasDateDimension
    ? (outputQuery.orderBys?.dimension?.dimensionName
        .toLowerCase()
        .includes("date") ?? false)
    : true;

  // Check if limit matches (both null or same number)
  // const limitMatch = outputQuery.limit === targetQuery.limit;
  // TODO: ALLOW LIMITS TO BE OPTIONAL

  return {
    success:
      dateRangesMatch &&
      dimensionsMatch &&
      metricsMatch &&
      //  limitMatch &&
      metricFilterMatch &&
      dimensionFilterMatch &&
      orderBysMatch,
  };
};
