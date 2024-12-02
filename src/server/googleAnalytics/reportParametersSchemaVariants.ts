import { z } from "zod";
import {
  googleAnalyticsReportParametersSchema,
  OrderByExpression,
} from "./reportParametersSchema";

const FilterFlattened = z.object({
  fieldName: z.string(),
  stringFilter: z
    .object({
      matchType: z.enum([
        "EXACT",
        "BEGINS_WITH",
        "ENDS_WITH",
        "CONTAINS",
        "FULL_REGEXP",
        "PARTIAL_REGEXP",
      ]),
      value: z.string(),
      caseSensitive: z.boolean(),
    })
    .nullable(),
  inListFilter: z
    .object({
      values: z.array(z.string()),
      caseSensitive: z.boolean(),
    })
    .nullable(),
  numericFilter: z
    .object({
      operation: z.enum([
        "EQUAL",
        "LESS_THAN",
        "LESS_THAN_OR_EQUAL",
        "GREATER_THAN",
        "GREATER_THAN_OR_EQUAL",
      ]),
      value: z.object({
        intValue: z.number().nullable(),
        doubleValue: z.number().nullable(),
      }),
    })
    .nullable(),
  betweenFilter: z
    .object({
      fromValue: z.object({
        intValue: z.number().nullable(),
        doubleValue: z.number().nullable(),
      }),
      toValue: z.object({
        intValue: z.number().nullable(),
        doubleValue: z.number().nullable(),
      }),
    })
    .nullable(),
});

const FilterExpressionFlattened = z.object({
  filter: FilterFlattened.nullable(),
  andGroup: z.array(FilterFlattened).nullable(),
  orGroup: z.array(FilterFlattened).nullable(),
  notExpression: FilterFlattened.nullable(),
});

export const googleAnalyticsReportParametersSchemaFlattened = z.object({
  metrics: z.array(
    z.object({
      name: z.string(),
      expression: z.string().nullable(),
    }),
  ),
  dimensions: z.array(
    z.object({
      name: z.string(),
      // dimensionExpression: z.any().nullable(),
    }),
  ),
  dateRanges: z
    .array(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        name: z.string().nullable(),
      }),
    )
    .nullable(),

  // metricFilterSimple: FilterFlattened.nullable().describe("For single, simple metric filter. Includes string, numeric, list, and between filters."),
  metricFilterAndGroup: z
    .array(FilterFlattened)
    .nullable()
    .describe("For metric filters combined with AND"),
  metricFilterOrGroup: z
    .array(FilterFlattened)
    .nullable()
    .describe("For multiple metric filters combined with OR"),
  metricFilterNotExpression: FilterFlattened.nullable().describe(
    "For a metric filter that needs to be negated",
  ),
  // dimensionFilterSimple: FilterFlattened.nullable().describe("For single, simple dimension filter. Includes string, numeric, list, and between filters."),
  dimensionFilterAndGroup: z
    .array(FilterFlattened)
    .nullable()
    .describe("For dimension filters that need to be combined with AND"),
  dimensionFilterOrGroup: z
    .array(FilterFlattened)
    .nullable()
    .describe(
      "For multiple dimension filters that need to be combined with OR",
    ),
  dimensionFilterNotExpression: FilterFlattened.nullable().describe(
    "For a dimension filter that needs to be negated",
  ),
  orderBys: OrderByExpression.nullable().describe(
    "Optional sort order. This enter object should be null if we are not ordering by any dimensions or metrics."
  ),
  limit: z
    .number()
    .nullable()
    .describe("Optional limit on the number of rows to return"),
});

export const googleAnalyticsReportParametersWithOptionalsSchema =
  googleAnalyticsReportParametersSchema.extend({
    metrics: z.array(
      z.object({
        name: z.string(),
        expression: z.string().optional(),
        optional: z.boolean().optional(),
      }),
    ),
    dimensions: z.array(
      z.object({
        name: z.string(),
        optional: z.boolean().optional(),
      }),
    ),
  });

export type GoogleAnalyticsReportParametersFlattened = z.infer<
  typeof googleAnalyticsReportParametersSchemaFlattened
>;
export type GoogleAnalyticsReportParametersWithOptionals = z.infer<
  typeof googleAnalyticsReportParametersWithOptionalsSchema
>;
