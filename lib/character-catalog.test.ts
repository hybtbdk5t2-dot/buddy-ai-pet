import { describe, expect, it } from "vitest";
import { CHARACTER_CATALOG, characterImage, characterVoiceLine, getCharacterDefinition } from "./character-catalog";
import { defaultPersona } from "./persona/defaults";
import { syncPersonaToCharacter } from "./persona/engine";
import { fallbackReply } from "./game";
import type { PetState } from "./types";

describe("character catalog", () => {
  it("offers six unique character choices", () => {
    expect(CHARACTER_CATALOG).toHaveLength(6);
    expect(new Set(CHARACTER_CATALOG.map((character) => character.id)).size).toBe(6);
  });

  it("keeps the dog unmistakably hot-blooded", () => {
    const dog = getCharacterDefinition("dog");
    expect(dog.persona).toBe("熱血");
    expect(dog.baseTone).toContain("熱血");
    expect(dog.core.firstPerson).toBe("オレ");
    expect(dog.core.userCall).toBe("相棒");
    expect(characterVoiceLine("dog", "welcome", "アツシ")).toContain("相棒");
    expect(characterVoiceLine("dog", "achievement", "アツシ")).toContain("最高");
    const pet = { name: "アツシ", character: "dog" } as PetState;
    expect(fallbackReply("今日はバク宙の練習をした", pet)).toContain("相棒");
  });

  it("uses a single illustration safely for characters without expression sets", () => {
    expect(characterImage("cool", "happy")).toBe("/buddies/cool.png");
    expect(characterImage("gentle", "sleepy")).toBe("/buddies/gentle.png");
    expect(characterImage("dog", "happy")).toBe("/characters/dog/happy.png");
  });

  it("switches the character core while preserving learned interests and emotion", () => {
    const grown = defaultPersona("owl");
    grown.emotion = "happy";
    grown.interests.music = 88;
    grown.currentLife = [{ text: "曲を聴いていた", at: "2026-07-13T00:00:00.000Z" }];

    const dog = syncPersonaToCharacter(grown, "dog");
    expect(dog.core.firstPerson).toBe("オレ");
    expect(dog.core.userCall).toBe("相棒");
    expect(dog.emotion).toBe("happy");
    expect(dog.interests.music).toBe(88);
    expect(dog.currentLife).toEqual(grown.currentLife);
  });
});
