import { evolutionStage } from "../engagement";
import { emotionalMemory, longTermMemory, shortTermMessages } from "../memory";
import { buildPersonaBlock, ensurePersona } from "../persona/engine";
import type { Mood, PetState } from "../types";
import { getCharacter } from "./characters";
import { personalityCorrections } from "./persona";
import { renderPrompt } from "./prompts";
import type { AIMessage } from "./types";

const MOOD_LABEL: Record<Mood, string> = {
  normal: "ふつう", happy: "うれしい", thinking: "かんがえ中", sleepy: "ねむい", lonely: "さみしい", surprised: "びっくり",
};
const MOOD_HINT: Record<Mood, string> = {
  normal: "おだやかに", happy: "うれしそうに", thinking: "考えながら", sleepy: "ねむそうに", lonely: "少しさみしげに", surprised: "おどろきながら",
};

/** 会話返答用のメッセージ列を組み立てる（プロンプトは外部ファイル、記憶は3分類から必要分だけ） */
export function buildChatMessages(
  pet: PetState,
  message: string,
  mood: Mood,
  opts: { story?: boolean } = {},
): AIMessage[] {
  const stage = evolutionStage(pet.level);
  const character = getCharacter(pet.character);
  const corrections = personalityCorrections(pet.personality);
  const recentDiary = pet.diary.slice(0, 3).map((d) => `- ${d.date}: ${d.body.slice(0, 80)}`).join("\n") || "まだない";

  // 最終的な話し方 = キャラクターの芯 ＋ 人格(Persona) ＋ 個性値による補正 ＋ 気分
  const systemParts = [
    renderPrompt("system", { name: pet.name, stage: stage.title }),
    renderPrompt("character_core", { baseTone: character.baseTone }),
    // 人格はアプリが保持。AIはこれを表現するだけで、人格を決めない。
    buildPersonaBlock(ensurePersona(pet)),
  ];
  if (corrections) systemParts.push(renderPrompt("personality_corrections", { corrections }));
  systemParts.push(renderPrompt("emotion", { moodLabel: MOOD_LABEL[mood], moodHint: MOOD_HINT[mood] }));
  systemParts.push(renderPrompt("memory", {
    longTerm: longTermMemory(pet, message),
    emotional: emotionalMemory(pet),
    recentDiary,
  }));
  if (opts.story) systemParts.push(renderPrompt("story", { name: pet.name }));

  return [
    { role: "system", content: systemParts.join("\n\n") },
    ...shortTermMessages(pet),
    { role: "user", content: message },
  ];
}

/** 日記本文の生成用メッセージ列を組み立てる */
export function buildDiaryMessages(pet: PetState): AIMessage[] {
  const today = new Date().toISOString().slice(0, 10);
  const todaysMessages = pet.messages.filter((m) => m.createdAt.slice(0, 10) === today);
  const conversation = todaysMessages
    .slice(-24)
    .map((m) => `${m.role === "user" ? "ユーザー" : pet.name}: ${m.content}`)
    .join("\n") || "（今日はまだ会話がない）";

  return [
    { role: "system", content: renderPrompt("diary", { name: pet.name }) },
    { role: "user", content: `大切な思い出:\n${longTermMemory(pet, "", 5)}\n\n今日の会話:\n${conversation}` },
  ];
}
