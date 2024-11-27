import { type ViewData } from "@/components/charting/chartTypes";
import { env } from "@/env";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

const visualizationSchema = z.object({
  visualisation: z.union([
    z.object({
      viewType: z.literal("lineChart").describe("Type of the visualisation, specifically a line chart"),
      name: z.string().describe("Name of the visualisation"),
      description: z.string().describe("Description of what the visualisation shows"),
      viewTypeMetadata: z.object({
        xAxis: z.string().describe("Metric to be displayed on the X axis"),
        yAxis: z.string().describe("Metric to be displayed on the Y axis"),
      }),
    }),
    z.object({
      viewType: z.literal("scatterChart").describe("Type of the visualisation, specifically a scatter chart"), 
      name: z.string().describe("Name of the visualisation"),
      description: z.string().describe("Description of what the visualisation shows"),
      viewTypeMetadata: z.object({
        xAxis: z.string().describe("Metric to be displayed on the X axis"),
        yAxis: z.string().describe("Metric to be displayed on the Y axis"),
      }),
    }),
    z.object({
      viewType: z.literal("pieChart").describe("Type of the visualisation, specifically a pie chart"),
      name: z.string().describe("Name of the visualisation"), 
      description: z.string().describe("Description of what the visualisation shows"),
      viewTypeMetadata: z.object({
        labels: z.string().describe("Metric for the labels in the pie chart"),
        values: z.string().describe("Metric for the values in the pie chart"),
      }),
    }),
    z.object({
      viewType: z.literal("barChart").describe("Type of the visualisation, specifically a bar chart"),
      name: z.string().describe("Name of the visualisation"),
      description: z.string().describe("Description of what the visualisation shows"), 
      viewTypeMetadata: z.object({
        xAxis: z.string().describe("Metric to be displayed on the X axis"),
        yAxis: z.string().describe("Metric to be displayed on the Y axis"),
      }),
    }),
    z.object({
      viewType: z.literal("boxPlot").describe("Type of the visualisation, specifically a box plot"),
      name: z.string().describe("Name of the visualisation"),
      description: z.string().describe("Description of what the visualisation shows"),
      viewTypeMetadata: z.object({
        x: z.string().describe("Metric to be displayed on the X axis"),
        y: z.string().describe("Metric to be displayed on the Y axis"), 
      }),
    }),
    z.object({
      viewType: z.literal("clusteredChart").describe("Type of the visualisation, specifically a clustered chart"),
      name: z.string().describe("Name of the visualisation"),
      description: z.string().describe("Description of what the visualisation shows"),
      viewTypeMetadata: z.object({
        xAxis: z.string().describe("Metric to be displayed on the X axis"),
        yAxis: z.string().describe("Metric to be displayed on the Y axis"),
        groupBy: z.string().describe("Metric to group the data by"),
      }),
    }),
  ]),
});

export async function getVisualizationResponse({
  formattedConversationHistory,
  prompt,
  agentResponse,
}: {
  formattedConversationHistory: ChatCompletionMessageParam[];
  prompt: string;
  agentResponse: {
    title: string;
    description: string;
    googleAnalyticsReportParameters: GoogleAnalyticsReportParameters;
  };
}): Promise<ViewData> {
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: "https://oai.hconeai.com/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${env.HELICONE_API_KEY}`,
      "Helicone-Property-Agent": "ga4-visualization",
    },
  });

  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [{
      role: "system",
      content: `
You are an expert in data visualization.
Your goal is to generate the most appropriate visualization for Google Analytics 4 data based on the user's request.

The user request is below:
<USER_REQUEST>
${prompt}
</USER_REQUEST>

The data source for the visualisation is a GA4 (Google Analytics 4) report.
Make sure the fields for the axis are dimensions and metrics from the report parameters.
The report details are below:
<GA4_REPORT_DETAILS>
<GA4_REPORT_TITLE>
${agentResponse.title}
</GA4_REPORT_TITLE>
<GA4_REPORT_DESCRIPTION>
${agentResponse.description}
</GA4_REPORT_DESCRIPTION>
<GA4_REPORT_PARAMETERS>
${JSON.stringify(agentResponse.googleAnalyticsReportParameters, null, 2)}
</GA4_REPORT_PARAMETERS>
</GA4_REPORT_DETAILS>

Please pick the most relevant visualization type and create it based on the metrics and dimensions available in the request.

Consider:
- Line charts for time-series data and trends
- Bar charts for comparing categories
- Pie charts for showing proportions
- Scatter plots for showing relationships between metrics
- Box plots for showing distributions
- Clustered charts when grouping by a dimension is important

The visualization should effectively communicate the insights from the GA4 data.
`
    },
    ...formattedConversationHistory,
    {
      role: "user",
      content: prompt
    }],
    response_format: zodResponseFormat(visualizationSchema, 'visualizationResponse'),
  });

  const message = response.choices[0]?.message;

  if (!message) {
    throw new Error("No response from model?");
  }

  if (!message.parsed) {
    throw new Error(message.refusal ?? "No response from model");
  }

  const visualizationSchemaParsed = message.parsed;

  return visualizationSchemaParsed.visualisation;
}
