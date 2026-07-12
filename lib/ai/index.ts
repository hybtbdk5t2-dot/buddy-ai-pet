import { cacheKey, getCached, setCached } from "./cache";
import { ClaudeProvider } from "./providers/claude";
import { GeminiProvider } from "./providers/gemini";
import { LocalProvider } from "./providers/local";
import { OpenAIProvider } from "./providers/openai";
import { OpenRouterProvider } from "./providers/openrouter";
import type { AIMessage, AIProvider, GenerateOptions } from "./types";

export type { AIMessage } from "./types";

// 追加プロバイダーはこの表に1行足すだけで拡張できる（拡張性重視）。
const REGISTRY: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  claude: () => new ClaudeProvider(),
  openrouter: () => new OpenRouterProvider(),
  local: () => new LocalProvider(),
};

// 自動選択のときに試す優先順位
const AUTO_ORDER = ["openai", "gemini", "claude", "openrouter", "local"];

/**
 * 環境変数から使用プロバイダーを決定する。
 * - AI_PROVIDER で明示指定（openai/gemini/claude/openrouter/local）
 * - 未指定/auto のときは、設定済みのものを優先順で自動選択
 * - どれも未設定なら null（＝デモ／オフライン。ローカルのフォールバック応答を使う）
 */
export function resolveProvider(): AIProvider | null {
  const requested = (process.env.AI_PROVIDER || "auto").toLowerCase();

  if (requested !== "auto" && requested !== "demo") {
    const factory = REGISTRY[requested];
    if (!factory) return null;
    const provider = factory();
    return provider.isConfigured() ? provider : null;
  }
  if (requested === "demo") return null;

  for (const id of AUTO_ORDER) {
    const provider = REGISTRY[id]();
    if (provider.isConfigured()) return provider;
  }
  return null;
}

/** UI表示・モード判定用のプロバイダーID（未設定時は "demo"） */
export function activeProviderId(): string {
  return resolveProvider()?.id ?? "demo";
}

/**
 * メッセージ列から応答テキストを生成する。
 * - プロバイダー未設定なら null（呼び出し側でローカルのフォールバックを使う）
 * - 生成失敗（例外）でも null を返す（アプリは落とさない）
 * - 同一入力はキャッシュして無駄なAPIコールを避ける
 */
export async function generateText(
  messages: AIMessage[],
  options?: GenerateOptions,
): Promise<{ text: string; providerId: string } | null> {
  const provider = resolveProvider();
  if (!provider) return null;

  const key = cacheKey([provider.id, provider.model, JSON.stringify(messages)]);
  const cached = getCached(key);
  if (cached) return { text: cached, providerId: provider.id };

  try {
    const text = await provider.generate(messages, options);
    setCached(key, text);
    return { text, providerId: provider.id };
  } catch (error) {
    console.error(`[ai] ${provider.id} の生成に失敗しました:`, error);
    return null;
  }
}
