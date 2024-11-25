import { env } from "@/env";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import {
  type GoogleAnalyticsReportParameters,
  googleAnalyticsReportParametersSchema,
} from "./reportParametersSchema";
import {
  type GoogleAnalyticsReportParametersFlattened,
  googleAnalyticsReportParametersSchemaFlattened,
} from "./reportParametersSchemaVariants";

const aiResponseSchema = z.object({
  title: z.string().describe("Title of the report"),
  description: z.string().describe("Description of the report"),
  googleAnalyticsReportParameters: googleAnalyticsReportParametersSchema,
  suggestedUserResponses: z.array(z.string()).describe(`
    Exactly 3 follow up questions or responses the user might ask.
    Make sure these are valid standalone questions that reveal more insight about the data.
  `),
  includeVisualization: z
    .boolean()
    .describe("Whether to include a visualization in the response"),
});

const aiResponseSchemaFlattened = z.object({
  ...aiResponseSchema.shape,
  googleAnalyticsReportParameters:
    googleAnalyticsReportParametersSchemaFlattened,
});

type AiResponse = z.infer<typeof aiResponseSchema>;

export async function getAgentResponse({
  formattedConversationHistory,
  prompt,
}: {
  formattedConversationHistory: ChatCompletionMessageParam[];
  prompt: string;
}): Promise<AiResponse> {
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: "https://oai.hconeai.com/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${env.HELICONE_API_KEY}`,
      "Helicone-Property-Agent": "ga4-params",
    },
  });

  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are an expert in Google Analytics 4 reporting. Your only goal is to generate the appropriate GA4 report parameters given the following user request:

<USER_REQUEST>
${prompt}
</USER_REQUEST>

-----------------------------------------------------------------------

FOLLOW THESE STEPS:
1. Carefully read the user request and think step by step about what they are asking for.
2. Read through the ###Metrics Definitions and ###Dimensions Definitions to understand the different metrics and dimensions available.
3. Read through the ##GUIDANCE section for special cases and rules to follow.
4. Identify the dateRange(s) we should use based on the user request. Pay special attention to the ###Date Guidance section.
5. Generate the appropriate GA4 report parameters. The parameters should include dateRanges, dimensions, metrics, orderBys, limit, and the optional use of different filter types (AND/OR/NOT expressions).
6. If the particular user request is the kind that should include a visualization, set includeVisualization to true. This will often be the case.

-----------------------------------------------------------------------

##GUIDANCE
###Metrics Guidance
 - "activeUsers" is typically preferred over "totalUsers"
 - Only use an expression if you want to calculate a metric based on others (e.g. "activeUsers/totalUsers").
 - The "expression" MUST NEVER BE THE SAME AS THE METRIC NAME. Set expression to null instead of setting it to the metric name.
 - Use "sessionDefaultChannelGroup" instead of "defaultChannelGroup" when calculating metrics based on channel groups.
 - When someone is asking for 'engagedSessions', it's often helpful to also show them 'sessions' as well.
 - If asked for a percentage or ratio based on different dimension values, do not use an expression. Instead, add the dimension so it can be calculated by the user.

###Dimension Guidance
 - Err on the side of including dimensions to provide more context unless specified otherwise.
 - If you need to segment returning or new users, use "newVsReturning"
 - Comparing day-on-day or daily trends, use the "date" dimension
 - Comparing week-on-week or weekly trends, use the "yearWeek" dimension
 - Comparing month-on-month or monthly trends, use the "yearMonth" dimension
 - Comparing year-on-year or yearly trends, use the "year" dimension

 ###Date Guidance
 - For start dates it's generally best to use absolute dates "YYYY-MM-DD" instead of relative dates unless the date range the user is asking for isn't specified, in that case use relative dates that make sense.
 - For end dates, use "today" instead of "yesterday" in most cases, use "YYYY-MM-DD" for most other cases, unless otherwise specified.
 - "30daysAgo" is 30 days ago from today (works for N days ago)
 - "today" is the current date, ${new Date().toLocaleString("en-US", { weekday: "long" })}, ${new Date().toISOString().split("T")[0]}
 - If date range is 7daysAgo, use "date" dimension instead of "week" dimension unless specified otherwise.
 - Used "dayOfWeekName" dimension instead of "dayOfWeek" dimension when possible.
 - When specifying the start or end of a month, use "YYYY-MM-DD" notation.
 - If a date dimension is used, you should use orderBys to sort by date in descending order unless specified otherwise.
 - When metrics based on traffic hours, use the "hour" dimension and sort by hour in descending order with 'NUMERIC' orderType unless specified otherwise.
 
 ####Date Comparisons
 - If comparing by day, week, month, or year, don't use multiple date ranges, instead use date, week, yearMonth, or year dimensions to separate the data, unless specified otherwise.
 - 'Last X days' is from (X - 1) days ago to today.

