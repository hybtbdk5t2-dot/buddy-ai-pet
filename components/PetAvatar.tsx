import type { Mood } from "@/lib/types";

export function PetAvatar({ mood, level }: { mood: Mood; level: number }) {
  const eyes = mood === "happy" ? "⌒" : mood === "sleepy" ? "—" : mood === "surprised" ? "○" : "●";
  const mouth = mood === "happy" ? "◡" : mood === "lonely" ? "︵" : mood === "surprised" ? "o" : mood === "thinking" ? "~" : "ᴗ";
  return (
    <div className={`pet pet-${mood}`} aria-label={`Buddyの気分: ${mood}`}>
      {level >= 5 && <div className="pet-sprout">✦</div>}
      <div className="ear ear-left" />
      <div className="ear ear-right" />
      <div className="pet-face">
        <span>{eyes}</span><span>{eyes}</span>
      </div>
      <div className="pet-mouth">{mouth}</div>
      <div className="pet-blush blush-left" />
      <div className="pet-blush blush-right" />
    </div>
  );
}
