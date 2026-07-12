import type { PetState } from "../types";

// 個性値による「話し方の補正」。
// 芯（キャラクター固有の口調）は変えず、その上に育った個性のニュアンスを重ねる。
// 値が高い個性ほど、その傾向が会話ににじむ。

type Trait = keyof PetState["personality"];

const TRAIT_CORRECTION: Record<Trait, string> = {
  music: "音・リズム・響きにまつわる比喩が自然と増える",
  movement: "前向きで行動的な言い回しが増える",
  knowledge: "情報を整理・分析し、確認の質問が増える",
  kindness: "共感と気遣いの言葉が増える",
  curiosity: "興味からの質問や、新しい提案が増える",
};

// この値以上の個性だけを「補正」として反映する（低い個性はにじませない）
const THRESHOLD = 30;

/** 育った個性から、口調補正の箇条書きを作る（芯は上書きしない） */
export function personalityCorrections(personality: PetState["personality"]): string {
  const active = (Object.entries(personality) as [Trait, number][])
    .filter(([, v]) => v >= THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => `- ${TRAIT_CORRECTION[t]}`);
  return active.length ? active.join("\n") : "";
}
