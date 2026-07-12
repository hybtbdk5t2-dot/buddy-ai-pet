import { computeVisit, evolutionStage, proactiveGreeting, todayKey } from "../engagement";
import type { Mood, PetState } from "../types";

// ゲームイベントを独立したシステムとして扱う（#12）。
// イベントに応じて会話・表情（mood）・演出を切り替えられるよう、
// 検知ロジックをUIから分離する。将来 誕生日/アイテム取得 等もここに追加する。

export type GameEvent =
  | { type: "first-login" }
  | { type: "comeback"; daysAway: number }
  | { type: "streak"; streak: number }
  | { type: "levelup"; level: number }
  | { type: "evolve"; level: number; title: string };

export type VisitResult = {
  events: GameEvent[];
  streak: number;
  greeting: string | null; // 新しい日にBuddyから話しかける一言
  moodOverride: Mood | null;
};

/** ログイン時のイベント（初回・再訪・連続来訪）を判定する */
export function processVisit(pet: PetState, today = todayKey()): VisitResult {
  const visit = computeVisit(pet, today);
  const events: GameEvent[] = [];
  let greeting: string | null = null;
  let moodOverride: Mood | null = null;

  if (visit.firstEver) {
    events.push({ type: "first-login" });
  } else if (visit.isNewDay) {
    greeting = proactiveGreeting(pet, visit);
    moodOverride = visit.daysAway >= 4 ? "lonely" : "happy";
    if (visit.daysAway >= 3) events.push({ type: "comeback", daysAway: visit.daysAway });
    if (visit.streak >= 2) events.push({ type: "streak", streak: visit.streak });
  }

  return { events, streak: visit.streak, greeting, moodOverride };
}

/** レベル変化からレベルアップ／進化イベントを判定する */
export function detectLevelChange(prevLevel: number, newLevel: number): GameEvent | null {
  if (newLevel <= prevLevel) return null;
  const before = evolutionStage(prevLevel);
  const after = evolutionStage(newLevel);
  return after.stage > before.stage
    ? { type: "evolve", level: newLevel, title: after.title }
    : { type: "levelup", level: newLevel };
}
