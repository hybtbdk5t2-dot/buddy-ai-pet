// AI利用予算の管理（#8）。ユーザー単位で1日あたりのAI会話回数・トークン量を制御する。
// いまはサーバー内メモリ実装。将来的にDB/プラン連携へ差し替えられるよう、
// checkBudget / recordUsage のインターフェイスだけ公開する。
//
// 環境変数（0 または未設定で無制限）:
//   AI_DAILY_CALL_LIMIT   … 1ユーザーあたり1日のAI会話回数上限
//   AI_DAILY_TOKEN_LIMIT  … 1ユーザーあたり1日の概算トークン上限

import { todayKey } from "../engagement";

type Usage = { day: string; calls: number; tokens: number };

const usageByUser = new Map<string, Usage>();

function limits() {
  return {
    calls: Number(process.env.AI_DAILY_CALL_LIMIT || 0),
    tokens: Number(process.env.AI_DAILY_TOKEN_LIMIT || 0),
  };
}

function current(userId: string): Usage {
  const today = todayKey();
  const u = usageByUser.get(userId);
  if (!u || u.day !== today) {
    const fresh = { day: today, calls: 0, tokens: 0 };
    usageByUser.set(userId, fresh);
    return fresh;
  }
  return u;
}

/** これからAIを1回呼べるか。超過していれば allowed:false（呼び出し側は定型応答へ）。 */
export function checkBudget(userId: string): { allowed: boolean; reason?: string } {
  const { calls, tokens } = limits();
  const u = current(userId);
  if (calls > 0 && u.calls >= calls) return { allowed: false, reason: "daily-call-limit" };
  if (tokens > 0 && u.tokens >= tokens) return { allowed: false, reason: "daily-token-limit" };
  return { allowed: true };
}

/** 実際に消費した概算トークンを記録する */
export function recordUsage(userId: string, approxTokens: number): void {
  const u = current(userId);
  u.calls += 1;
  u.tokens += Math.max(0, Math.round(approxTokens));
}

/** 文字数からの概算トークン（日本語混在のざっくり見積り） */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

/** 現在の使用状況（管理・表示用） */
export function usageSnapshot(userId: string): Usage & { limits: ReturnType<typeof limits> } {
  return { ...current(userId), limits: limits() };
}
