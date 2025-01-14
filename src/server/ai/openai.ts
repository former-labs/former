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

export const getAIChatStructuredResponse = async <T extends z.ZodType>({
  model = "gpt-4o",
  messages,
  schemaOutput,
}: {
  model?: "gpt-4o" | "gpt-4o-mini";
  messages: ChatCompletionMessageParam[];
  schemaOutput: T;
}): Promise<z.infer<T>> => {
  const response = await client.beta.chat.completions.parse({
    model,
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

export const getAIChatTextResponse = async ({
  model = "gpt-4o",
  messages,
  prediction,
}: {
  model?: "gpt-4o" | "gpt-4o-mini";
  messages: ChatCompletionMessageParam[];
  prediction?: string;
}): Promise<string> => {
  const response = await client.chat.completions.create({
    model,
    messages: messages,
    ...(prediction && {
      prediction: {
        type: "content",
        content: prediction,
      },
    }),
  });

  const message = response.choices[0]?.message;

  if (message?.content === null || message?.content === undefined) {
    const errorMessage = message?.refusal ?? "Failed to get AI response";
    throw new Error(errorMessage);
  }

  return message.content;
};

/*
export const getAIChatTextResponseGroq = async ({
  model = "llama-3.3-70b-versatile",
  messages,
}: {
  model?: "llama-3.3-70b-versatile" | "llama-3.1-8b-instant";
  messages: ChatCompletionMessageParam[];
}): Promise<string> => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get AI response: ${response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices[0]?.message;

  if (message?.content === null || message?.content === undefined) {
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
    }

    const errorMessage = message?.refusal ?? "Failed to get AI response";
    throw new Error(errorMessage);
  }

  return message.content;
};
*/