###Filters Guidance
 - For caseSensitive filters, set caseSensitive to false unless specified otherwise.

###Dimension Filters Guidance
 - Do not provide a dimensionFilter unless you certaintly need it as the other values shown will provide more context. That is, usually don't apply dimension filters for the following dimensions:
  - browser (e.g. "How many mobile users visited our site?")
  - continent (e.g. "How many users in the Americas visited our site?")
  - defaultChannelGroup
  - deviceCategory (e.g. "How many mobile users visited our site?")
  - deviceModel (e.g. "How many users on iPhones visited our site?")
  - firstUserSource
  - firstUserSourceMedium
  - manualSource
  - manualSourceMedium
  - medium
  - mobileDeviceBranding
  - mobileDeviceModel
  - newVsReturning
  - operatingSystem
  - platform
  - platformDeviceCategory
  - primaryChannelGroup
  - sessionMedium
  - sessionPrimaryChannelGroup
  - sessionSource
  - sessionSourceMedium
  - shippingTier
  - source
  - sourceMedium
  - sourcePlatform
  - streamName
  - userAgeBracket
  - userGender
  - visible

###Order By Guidance
 - When ordering by dimension, use orderBys.dimension.dimensionName, e.g. "orderBys.dimension.dimensionName = 'date'"
 - If a time-based metric is used as a dimension (e.g. "date", "weekMonth", "yearMonth", "year", etc.), always sort by in descending order with 'ALPHANUMERIC' orderType unless specified otherwise.
 - When ordering by metric, use orderBys.metric.metricName, e.g. "orderBys.metric.metricName = 'activeUsers'"
 - If comparing day-on-day or daily trends, use the "date" dimension and sort by date in descending order with 'ALPHANUMERIC' orderType unless specified otherwise.
 - If comparing week-on-week or weekly trends, use the "weekMonth" dimension and sort by weekMonth in descending order with 'ALPHANUMERIC' orderType unless specified otherwise.
 - If comparing month-on-month or monthly trends, use the "yearMonth" dimension and sort by yearMonth in descending order with 'ALPHANUMERIC' orderType unless specified otherwise.
 - If comparing year-on-year or yearly trends, use the "year" dimension and sort by year in descending order unless specified otherwise.

-----------------------------------------------------------------------

##For reference, below are definitions for all the available metrics and dimensions:

###Metrics Definitions
${googleAnalyticsDefinitions.metrics
  .filter((m) => m.visible)
  .map((m) => `- ${m.name}: ${m.description}`)
  .join("\n")}

###Dimensions Definitions
${googleAnalyticsDefinitions.dimensions
  .filter((d) => d.visible)
  .map((d) => `- ${d.name}: ${d.description}`)
  .join("\n")}
