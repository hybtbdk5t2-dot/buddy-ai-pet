import type { Persona } from "./types";
import { getCharacterDefinition } from "../character-catalog";

// キャラクターごとの初期人格（Core・夢・興味）。
// これは「芯」なので簡単には変化しない。会話で変化するのは stats/interests/emotion。

export function defaultPersona(characterId = "robot"): Persona {
  const base = getCharacterDefinition(characterId);
  return {
    core: { ...base.core, likes: [...base.core.likes], dislikes: [...base.core.dislikes] },
    emotion: "calm",
    interests: { ...base.interests },
    dreams: base.dreams.map((d) => ({ ...d })),
    currentLife: [],
  };
}
