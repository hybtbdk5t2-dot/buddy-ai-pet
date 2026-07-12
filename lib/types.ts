export type Mood = "normal" | "happy" | "thinking" | "sleepy" | "lonely" | "surprised";

// 背景設定：ドット風プリセット、または利用者がアップロードした画像
export type BackgroundSetting =
  | { type: "preset"; id: string }
  | { type: "image"; data: string };

export type Memory = {
  id: string;
  title: string;
  summary: string;
  emotion: string;
  importance: number;
  occurredAt: string;
  pinned?: boolean;
};

export type DiaryEntry = {
  id: string;
  date: string;
  body: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type PetState = {
  name: string;
  level: number;
  experience: number;
  affection: number;
  mood: Mood;
  personality: {
    music: number;
    movement: number;
    knowledge: number;
    kindness: number;
    curiosity: number;
  };
  messages: Message[];
  memories: Memory[];
  diary: DiaryEntry[];
  // 長期利用向けのメタ情報（既存データにない場合はロード時に補完）
  bornAt?: string;        // Buddyが生まれた日（ISO）
  lastVisitDate?: string; // 最後に会話した日（YYYY-MM-DD）
  streak?: number;        // 連続来訪日数
  background?: BackgroundSetting; // 部屋の背景（未設定なら既定のドット風プリセット）
  character?: string;     // 選択中のキャラクター（未設定なら robot）。芯の口調と見た目を決める
};

export type ChatResult = {
  reply: string;
  mood: Mood;
  experienceDelta: number;
  affectionDelta: number;
  personalityDelta: Partial<PetState["personality"]>;
  memory?: {
    shouldSave: boolean;
    title: string;
    summary: string;
    emotion: string;
    importance: number;
  };
  diaryLine?: string;
};
