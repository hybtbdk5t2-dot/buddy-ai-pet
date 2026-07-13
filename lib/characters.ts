import { CHARACTER_CATALOG, DEFAULT_CHARACTER_ID } from "./character-catalog";

export type CharacterMeta = { id: string; label: string; persona: string };

export const CHARACTERS: CharacterMeta[] = CHARACTER_CATALOG.map(({ id, label, persona }) => ({ id, label, persona }));
export const DEFAULT_CHARACTER = DEFAULT_CHARACTER_ID;
