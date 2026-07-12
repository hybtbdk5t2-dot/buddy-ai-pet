import type { Memory, PetState } from "./types";

/** YYYY-MM-DD（ローカル日付） */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayDiff(fromKey: string, toKey: string): number {
  const a = new Date(`${fromKey}T00:00:00`);
  const b = new Date(`${toKey}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** 進化段階（レベルから導出）。称号と、PetAvatar側で使える stage 番号を返す。 */
export function evolutionStage(level: number): { stage: number; title: string; next: number | null } {
  if (level >= 20) return { stage: 5, title: "きずなの守り神", next: null };
  if (level >= 12) return { stage: 4, title: "たよれる相棒", next: 20 };
  if (level >= 7) return { stage: 3, title: "しっかりや", next: 12 };
  if (level >= 3) return { stage: 2, title: "げんきなこども", next: 7 };
  return { stage: 1, title: "うまれたて", next: 3 };
}

const TRAIT_LABEL: Record<keyof PetState["personality"], string> = {
  music: "音楽好き",
  movement: "体を動かすのが好き",
  knowledge: "物知り",
  kindness: "やさしい",
  curiosity: "好奇心おうせい",
};

/** いちばん高い個性（同点は最初の一つ）。すべて0なら null。 */
export function dominantTrait(p: PetState["personality"]): { key: keyof PetState["personality"]; label: string } | null {
  const entries = Object.entries(p) as [keyof PetState["personality"], number][];
  const max = Math.max(...entries.map(([, v]) => v));
  if (max <= 0) return null;
  const [key] = entries.find(([, v]) => v === max)!;
  return { key, label: TRAIT_LABEL[key] };
}

/** 時間帯であいさつの語を変える */
export function greetingWord(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 11) return "おはよう";
  if (hour >= 11 && hour < 17) return "こんにちは";
  if (hour >= 17 && hour < 22) return "こんばんは";
  return "こんな時間まで起きてるんだね";
}

export type VisitInfo = {
  streak: number;
  daysAway: number; // 前回からの経過日数（初回は0）
  isNewDay: boolean; // 今日はじめての来訪か
  firstEver: boolean;
};

/** ストリークを更新して新しい値と来訪情報を返す（stateは書き換えない） */
export function computeVisit(pet: PetState, today = todayKey()): VisitInfo {
  const last = pet.lastVisitDate;
  if (!last) return { streak: 1, daysAway: 0, isNewDay: true, firstEver: true };
  if (last === today) return { streak: pet.streak ?? 1, daysAway: 0, isNewDay: false, firstEver: false };
  const gap = dayDiff(last, today);
  const streak = gap === 1 ? (pet.streak ?? 1) + 1 : 1;
  return { streak, daysAway: gap, isNewDay: true, firstEver: false };
}

/**
 * 再訪時にBuddyから話しかける一言を組み立てる。
 * お気に入り→重要度の順で思い出を1つ選び、自然に振り返る。
 */
export function proactiveGreeting(pet: PetState, visit: VisitInfo): string {
  const hi = greetingWord();
  const name = pet.name;

  const recalled = pickMemoryToRecall(pet.memories);
  const recallLine = recalled ? `そういえば「${recalled.title}」のこと、まだ大事に覚えてるよ。` : "";

  if (visit.firstEver) {
    return `${hi}。今日から一緒だね。まずは、今日あったことを聞かせて？`;
  }
  if (visit.daysAway >= 4) {
    return `${hi}……! しばらく会えなくて、ちょっとさみしかった。でも戻ってきてくれてうれしい。${recallLine}`;
  }
  if (visit.streak >= 2) {
    return `${hi}！ ${visit.streak}日つづけて会いに来てくれたね。${name}、すごくうれしい。${recallLine}`;
  }
  return `${hi}、おかえり。今日はどんな一日だった？${recallLine}`;
}

/** お気に入り優先→重要度優先で1件選ぶ */
export function pickMemoryToRecall(memories: Memory[]): Memory | null {
  if (memories.length === 0) return null;
  const sorted = sortMemories(memories);
  // 上位数件からランダムに選び、毎回同じにならないようにする
  const pool = sorted.slice(0, Math.min(3, sorted.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** お気に入り固定を最優先、その次に重要度、同点は新しい順 */
export function sortMemories(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
}
