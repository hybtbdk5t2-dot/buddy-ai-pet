export type Mood = "normal" | "happy" | "thinking" | "sleepy" | "lonely" | "surprised";

export type Memory = {
  id: string;
  title: string;
  summary: string;
  emotion: string;
  importance: number;
  occurredAt: string;
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
