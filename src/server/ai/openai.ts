import { env } from "@/env";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { type z } from "zod";

export const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: "https://oai.hconeai.com/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${env.HELICONE_API_KEY}`,
    "Helicone-Property-Agent": "ga4-params",
  },
});

export const getAIChatResponse = async <T extends z.ZodType>({
  messages,
  schemaOutput,
}: {
  messages: ChatCompletionMessageParam[];
  schemaOutput: T;
}): Promise<z.infer<T>> => {
  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o",
    messages: messages,
    response_format: zodResponseFormat(schemaOutput, "response"),
  });

  const message = response.choices[0]?.message;

  if (!message?.parsed) {
    const errorMessage = message?.refusal ?? "Failed to get AI response";
    throw new Error(errorMessage);
  }

  return message.parsed;
};
