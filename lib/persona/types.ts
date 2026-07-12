// Persona Engine（人格エンジン）のデータモデル。
// 人格はアプリが保持する。AIはこの人格を「表現」するだけで、人格を決めない。
// AIモデル（GPT/Claude/Gemini/ローカル）が変わっても、この人格は変わらない。

/** 現在の短期的な感情（時間経過で自然に変化） */
export type Emotion = "happy" | "calm" | "lonely" | "excited" | "anxious" | "tired";

/** Core：変化しにくい人格の芯 */
export type PersonaCore = {
  firstPerson: string; // 一人称（ぼく/わたし/オレ…）
  userCall: string; // ユーザーの呼び方（きみ/あなた/相棒…）
  basePersonality: string; // 基本性格
  beliefs: string; // 信念
  likes: string[]; // 好きなもの
  dislikes: string[]; // 苦手なもの
};

/** Buddy自身の夢・目標（時間をかけて成長する） */
export type Dream = { text: string; progress: number };

/** 留守中の暮らしの記録（Persona Engineが生成する） */
export type LifeEntry = { text: string; at: string };

export type Persona = {
  core: PersonaCore;
  emotion: Emotion;
  interests: Record<string, number>; // 音楽/読書/運動/料理/ゲーム… 会話で増減
  dreams: Dream[];
  currentLife: LifeEntry[]; // 最近の暮らし（新しい順）
  emotionUpdatedAt?: string; // 感情の最終更新（時間ドリフト用）
};
