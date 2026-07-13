import type { ChatResult, Mood, PetState } from "./types";
import { characterVoiceLine, getCharacterDefinition, type CharacterVoiceLine } from "./character-catalog";

// ---------------------------------------------------------------------------
// ローカルのゲームロジック。
// レベル/経験値/親密度/気分/個性/記憶/日記の一言など、状態にかかわる算出は
// すべてここで完結させ、AIには一切依存しない（コスト削減・オフライン動作のため）。
// AIが担うのは「会話文」と「日記本文」の自然言語生成だけ。
// ---------------------------------------------------------------------------

const includesAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

type Trait = keyof PetState["personality"];
const ALL_TRAITS: Trait[] = ["music", "movement", "knowledge", "kindness", "curiosity"];

type Topic = "music" | "movement" | "knowledge" | "tired" | "achievement" | "none";

function detectTopic(normalized: string): Topic {
  if (includesAny(normalized, ["曲", "音楽", "ベース", "suno", "歌詞", "ギター", "ライブ"])) return "music";
  if (includesAny(normalized, ["バク宙", "トリッキング", "練習", "筋トレ", "運動", "走", "スポーツ"])) return "movement";
  if (includesAny(normalized, ["勉強", "本", "読んだ", "学", "調べ", "知った", "ニュース"])) return "knowledge";
  if (includesAny(normalized, ["疲れ", "つらい", "しんどい", "落ち込", "泣"])) return "tired";
  if (includesAny(normalized, ["できた", "成功", "完成", "嬉しい", "うれしい", "達成"])) return "achievement";
  return "none";
}

// 話題に関わった個性を伸ばし、それ以外はゆるやかに下げる（利用者の趣向へ寄せる）
function focus(primary: Trait, boost = 3, secondary?: Trait): ChatResult["personalityDelta"] {
  const delta: ChatResult["personalityDelta"] = {};
  for (const t of ALL_TRAITS) delta[t] = -1;
  delta[primary] = boost;
  if (secondary) delta[secondary] = 1;
  return delta;
}

const TOPIC_MOOD: Record<Topic, Mood> = {
  music: "happy",
  movement: "happy",
  knowledge: "thinking",
  tired: "lonely",
  achievement: "surprised",
  none: "normal",
};

/** 会話に含まれない「状態変化」だけをローカルで算出する（AIは使わない） */
export function analyzeMessage(message: string, pet: PetState): Omit<ChatResult, "reply"> {
  const normalized = message.toLowerCase();
  const topic = detectTopic(normalized);
  const mood = TOPIC_MOOD[topic];

  let personalityDelta: ChatResult["personalityDelta"] = { curiosity: 1 };
  switch (topic) {
    case "music": personalityDelta = focus("music"); break;
    case "movement": personalityDelta = focus("movement", 3, "kindness"); break;
    case "knowledge": personalityDelta = focus("knowledge", 3, "curiosity"); break;
    case "tired": personalityDelta = focus("kindness"); break;
    case "achievement": personalityDelta = focus("curiosity", 3, "kindness"); break;
  }

  const important = includesAny(normalized, ["初めて", "成功", "完成", "誕生日", "決めた", "できた", "達成"]);

  return {
    mood,
    experienceDelta: important ? 8 : 4,
    affectionDelta: important ? 3 : 1,
    personalityDelta,
    memory: important
      ? { shouldSave: true, title: message.slice(0, 22), summary: message.slice(0, 100), emotion: mood, importance: 8 }
      : undefined,
    diaryLine: `今日は「${message.slice(0, 38)}」という話をしてくれた。もっと${getCharacterDefinition(pet.character).core.userCall}のことを知りたい。`,
  };
}

/** AIが使えない／失敗した／オフラインのときの、ルールベースの返答文 */
export function fallbackReply(message: string, pet: PetState): string {
  const topic = detectTopic(message.toLowerCase());
  const line: CharacterVoiceLine = topic === "none" ? "default" : topic;
  return characterVoiceLine(pet.character, line, pet.name);
}

/** AIが使えないときの、日記本文のフォールバック生成 */
export function localDiary(pet: PetState, todaysUserMessages: string[]): string {
  const userCall = getCharacterDefinition(pet.character).core.userCall;
  if (todaysUserMessages.length === 0) {
    return `今日は静かな一日だった。${pet.name}は、${userCall}が来てくれるのをずっと待っていた。`;
  }
  const topics = todaysUserMessages.slice(-3).map((m) => `「${m.slice(0, 30)}」`).join("、");
  const closing = pet.affection >= 50 ? `${userCall}と過ごす時間が、いちばんの宝物になってきた。` : `もっと${userCall}のことを知りたいと思った一日だった。`;
  return `今日は${topics}という話を聞かせてもらった。${pet.name}なりに、ひとつひとつ大事にしまっておいた。${closing}`;
}
