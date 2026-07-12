// キャラクターのメタ情報（UI用・クライアントから参照可）。
// 芯の口調（baseTone）はサーバー側の prompts/characters.json で管理する。
// id は public/characters/{id}/ の画像フォルダ名と一致させる。

export type CharacterMeta = { id: string; label: string; persona: string };

export const CHARACTERS: CharacterMeta[] = [
  { id: "robot", label: "ロボット", persona: "無骨AI" },
  { id: "fairy", label: "ようせい", persona: "ふわふわ" },
  { id: "owl", label: "ふくろう", persona: "インテリ" },
  { id: "dog", label: "いぬ", persona: "熱血" },
];

export const DEFAULT_CHARACTER = "robot";
