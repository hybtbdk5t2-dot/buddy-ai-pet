import { describe, expect, it } from "vitest";
import { validatePet } from "./validate";
import type { PetState } from "../types";

describe("validatePet", () => {
  it("clamps imported values and derives the level from experience", () => {
    const unsafe = {
      name: "Buddy",
      level: 99,
      experience: 250,
      affection: 999,
      mood: "unknown",
      personality: { music: -10, movement: 150, knowledge: 4, kindness: 5, curiosity: 6 },
      messages: [], memories: [], diary: [], character: "dog",
    } as unknown as PetState;

    const pet = validatePet(unsafe);
    expect(pet.level).toBe(3);
    expect(pet.affection).toBe(100);
    expect(pet.mood).toBe("normal");
    expect(pet.personality.music).toBe(0);
    expect(pet.personality.movement).toBe(100);
    expect(pet.character).toBe("dog");
  });
});
