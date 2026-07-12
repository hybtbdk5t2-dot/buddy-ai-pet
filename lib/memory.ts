import { sortMemories } from "./engagement";
import type { AIMessage } from "./ai/types";
import type { PetState } from "./types";

// 記憶システムを3種類に分離する。
//  - 短期記憶: 直近の会話（毎回すべては送らず、直近数件だけ）
//  - 長期記憶: 重要な出来事・お気に入りの思い出（ユーザー情報）
//  - 感情記憶: 信頼度・親密度・関係性（数値からローカルに導出）
// AIには「必要な記憶だけ」を渡す。

const SHORT_TERM_WINDOW = 6;

/** 短期記憶：直近の会話だけをrole付きで返す */
export function shortTermMessages(pet: PetState, window = SHORT_TERM_WINDOW): AIMessage[] {
  return pet.messages
    .slice(-window)
    .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content } as AIMessage));
}

/**
 * 長期記憶：お気に入り・重要度を優先しつつ、いまの話題に関連するものを上位に。
 * 全件は送らず上位 limit 件だけ渡す。
 */
export function longTermMemory(pet: PetState, currentMessage = "", limit = 6): string {
  const msg = currentMessage.toLowerCase();
  const scored = sortMemories(pet.memories).map((m, i) => {
    let score = (pet.memories.length - i) + m.importance + (m.pinned ? 100 : 0);
    // 話題の語がタイトル/要約に含まれれば関連度を上げる（必要な記憶だけを渡すため）
    if (msg && (msg.includes(m.title.toLowerCase()) || m.summary.toLowerCase().split(/\s+/).some((w) => w.length > 1 && msg.includes(w)))) {
      score += 50;
    }
    return { m, score };
  });
  const top = scored.sort((a, b) => b.score - a.score).slice(0, limit).map(({ m }) => m);
  if (top.length === 0) return "まだない";
  return top.map((m) => `- ${m.pinned ? "【お気に入り】" : ""}${m.title}: ${m.summary}`).join("\n");
}

/** 感情記憶：信頼度・親密度・安心感などの関係性を数値からローカルに要約する */
export function emotionalMemory(pet: PetState): string {
  const days = pet.bornAt
    ? Math.max(1, Math.floor((Date.now() - new Date(pet.bornAt).getTime()) / 86400000) + 1)
    : 1;
  const streak = pet.streak ?? 0;
  // 信頼度 = 親密度と継続日数からの簡易指標（0-100）
  const trust = Math.min(100, Math.round(pet.affection * 0.6 + Math.min(days, 60) * 0.5 + streak * 2));
  const bond = pet.affection >= 60 ? "とても深い" : pet.affection >= 30 ? "育ってきている" : "芽生えたばかり";
  return `親密度${pet.affection} / 信頼度${trust} / 連続来訪${streak}日 / 一緒に${days}日目 / 絆は${bond}`;
}
