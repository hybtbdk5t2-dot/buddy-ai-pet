import type { AIMessage, AIProvider, GenerateOptions } from "../types";
import { chatCompletions } from "./openai-compatible";

// Groq（無料枠が広く・高速・カード不要）。OpenAI互換APIなので共通ヘルパーで扱える。
// 例: GROQ_API_KEY=gsk_...  GROQ_MODEL=llama-3.3-70b-versatile
export class GroqProvider implements AIProvider {
  readonly id = "groq";
  readonly model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  private readonly apiKey = process.env.GROQ_API_KEY;
  private readonly baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    return chatCompletions({ baseUrl: this.baseUrl, apiKey: this.apiKey, model: options?.model || this.model, messages, options });
  }
}
