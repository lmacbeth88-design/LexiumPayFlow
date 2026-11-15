import { createOpenAI } from "@ai-sdk/openai";
import type { generateText } from "ai";

export type AgentModel = Parameters<typeof generateText>[0]["model"];

export interface ResolveModelOptions {
  modelId?: string;
  apiKey?: string;
  baseUrl?: string;
}

export function resolveModel(options: ResolveModelOptions = {}): AgentModel {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta OPENAI_API_KEY. Define la variable de entorno o pasa apiKey a resolveModel().",
    );
  }

  const baseURL = options.baseUrl ?? process.env.OPENAI_BASE_URL;
  const provider = createOpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  return provider(
    options.modelId ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  );
}
