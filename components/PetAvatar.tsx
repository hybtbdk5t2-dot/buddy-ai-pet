import type { Mood } from "@/lib/types";

// ゲームの気分(6種) → ロボットの表情ファイル。
// ロボットには専用の表情画像があり、緑背景を透過処理して切り出してある。
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
  return (
    <div className={`buddy buddy-${mood}`} aria-label={`Buddyの気分: ${moodLabel[mood]}`}>
      <div className="buddy-shadow-el" aria-hidden />
      <img className="buddy-img" src={`/characters/${character}/${expr}.png`} alt="" draggable={false} />
    </div>
  );
}
