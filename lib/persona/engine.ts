import type { PetState } from "../types";
import { defaultPersona } from "./defaults";
import type { Emotion, LifeEntry, Persona } from "./types";

// Persona Engine 本体。
// - 人格の生成・維持（AIに依存しない）
// - 留守中の「暮らし」の生成（ローカル）
// - 感情の時間ドリフト
// - AIに渡す人格ブロックの組み立て（AIは表現するだけ）

const EMOTION_LABEL: Record<Emotion, string> = {
  happy: "うれしい", calm: "おだやか", lonely: "さみしい", excited: "わくわく", anxious: "少し不安", tired: "つかれ気味",
};

/** 人格を取り出す（無ければキャラクターから生成） */
export function ensurePersona(pet: PetState): Persona {
  return pet.persona ?? defaultPersona(pet.character);
}

/** キャラクター変更時：芯(core)と夢を新キャラに合わせ、感情・興味・暮らしは引き継ぐ */
export function syncPersonaToCharacter(persona: Persona | undefined, characterId?: string): Persona {
  const base = defaultPersona(characterId);
  if (!persona) return base;
  return { ...base, emotion: persona.emotion, interests: { ...base.interests, ...persona.interests }, currentLife: persona.currentLife, dreams: persona.dreams.length ? persona.dreams : base.dreams };
}

/** 来訪状況から短期感情を決める（時間経過で自然に変化） */
export function driftEmotion(ctx: { daysAway: number; streak: number; affection: number }): Emotion {
  if (ctx.daysAway >= 4) return "lonely";
  if (ctx.streak >= 3) return "excited";
  if (ctx.affection >= 50) return "happy";
  return "calm";
}

const GENERIC_LIFE = ["窓の外をながめていた", "少し昼寝した", "部屋をかたづけた", "日記を読み返していた", "ぼんやり考えごとをしていた"];
const INTEREST_LIFE: Record<string, string> = {
  music: "好きな音楽を聴いていた", reading: "本をよんでいた", exercise: "体を動かして遊んでいた",
  cooking: "新しいレシピを想像していた", games: "ひとりでゲームをしていた", knowledge: "新しいことを調べていた",
};

/** 留守中の暮らしを生成する（Persona Engineが生成。AIは使わない） */
export function generateCurrentLife(persona: Persona, daysAway: number): LifeEntry[] {
  const now = new Date().toISOString();
  const picks: string[] = [];

  // いちばん興味のあることから1つ
  const topInterest = Object.entries(persona.interests).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topInterest && INTEREST_LIFE[topInterest]) picks.push(INTEREST_LIFE[topInterest]);

  // 夢に向けて少し
  const dream = persona.dreams[0];
  if (dream) picks.push(`「${dream.text}」のために、少しだけがんばってみた`);

  // 汎用を1つ（日替わり）
  picks.push(GENERIC_LIFE[Math.floor(Math.random() * GENERIC_LIFE.length)]);

  // 長く空いていたら「さみしかった」を添える
  if (daysAway >= 4) picks.push(`${persona.core.userCall}のこと、ときどき思い出していた`);

  const entries = picks.slice(0, daysAway >= 4 ? 3 : 2).map((text) => ({ text, at: now }));
  return [...entries, ...persona.currentLife].slice(0, 12);
}

/** 会話の話題から興味を少し増やす（減衰は控えめ） */
export function nudgeInterest(persona: Persona, topic: string | null): Persona {
  if (!topic) return persona;
  const map: Record<string, string> = { music: "music", movement: "exercise", knowledge: "knowledge" };
  const key = map[topic];
  if (!key) return persona;
  const interests = { ...persona.interests, [key]: Math.min(100, (persona.interests[key] ?? 0) + 2) };
  return { ...persona, interests };
}

/** AIに渡す人格ブロック（AIはこれを"表現"するだけ。人格を決めない） */
export function buildPersonaBlock(persona: Persona): string {
  const topInterests = Object.entries(persona.interests)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k).join("・") || "まだ手さぐり";
  const dreams = persona.dreams.map((d) => `- ${d.text}`).join("\n") || "- （これから見つける）";
  const life = persona.currentLife.slice(0, 3).map((l) => `- ${l.text}`).join("\n") || "- （まだ記録なし）";
  return [
    "【Buddyの人格（アプリが保持。あなたAIはこの人格を『演じる』だけで、人格を勝手に決めないでください）】",
    `一人称:「${persona.core.firstPerson}」 / ${persona.core.userCall}のことをそう呼ぶ`,
    `基本性格: ${persona.core.basePersonality}`,
    `信念: ${persona.core.beliefs}`,
    `好き: ${persona.core.likes.join("、")} / 苦手: ${persona.core.dislikes.join("、")}`,
    `いまの気持ち: ${EMOTION_LABEL[persona.emotion]}`,
    `いま興味があること: ${topInterests}`,
    `夢:\n${dreams}`,
    `最近の暮らし（留守中の出来事。会話に自然に混ぜてよい）:\n${life}`,
  ].join("\n");
}

export function emotionLabel(e: Emotion): string {
  return EMOTION_LABEL[e];
}
