"use client";

import { useState } from "react";
import { characterImage } from "@/lib/character-catalog";
import type { Mood } from "@/lib/types";

const moodLabel: Record<Mood, string> = {
  normal: "ふつう", happy: "うれしい", thinking: "かんがえ中", sleepy: "ねむい", lonely: "さみしい", surprised: "びっくり",
};

export function PetAvatar({ mood, character = "robot" }: { mood: Mood; level?: number; character?: string }) {
  const [poking, setPoking] = useState(false);
  const [sparkle, setSparkle] = useState(0);

  function poke() {
    setPoking(true);
    setSparkle((n) => n + 1);
  }

  return (
    <div className={`buddy buddy-${mood}`} aria-label={`Buddyの気分: ${moodLabel[mood]}`}>
      <div className="buddy-shadow-el" aria-hidden />
      <img
        className={`buddy-img${poking ? " poking" : ""}`}
        src={characterImage(character, mood)}
        alt=""
        draggable={false}
        onClick={poke}
        onAnimationEnd={() => poking && setPoking(false)}
      />
      {sparkle > 0 && (
        <span className="poke-fx" key={sparkle} aria-hidden>
          <i>✦</i><i>✧</i><i>˖</i>
        </span>
      )}
    </div>
  );
}
