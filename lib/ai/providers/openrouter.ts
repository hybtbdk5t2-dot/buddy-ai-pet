import type { AIMessage, AIProvider, GenerateOptions } from "../types";
import { chatCompletions } from "./openai-compatible";

// OpenRouter経由（OpenAI互換）。1つのキーで多数のLLMを利用できる。
export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";
  readonly model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  private readonly apiKey = process.env.OPENROUTER_API_KEY;
  private readonly baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    // OpenRouter推奨の識別ヘッダ（任意）
    const extraHeaders: Record<string, string> = {};
    if (process.env.OPENROUTER_SITE_URL) extraHeaders["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    if (process.env.OPENROUTER_APP_NAME) extraHeaders["X-Title"] = process.env.OPENROUTER_APP_NAME;
    return chatCompletions({ baseUrl: this.baseUrl, apiKey: this.apiKey, model: options?.model || this.model, messages, extraHeaders, options });
  }
}
