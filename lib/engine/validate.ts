import type { BackgroundSetting, Memory, Mood, PetState } from "../types";

// ゲームデータのバリデーション（#13）。
// AIやインポート等、外部由来の値を必ずここを通して正規化・クランプする。
// 「AIはゲーム状態を書き換えない。最終決定と検証はエンジンが行う」という原則の要。

const MOODS: Mood[] = ["normal", "happy", "thinking", "sleepy", "lonely", "surprised"];

const clampInt = (v: unknown, min: number, max: number, fallback = min): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.max(min, Math.min(max, n));
};

const str = (v: unknown, max: number, fallback = ""): string =>
  (typeof v === "string" ? v : fallback).slice(0, max);

function validateMemory(m: Partial<Memory>): Memory | null {
  if (!m || typeof m.title !== "string") return null;
  return {
    id: str(m.id, 64) || (globalThis.crypto?.randomUUID?.() ?? String(Math.random())),
    title: str(m.title, 60, "無題の思い出"),
    summary: str(m.summary, 500),
    emotion: str(m.emotion, 20),
    importance: clampInt(m.importance, 1, 10, 5),
    occurredAt: str(m.occurredAt, 40) || new Date().toISOString(),
    pinned: !!m.pinned,
  };
}

function validateBackground(bg: unknown): BackgroundSetting | undefined {
  if (!bg || typeof bg !== "object") return undefined;
  const b = bg as Partial<BackgroundSetting> & { type?: string; id?: string; data?: string };
  if (b.type === "preset" && typeof b.id === "string") return { type: "preset", id: b.id.slice(0, 40) };
  if (b.type === "image" && typeof b.data === "string" && b.data.startsWith("data:image/")) return { type: "image", data: b.data };
  return undefined;
}

/** PetState全体を正規化して返す。壊れた値は安全な既定へ丸める。 */
export function validatePet(pet: PetState): PetState {
  const experience = Math.max(0, Math.round(Number(pet.experience) || 0));
  const personality = pet.personality ?? { music: 0, movement: 0, knowledge: 0, kindness: 0, curiosity: 0 };

  return {
    name: str(pet.name, 24, "Buddy") || "Buddy",
    experience,
    // レベルは経験値から導出し、状態の整合性を保つ
    level: Math.floor(experience / 100) + 1,
    affection: clampInt(pet.affection, 0, 100, 5),
    mood: MOODS.includes(pet.mood) ? pet.mood : "normal",
    personality: {
      music: clampInt(personality.music, 0, 100),
      movement: clampInt(personality.movement, 0, 100),
      knowledge: clampInt(personality.knowledge, 0, 100),
      kindness: clampInt(personality.kindness, 0, 100),
      curiosity: clampInt(personality.curiosity, 0, 100),
    },
    messages: Array.isArray(pet.messages) ? pet.messages.slice(-200) : [],
    memories: Array.isArray(pet.memories)
      ? pet.memories.map(validateMemory).filter((m): m is Memory => m !== null).slice(0, 100)
      : [],
    diary: Array.isArray(pet.diary) ? pet.diary.slice(0, 400) : [],
    bornAt: str(pet.bornAt, 40) || undefined,
    lastVisitDate: str(pet.lastVisitDate, 10) || undefined,
    streak: pet.streak === undefined ? undefined : Math.max(0, Math.round(Number(pet.streak) || 0)),
    background: validateBackground(pet.background),
  };
}
