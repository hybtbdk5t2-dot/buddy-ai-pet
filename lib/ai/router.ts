// メッセージの内容から「AIを使うか」「どのモデル階層か」を判定する。
// 目的: AI利用の最小化とコスト最適化（#6, #9）。
//  - greeting/簡単な定型  -> template（AIを呼ばない）
//  - smalltalk（軽い会話） -> light（軽量モデル）
//  - consult/story（深い相談・物語） -> heavy（高性能モデル）

export type Intent = "greeting" | "smalltalk" | "consult" | "story";
export type Tier = "template" | "light" | "heavy";

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

const GREETINGS = ["おはよう", "こんにちは", "こんばんは", "やあ", "ただいま", "おやすみ", "hi", "hello", "ヤッホー", "よお"];
const CONSULT = ["相談", "どうしよう", "どうすれば", "つらい", "しんどい", "悩", "迷って", "不安", "こわい", "助けて", "たすけて", "落ち込"];
const STORY = ["物語", "ストーリー", "冒険", "むかしむかし", "お話して", "話を作"];

export function classifyMessage(message: string): { intent: Intent; tier: Tier } {
  const t = message.toLowerCase().trim();

  // 短い挨拶だけの発話はAI不要（定型で返す）
  if (t.length <= 12 && has(t, GREETINGS)) return { intent: "greeting", tier: "template" };
  if (has(t, STORY)) return { intent: "story", tier: "heavy" };
  if (has(t, CONSULT) || t.length > 120) return { intent: "consult", tier: "heavy" };
  return { intent: "smalltalk", tier: "light" };
}

/**
 * tier に対応するモデル名（プロバイダー非依存の上書き）。
 * 未設定ならプロバイダー既定のモデルを使う（null を返す）。
 */
export function modelForTier(tier: Tier): string | null {
  if (tier === "heavy") return process.env.AI_HEAVY_MODEL || null;
  if (tier === "light") return process.env.AI_LIGHT_MODEL || null;
  return null;
}
