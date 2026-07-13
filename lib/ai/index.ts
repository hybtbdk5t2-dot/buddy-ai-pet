import { checkBudget, estimateTokens, recordUsage } from "./budget";
import { cacheKey, getCached, setCached } from "./cache";
import { ClaudeProvider } from "./providers/claude";
import { GeminiProvider } from "./providers/gemini";
import { GroqProvider } from "./providers/groq";
import { LocalProvider } from "./providers/local";
import { OpenAIProvider } from "./providers/openai";
import { OpenRouterProvider } from "./providers/openrouter";
import { modelForTier, type Tier } from "./router";
import type { AIMessage, AIProvider } from "./types";

export type { AIMessage } from "./types";

// 追加プロバイダーはこの表に1行足すだけで拡張できる（拡張性重視）。
const REGISTRY: Record<string, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  claude: () => new ClaudeProvider(),
  groq: () => new GroqProvider(),
  openrouter: () => new OpenRouterProvider(),
  local: () => new LocalProvider(),
};

// 自動選択・フォールバックの既定優先順位。
const DEFAULT_ORDER = ["gemini", "groq", "openrouter", "openai", "claude", "local"];

/**
 * 使用するプロバイダーの「試行順チェーン」を環境変数から決める。
 * - AI_PROVIDER_ORDER="gemini,openrouter,local" で明示（多段フォールバック）
 * - AI_PROVIDER="openai" で単一指定
 * - どちらも無ければ DEFAULT_ORDER のうち設定済みのものを自動採用
 * - demo 指定・未設定なら空（＝ローカル定型応答）
 */
export function providerChain(): AIProvider[] {
  const order = process.env.AI_PROVIDER_ORDER;
  const single = (process.env.AI_PROVIDER || "").toLowerCase();

  let ids: string[];
  if (order) ids = order.split(",").map((s) => s.trim().toLowerCase());
  else if (single && single !== "auto" && single !== "demo") ids = [single];
  else if (single === "demo") ids = [];
  else ids = DEFAULT_ORDER;

  return ids
    .map((id) => REGISTRY[id])
    .filter(Boolean)
    .map((factory) => factory())
    .filter((p) => p.isConfigured());
}

/** UI表示・モード判定用：先頭（優先）プロバイダーのID。無ければ "demo"。 */
export function activeProviderId(): string {
  return providerChain()[0]?.id ?? "demo";
}

export type GenerateArgs = {
  tier?: Tier;
  userId?: string;
  temperature?: number;
  maxTokens?: number;
};

/**
 * メッセージ列から応答を生成する。多段フォールバック・キャッシュ・予算管理を内包。
 * - プロバイダー未設定 / 予算超過 / 全プロバイダー失敗 なら null
 *   （呼び出し側はローカル定型応答へ）。
 */
export async function generateText(
  messages: AIMessage[],
  args: GenerateArgs = {},
): Promise<{ text: string; providerId: string } | null> {
  const chain = providerChain();
  if (chain.length === 0) return null;

  const userId = args.userId || "default";
  const budget = checkBudget(userId);
  if (!budget.allowed) {
    console.warn(`[ai] 予算超過のため定型応答にフォールバック: ${budget.reason}`);
    return null;
  }

  const model = args.tier ? modelForTier(args.tier) : null;
  const opts = { temperature: args.temperature, maxTokens: args.maxTokens, ...(model ? { model } : {}) };

  for (const provider of chain) {
    const key = cacheKey([provider.id, model || provider.model, JSON.stringify(messages)]);
    const cached = getCached(key);
    if (cached) return { text: cached, providerId: provider.id };

    try {
      const text = await provider.generate(messages, opts);
      setCached(key, text);
      const promptChars = messages.reduce((n, m) => n + m.content.length, 0);
      recordUsage(userId, estimateTokens(text) + estimateTokens("x".repeat(promptChars)));
      return { text, providerId: provider.id };
    } catch (error) {
      console.error(`[ai] ${provider.id} 失敗、次のプロバイダーへフォールバック:`, error);
    }
  }
  return null;
}
