import type { ChatResult, DiaryEntry, Memory, Message, PetState } from "../types";
import { validatePet } from "./validate";

// Pet Engine の状態更新（#3, #13）。
// AIの応答(ChatResult)は「提案」に過ぎず、経験値・親密度・記憶などの
// 最終的な状態更新はここ（アプリ側）で行い、必ず validatePet を通す。
// AIが直接ゲーム状態を書き換えることはない。

const uid = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

/** ユーザー発話を状態に追加する（送信直後に使用） */
export function appendUserMessage(pet: PetState, content: string): PetState {
  const userMessage: Message = { id: uid(), role: "user", content, createdAt: new Date().toISOString() };
  return { ...pet, messages: [...pet.messages, userMessage] };
}

/** AIの応答＋ローカル算出のデルタを適用して、検証済みの新しい状態を返す */
export function applyChatResult(pet: PetState, result: ChatResult): PetState {
  const experience = pet.experience + (result.experienceDelta || 0);
  const p = result.personalityDelta || {};

  const memory: Memory | null = result.memory?.shouldSave
    ? {
        id: uid(),
        title: result.memory.title,
        summary: result.memory.summary,
        emotion: result.memory.emotion,
        importance: result.memory.importance,
        occurredAt: new Date().toISOString(),
      }
    : null;

  const today = new Date().toISOString().slice(0, 10);
  let diary: DiaryEntry[] = pet.diary;
  if (result.diaryLine) {
    const existing = pet.diary.find((d) => d.date === today);
    diary = existing
      ? pet.diary.map((d) => (d.id === existing.id ? { ...d, body: `${d.body}\n${result.diaryLine}` } : d))
      : [{ id: uid(), date: today, body: result.diaryLine }, ...pet.diary];
  }

  const assistantMessage: Message = { id: uid(), role: "assistant", content: result.reply, createdAt: new Date().toISOString() };

  const next: PetState = {
    ...pet,
    experience,
    level: Math.floor(experience / 100) + 1,
    affection: clamp(pet.affection + (result.affectionDelta || 0)),
    mood: result.mood,
    personality: {
      music: clamp(pet.personality.music + (p.music || 0)),
      movement: clamp(pet.personality.movement + (p.movement || 0)),
      knowledge: clamp(pet.personality.knowledge + (p.knowledge || 0)),
      kindness: clamp(pet.personality.kindness + (p.kindness || 0)),
      curiosity: clamp(pet.personality.curiosity + (p.curiosity || 0)),
    },
    messages: [...pet.messages, assistantMessage],
    memories: memory ? [memory, ...pet.memories].slice(0, 100) : pet.memories,
    diary,
  };

  return validatePet(next);
}

/** 今日の日記本文を反映（生成ボタン） */
export function applyDiaryBody(pet: PetState, body: string): PetState {
  const today = new Date().toISOString().slice(0, 10);
  const existing = pet.diary.find((d) => d.date === today);
  const diary: DiaryEntry[] = existing
    ? pet.diary.map((d) => (d.id === existing.id ? { ...d, body } : d))
    : [{ id: uid(), date: today, body }, ...pet.diary];
  return validatePet({ ...pet, diary });
}

/** 会話に失敗したときの状態（さみしい表情＋一言） */
export function applyChatError(pet: PetState): PetState {
  const msg: Message = { id: uid(), role: "assistant", content: "うまく言葉が出てこなかった……。もう一度だけ話しかけてもらえる？", createdAt: new Date().toISOString() };
  return validatePet({ ...pet, mood: "lonely", messages: [...pet.messages, msg] });
}
