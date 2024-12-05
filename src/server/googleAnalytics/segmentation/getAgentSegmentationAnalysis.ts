import { env } from "@/env";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { type GoogleAnalyticsReportParameters } from "../reportParametersSchema";

export const segmentationAnalysisSchema = z.object({
  analysisMessage: z.string().describe("Analysis of the segmentation data"),
});

type AiResponse = z.infer<typeof segmentationAnalysisSchema>;

export async function getAgentResponseSegmentationAnalysis({
  formattedConversationHistory,
  prompt,
  segmentedReports,
  currentDate = new Date(),
}: {
  formattedConversationHistory: ChatCompletionMessageParam[];
  prompt: string;
  segmentedReports: {
    reportParameters: GoogleAnalyticsReportParameters;
    reportResult: any;
  }[];
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

  console.log('segmentedReports:', segmentedReports);

  const formattedReports = segmentedReports.map(report => `
<REPORT>
<REPORT_PARAMETERS>
${JSON.stringify(report.reportParameters, null, 2)}
</REPORT_PARAMETERS>
<REPORT_RESULT>
<REPORT_RESULT_COLUMNS>
${JSON.stringify(report.reportResult.data.col, null, 2)}
</REPORT_RESULT_COLUMNS>
<REPORT_RESULT_ROWS>
${JSON.stringify(report.reportResult.data.rows, null, 2)}
</REPORT_RESULT_ROWS>
</REPORT_RESULT>
</REPORT>
`).join('\n');

  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `
You are analyzing Google Analytics segmentation data.

You goal is to try to determine the answer to the users question based on the segmentation data provided.
Keep it short and don't use markdown, just normal text.

The segmented reports data is:
${formattedReports}
`,
      },
      ...formattedConversationHistory,
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(segmentationAnalysisSchema, "response"),
  });

  const message = response.choices[0]?.message;

  if (!message?.parsed) {
    const errorMessage = message?.refusal ?? "No response from model";
    throw new Error(errorMessage);
  }

  return message.parsed;
}
