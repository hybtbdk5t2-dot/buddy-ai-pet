"use client";

import { useState } from "react";
import type { Mood } from "@/lib/types";

// ゲームの気分(6種) → キャラの表情ファイル。
// （lonely に対応する表情が無いため、当面は「戸惑う(confused)」を割り当て）
const MOOD_TO_EXPR: Record<Mood, string> = {
  normal: "normal",
  happy: "happy",
  thinking: "question",
  surprised: "surprised",
  sleepy: "sleepy",
  lonely: "confused",
};

const moodLabel: Record<Mood, string> = {
  normal: "ふつう", happy: "うれしい", thinking: "かんがえ中", sleepy: "ねむい", lonely: "さみしい", surprised: "びっくり",
};

export function PetAvatar({ mood, character = "robot" }: { mood: Mood; level?: number; character?: string }) {
  const expr = MOOD_TO_EXPR[mood] ?? "normal";
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
        src={`/characters/${character}/${expr}.png`}
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
