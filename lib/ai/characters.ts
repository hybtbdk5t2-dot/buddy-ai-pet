import fs from "fs";
import path from "path";

// キャラクターごとの「人格の芯（基本口調）」を外部ファイルで管理する。
// 最終的な話し方 = この芯 ＋ 個性値による補正 ＋ 現在の気分
// 個性値が育っても、この芯は上書きしない（キャラの一貫性を守る）。

export type Character = { id: string; name: string; baseTone: string };

let cache: Record<string, Omit<Character, "id">> | null = null;

function load(): Record<string, Omit<Character, "id">> {
  if (cache) return cache;
  const file = path.join(process.cwd(), "prompts", "characters.json");
  cache = JSON.parse(fs.readFileSync(file, "utf-8"));
  return cache!;
}

export const DEFAULT_CHARACTER_ID = "robot";

export function getCharacter(id?: string): Character {
  const reg = load();
  const key = id && reg[id] ? id : DEFAULT_CHARACTER_ID;
  return { id: key, name: reg[key].name, baseTone: reg[key].baseTone };
}

export function listCharacters(): Character[] {
  const reg = load();
  return Object.entries(reg).map(([id, v]) => ({ id, ...v }));
}