`,
      },
      ...formattedConversationHistory,
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(aiResponseSchemaFlattened, "response"),
  });

  const messageFlattened = response.choices[0]?.message;

  if (!messageFlattened?.parsed) {
    const errorMessage = messageFlattened?.refusal || "No response from model";
    throw new Error(errorMessage);
  }

  const googleAnalyticsReportParameters = unflattenGoogleAnalyticsParameters({
    flattenedParams: messageFlattened.parsed.googleAnalyticsReportParameters,
  });

  return {
    ...messageFlattened.parsed,
    googleAnalyticsReportParameters,
  };
}

const unflattenGoogleAnalyticsParameters = ({
  flattenedParams,
}: {
  flattenedParams: GoogleAnalyticsReportParametersFlattened;
}): GoogleAnalyticsReportParameters => {
  const {
    metrics,
    dimensions,
    dateRanges,
    orderBys,
    limit,
    // metricFilterSimple: metricFilterSimpleFlattened,
    metricFilterAndGroup: metricFilterAndGroupFlattened,
    metricFilterOrGroup: metricFilterOrGroupFlattened,
    metricFilterNotExpression: metricFilterNotExpressionFlattened,
    // dimensionFilterSimple: dimensionFilterSimpleFlattened,
    dimensionFilterAndGroup: dimensionFilterAndGroupFlattened,
    dimensionFilterOrGroup: dimensionFilterOrGroupFlattened,
    dimensionFilterNotExpression: dimensionFilterNotExpressionFlattened,
  } = flattenedParams;

  const googleAnalyticsReportParametersFlattened = {
    metrics,
    dimensions,
    dateRanges,
    orderBys,
    limit,
    ...((metricFilterAndGroupFlattened ?? metricFilterOrGroupFlattened) && {
      metricFilter: {
        ...(metricFilterAndGroupFlattened && {
          andGroup: metricFilterAndGroupFlattened,
        }),
        ...(metricFilterOrGroupFlattened && {
          orGroup: metricFilterOrGroupFlattened,
        }),
        ...(metricFilterNotExpressionFlattened && {
          notExpression: metricFilterNotExpressionFlattened,
        }),
        // ...(metricFilterSimpleFlattened && { filter: metricFilterSimpleFlattened })
      },
    }),
    ...((dimensionFilterAndGroupFlattened ??
      dimensionFilterOrGroupFlattened) && {
      dimensionFilter: {
        ...(dimensionFilterAndGroupFlattened && {
          andGroup: dimensionFilterAndGroupFlattened,
        }),
        ...(dimensionFilterOrGroupFlattened && {
          orGroup: dimensionFilterOrGroupFlattened,
        }),
        ...(dimensionFilterNotExpressionFlattened && {
          notExpression: dimensionFilterNotExpressionFlattened,
        }),
        // ...(dimensionFilterSimpleFlattened && { filter: dimensionFilterSimpleFlattened })
      },
    }),
  };

  const metricFilter = googleAnalyticsReportParametersFlattened.metricFilter;
  const dimensionFilter =
    googleAnalyticsReportParametersFlattened.dimensionFilter;

  const googleAnalyticsReportParameters = {
    metrics: googleAnalyticsReportParametersFlattened.metrics.map((m) => ({
      name: m.name,
      ...(m.expression && { expression: m.expression }),
    })),
    dimensions: googleAnalyticsReportParametersFlattened.dimensions,
    dateRanges:
      googleAnalyticsReportParametersFlattened.dateRanges?.map((d) => ({
        startDate: d.startDate,
        endDate: d.endDate,
        ...(d.name && { name: d.name }),
      })) ?? [],
    ...(metricFilter && {
      metricFilter: {
        ...(metricFilter.andGroup && {
          andGroup: {
            expressions: metricFilter.andGroup.map((e) => ({
              filter: {
                fieldName: e.fieldName,
                ...(e.stringFilter && { stringFilter: e.stringFilter }),
                ...(e.inListFilter && { inListFilter: e.inListFilter }),
                ...(e.numericFilter && { numericFilter: e.numericFilter }),
                ...(e.betweenFilter && { betweenFilter: e.betweenFilter }),
              },
            })),
          },
        }),
        ...(metricFilter.orGroup && {
          orGroup: {
            expressions: metricFilter.orGroup.map((e) => ({
              filter: {
                fieldName: e.fieldName,
                ...(e.stringFilter && { stringFilter: e.stringFilter }),
                ...(e.inListFilter && { inListFilter: e.inListFilter }),
                ...(e.numericFilter && { numericFilter: e.numericFilter }),
                ...(e.betweenFilter && { betweenFilter: e.betweenFilter }),
              },
            })),
          },
        }),
        ...(metricFilter.notExpression && {
          notExpression: {
            filter: {
              fieldName: metricFilter.notExpression.fieldName,
              ...(metricFilter.notExpression.stringFilter && {
                stringFilter: metricFilter.notExpression.stringFilter,
              }),
              ...(metricFilter.notExpression.inListFilter && {
                inListFilter: metricFilter.notExpression.inListFilter,
              }),
              ...(metricFilter.notExpression.numericFilter && {
                numericFilter: metricFilter.notExpression.numericFilter,
              }),
              ...(metricFilter.notExpression.betweenFilter && {
                betweenFilter: metricFilter.notExpression.betweenFilter,
              }),
            },
          },
        }),
        // ...(metricFilter.filter && {
        //   filter: {
        //     fieldName: metricFilter.filter.fieldName,
        //     ...(metricFilter.filter.stringFilter && { stringFilter: metricFilter.filter.stringFilter }),
        //     ...(metricFilter.filter.inListFilter && { inListFilter: metricFilter.filter.inListFilter }),
        //     ...(metricFilter.filter.numericFilter && { numericFilter: metricFilter.filter.numericFilter }),
        //     ...(metricFilter.filter.betweenFilter && { betweenFilter: metricFilter.filter.betweenFilter })
        //   }
        // })
      },
    }),
    ...(dimensionFilter && {
      dimensionFilter: {
        ...(dimensionFilter.andGroup && {
          andGroup: {
            expressions: dimensionFilter.andGroup.map((e) => ({
              filter: {
                fieldName: e.fieldName,
                ...(e.stringFilter && { stringFilter: e.stringFilter }),
                ...(e.inListFilter && { inListFilter: e.inListFilter }),
                ...(e.numericFilter && { numericFilter: e.numericFilter }),
                ...(e.betweenFilter && { betweenFilter: e.betweenFilter }),
              },
            })),
          },
        }),
        ...(dimensionFilter.orGroup && {
          orGroup: {
            expressions: dimensionFilter.orGroup.map((e) => ({
              filter: {
                fieldName: e.fieldName,
                ...(e.stringFilter && { stringFilter: e.stringFilter }),
                ...(e.inListFilter && { inListFilter: e.inListFilter }),
                ...(e.numericFilter && { numericFilter: e.numericFilter }),
                ...(e.betweenFilter && { betweenFilter: e.betweenFilter }),
              },
            })),
          },
        }),
        ...(dimensionFilter.notExpression && {
          notExpression: {
            filter: {
              fieldName: dimensionFilter.notExpression.fieldName,
              ...(dimensionFilter.notExpression.stringFilter && {
                stringFilter: dimensionFilter.notExpression.stringFilter,
              }),
              ...(dimensionFilter.notExpression.inListFilter && {
                inListFilter: dimensionFilter.notExpression.inListFilter,
              }),
              ...(dimensionFilter.notExpression.numericFilter && {
                numericFilter: dimensionFilter.notExpression.numericFilter,
              }),
              ...(dimensionFilter.notExpression.betweenFilter && {
                betweenFilter: dimensionFilter.notExpression.betweenFilter,
              }),
            },
          },
        }),
        // ...(dimensionFilter.filter && {
        //   filter: {
        //     fieldName: dimensionFilter.filter.fieldName,
        //     ...(dimensionFilter.filter.stringFilter && { stringFilter: dimensionFilter.filter.stringFilter }),
        //     ...(dimensionFilter.filter.inListFilter && { inListFilter: dimensionFilter.filter.inListFilter }),
        //     ...(dimensionFilter.filter.numericFilter && { numericFilter: dimensionFilter.filter.numericFilter }),
        //     ...(dimensionFilter.filter.betweenFilter && { betweenFilter: dimensionFilter.filter.betweenFilter })
        //   }
        // })
      },
    }),
    ...(googleAnalyticsReportParametersFlattened.orderBys && {
      orderBys: googleAnalyticsReportParametersFlattened.orderBys,
    }),
    ...(googleAnalyticsReportParametersFlattened.limit && {
      limit: googleAnalyticsReportParametersFlattened.limit,
    }),
  };

  return googleAnalyticsReportParameters;
};
