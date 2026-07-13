"use client";

import { useEffect, useState } from "react";
import { characterExpressionImage, characterHasExpressions, characterImage } from "@/lib/character-catalog";
import type { Mood } from "@/lib/types";

const moodLabel: Record<Mood, string> = {
  normal: "ふつう", happy: "うれしい", thinking: "かんがえ中", sleepy: "ねむい", lonely: "さみしい", surprised: "びっくり",
};

export function PetAvatar({ mood, character = "robot" }: { mood: Mood; level?: number; character?: string }) {
  const hasExpr = characterHasExpressions(character);
  const [poking, setPoking] = useState(false);
  const [sparkle, setSparkle] = useState(0);

  // 通常は気分に応じた表情。タップ中（表情差分を持つ子）は「キラキラ(excited)」を一時表示。
  const targetSrc = poking && hasExpr ? characterExpressionImage(character, "excited") : characterImage(character, mood);

  // 表情の切り替えをクロスフェードで滑らかに（下=表示中 / 上=フェードインする新しい表情）
  const [baseSrc, setBaseSrc] = useState(targetSrc);
  const [topSrc, setTopSrc] = useState<string | null>(null);
  const [topShown, setTopShown] = useState(false);

  useEffect(() => {
    if (targetSrc === baseSrc) { setTopSrc(null); return; }
    setTopSrc(targetSrc);
    setTopShown(false);
  }, [targetSrc, baseSrc]);

  useEffect(() => {
    if (!topSrc) return;
    const r = requestAnimationFrame(() => setTopShown(true)); // マウント後にフェード開始
    return () => cancelAnimationFrame(r);
  }, [topSrc]);

  function commitTop() {
    if (topSrc) { setBaseSrc(topSrc); setTopSrc(null); setTopShown(false); }
  }

  return (
    <div className={`buddy buddy-${mood}`} aria-label={`Buddyの気分: ${moodLabel[mood]}`}>
      <div className="buddy-shadow-el" aria-hidden />
      <div
        className={`buddy-imgwrap${poking ? " poking" : ""}`}
        onClick={() => { setPoking(true); setSparkle((n) => n + 1); }}
        onAnimationEnd={() => poking && setPoking(false)}
      >
        <img className="buddy-img" src={baseSrc} alt="" draggable={false} />
        {topSrc && (
          <img
            className={`buddy-img buddy-img-top${topShown ? " shown" : ""}`}
            src={topSrc}
            alt=""
            draggable={false}
            onTransitionEnd={commitTop}
          />
        )}
      </div>
      {sparkle > 0 && (
        <span className="poke-fx" key={sparkle} aria-hidden>
          <i>✦</i><i>✧</i><i>˖</i>
        </span>
      )}
    </div>
  );
}
