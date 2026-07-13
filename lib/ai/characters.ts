import { CHARACTER_CATALOG, DEFAULT_CHARACTER_ID, getCharacterDefinition } from "@/lib/character-catalog";

export type Character = { id: string; name: string; baseTone: string };

export function getCharacter(id?: string): Character {
  const character = getCharacterDefinition(id);
  return { id: character.id, name: character.label, baseTone: character.baseTone };
}

export function listCharacters(): Character[] {
  return CHARACTER_CATALOG.map((character) => ({ id: character.id, name: character.label, baseTone: character.baseTone }));
}

export { DEFAULT_CHARACTER_ID };
