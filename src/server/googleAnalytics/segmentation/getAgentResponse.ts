import { env } from "@/env";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";


export const googleAnalyticsReportParametersSegmentationSchema = z.object({
  metrics: z.array(
    z.object({
      name: z.string().describe("The metric name as it appears in the definitions"),
    }),
  ),
  dateRanges: z.array(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
      name: z.string().optional().describe("Name the date range (e.g. Last 30 days)"),
    }),
  ).describe("Exactly two date range(s) to compare for the segmentation"),
});

type AiResponse = z.infer<typeof googleAnalyticsReportParametersSegmentationSchema>;

export async function getAgentResponseSegmentationMetric({
  formattedConversationHistory,
  prompt,
  currentDate = new Date(),
}: {
  formattedConversationHistory: ChatCompletionMessageParam[];
  prompt: string;
  currentDate?: Date;
}): Promise<AiResponse> {
  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: "https://oai.hconeai.com/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${env.HELICONE_API_KEY}`,
      "Helicone-Property-Agent": "ga4-metric-selection",
    },
  });

  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
The user is performing a segmentation analysis.

Your goal is to identify the single most relevant GA4 (Google Analytics) metric to perform the segmentation on, and provide appropriate date ranges for comparison.

For example, if the user wants to understand the breakdown the active sessions across different segments/dimensions, you
would output "activeUsers" with appropriate date ranges.

Review the conversation history and identify which GA4 metric would be most relevant and meaningful to analyze.

Regarding date ranges, for example, if the user wants to know why sessions have dropped over the last 30 days, you might compare "30daysAgo" to "today"
in one date range, and "30daysAgo" to "60daysAgo" in another date range.

Or if the user wants to know why the current month of november has less sessions than the same month last year, you might use a date range for the
current month of november and a date range for the november of last year.

Make sure the date ranges are of the same length to provide a meaningful comparison.


For date ranges:
- For start dates, try to use relative dates (e.g. "30daysAgo") if requesting data relative to the current date
- For end dates, use "today" instead of "yesterday" in most cases
- "30daysAgo" is 30 days ago from "today" (works for N days ago)
- "today" is the current date, ${currentDate.toLocaleString("en-US", { weekday: "long" })}, ${currentDate.toISOString().split("T")[0]}
- When specifying the start or end of a month, use "YYYY-MM-DD" notation
- If comparing year-over-year, provide two date ranges - one for the current period and one for the same period last year
- 'Last X days' is from (X - 1) days ago to today

Available metrics:
${googleAnalyticsDefinitions.metrics
  .filter((m) => m.visible)
  .map((m) => `- ${m.name}: ${m.description}`)
  .join("\n")}
`,
      },
      ...formattedConversationHistory,
      {
        role: "user", 
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(googleAnalyticsReportParametersSegmentationSchema, "response"),
  });

  const message = response.choices[0]?.message;

  if (!message?.parsed) {
    const errorMessage = message?.refusal ?? "No response from model";
    throw new Error(errorMessage);
  }

  return message.parsed;
}
