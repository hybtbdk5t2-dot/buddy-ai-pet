import charactersJson from "@/prompts/characters.json";

// キャラクターごとの「人格の芯（基本口調）」を prompts/characters.json で管理する。
// ビルド時に同梱（import）するため、ローカルでもクラウドでも確実に読める。
// 最終的な話し方 = この芯 ＋ 個性値による補正 ＋ 現在の気分
// 個性値が育っても、この芯は上書きしない（キャラの一貫性を守る）。

export type Character = { id: string; name: string; baseTone: string };

const REG = charactersJson as Record<string, Omit<Character, "id">>;

export const DEFAULT_CHARACTER_ID = "robot";

export function getCharacter(id?: string): Character {
  const key = id && REG[id] ? id : DEFAULT_CHARACTER_ID;
  return { id: key, name: REG[key].name, baseTone: REG[key].baseTone };
}

export function listCharacters(): Character[] {
  return Object.entries(REG).map(([id, v]) => ({ id, ...v }));
}
