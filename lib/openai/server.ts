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

export function extractChatCompletionText(response: OpenAI.Chat.Completions.ChatCompletion | null | undefined) {
  const content = response?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

export function logOpenAIBackendError(scope: string, error: unknown) {
  if (error instanceof OpenAI.APIError) {
    console.error(`[${scope}] OpenAI API error`, {
      status: error.status ?? null,
      requestId: error.requestID ?? null,
      code: error.code ?? null,
      type: error.type ?? null,
      message: error.message,
      rawBody: error.error ?? null,
    });
    return;
  }

  console.error(`[${scope}] OpenAI unexpected error`, error);
}

