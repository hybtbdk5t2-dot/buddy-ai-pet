import type { AIMessage, AIProvider, GenerateOptions } from "../types";
import { chatCompletions } from "./openai-compatible";

// ローカルLLM（Ollama, LM Studio, llama.cpp, vLLM など）。
// これらはOpenAI互換の /v1 エンドポイントを提供するため共通ヘルパーで扱える。
// 例: LOCAL_AI_BASE_URL=http://localhost:11434/v1  LOCAL_AI_MODEL=llama3.1
export class LocalProvider implements AIProvider {
  readonly id = "local";
  readonly model = process.env.LOCAL_AI_MODEL || "llama3.1";
  private readonly baseUrl = process.env.LOCAL_AI_BASE_URL || "";
  // ローカルは無認証が多いが、必要なら任意のキーを渡せる
  private readonly apiKey = process.env.LOCAL_AI_API_KEY || "local";

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    return chatCompletions({ baseUrl: this.baseUrl, apiKey: this.apiKey, model: this.model, messages, options });
  }
}
