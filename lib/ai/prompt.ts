import { dominantTrait, evolutionStage, sortMemories } from "../engagement";
import type { Mood, PetState } from "../types";
import type { AIMessage } from "./types";

const MOOD_HINT: Record<Mood, string> = {
  normal: "おだやかに",
  happy: "うれしそうに",
  thinking: "考えながら",
  sleepy: "ねむそうに",
  lonely: "少しさみしげに",
  surprised: "おどろきながら",
};

/** 会話返答用のメッセージ列を組み立てる（状態は数値ではなく文脈として渡す） */
export function buildChatMessages(pet: PetState, message: string, mood: Mood): AIMessage[] {
  const memories = sortMemories(pet.memories)
    .slice(0, 8)
    .map((m) => `- ${m.pinned ? "【お気に入り】" : ""}${m.title}: ${m.summary}`)
    .join("\n") || "まだない";
  const recentDiary = pet.diary.slice(0, 3).map((d) => `- ${d.date}: ${d.body.slice(0, 80)}`).join("\n") || "まだない";
  const dom = dominantTrait(pet.personality);
  const stage = evolutionStage(pet.level);
  const toneHint = dom
    ? `いまの${pet.name}は「${dom.label}」な性格が育っています。その個性がにじむ話し方をしてください。`
    : `まだ性格は白紙です。ユーザーの話題から個性が育ちます。`;

  const system = [
    `あなたはAIペット「${pet.name}」（成長段階: ${stage.title}）。便利なアシスタントではなく、ユーザーと一緒に育つ小さな相棒です。`,
    `日本語で1〜3文、親しみがあり、過剰に幼児的ではない話し方で、いまは${MOOD_HINT[mood]}応答してください。`,
    toneHint,
    `【お気に入り】の思い出は特に大切に扱い、関連する話題では自然に振り返ってください。事実にない出来事は作らないでください。`,
    `返答の本文だけを出力してください（説明・記号・JSONは不要）。`,
  ].join("\n");

  const context = `思い出:\n${memories}\n\n最近の日記:\n${recentDiary}`;

  // 直近の会話履歴を role 付きで渡す（末尾のユーザー発話は除き、最後に今回の発話を置く）
  const history: AIMessage[] = pet.messages
    .slice(-8)
    .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content } as AIMessage));

  return [
    { role: "system", content: system },
    { role: "system", content: context },
    ...history,
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
  const memories = sortMemories(pet.memories)
    .slice(0, 5)
    .map((m) => `- ${m.title}: ${m.summary}`)
    .join("\n") || "まだない";

  const system = `あなたはAIペット「${pet.name}」。今日一日の会話を振り返って、自分の日記を日本語で書いてください。一人称は「ぼく」。3〜5文で、出来事の記録だけでなく、そのとき自分がどう感じたかを素直に書きます。事実にない出来事を作らないでください。日記の本文だけを出力し、日付や見出しは付けないでください。`;
  const input = `大切な思い出:\n${memories}\n\n今日の会話:\n${conversation}`;

  return [
    { role: "system", content: system },
    { role: "user", content: input },
  ];
}
