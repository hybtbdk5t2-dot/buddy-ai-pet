import type { AIMessage, AIProvider, GenerateOptions } from "../types";
import { chatCompletions } from "./openai-compatible";

// OpenAI公式（api.openai.com）。OPENAI_BASE_URL で互換エンドポイントにも向けられる。
export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  readonly model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    return chatCompletions({ baseUrl: this.baseUrl, apiKey: this.apiKey, model: options?.model || this.model, messages, options });
  }
}
