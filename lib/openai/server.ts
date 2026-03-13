import "server-only";
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export function getOpenAIServerClient() {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for server OpenAI client");
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

