import { z } from "zod";

export const OrderByExpression = z
  .object({
    metric: z
      .object({
        metricName: z.string(),
      })
      .nullable()
      .describe("For ordering metrics such as activeUsers, bounceRate, etc. If you include this then the dimension should be null."),
    dimension: z
      .object({
        dimensionName: z.string(),
        orderType: z.enum([
          "ALPHANUMERIC",
          "CASE_INSENSITIVE_ALPHANUMERIC",
          "NUMERIC",
        ]),
      })
      .nullable()
      .describe(
        "For ordering dimensions such as date, yearMonth, country, etc. If you include this then the metric should be null.",
      ),
    desc: z.boolean().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasOneKey =
      ["metric", "dimension"].filter(
        (key) => data[key as keyof typeof data] !== null,
      ).length === 1;
    if (!hasOneKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `OrderBy must specify exactly one of 'metric', 'dimension'. Got: ${JSON.stringify(
          data,
        )}`,
      });
    }
  });

const Filter = z.object({
  fieldName: z.string(),
  inListFilter: z
    .object({
      values: z.array(z.string()),
      caseSensitive: z.boolean(),
    })
    .optional()
    .describe("Filter by a list of string values"),
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
    .optional()
    .describe("Filter by a single string value"),
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
    .optional(),
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
    .optional(),
});

export type GoogleAnalyticsReportFilter = z.infer<typeof Filter>;

// Define the nested (second) level that can only contain filters
const FilterExpression = z.object({
  andGroup: z
    .object({
      expressions: z.array(
        z.object({
          filter: Filter,
        }),
      ),
    })
    .optional(),
  orGroup: z
    .object({
      expressions: z.array(
        z.object({
          filter: Filter,
        }),
      ),
    })
    .optional(),
  notExpression: z
    .object({
      filter: Filter,
    })
    .optional(),
  filter: Filter.optional(),
});

export const googleAnalyticsReportParametersSchema = z.object({
  metrics: z.array(
    z.object({
      name: z.string(),
      expression: z.string().optional(),
    }),
  ),
  dimensions: z.array(
    z.object({
      name: z.string(),
    }),
  ),
  dateRanges: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
      name: z.string().optional(),
    }),
  ),

  metricFilter: FilterExpression.optional().describe("Optional metric filter"),
  dimensionFilter: FilterExpression.optional().describe(
    "Optional dimension filter",
  ),
  orderBys: OrderByExpression.optional().describe("Optional sort order"),
  limit: z
    .number()
    .optional()
    .describe("Optional limit on the number of rows to return"),
});

export type GoogleAnalyticsReportParameters = z.infer<
  typeof googleAnalyticsReportParametersSchema
>;
