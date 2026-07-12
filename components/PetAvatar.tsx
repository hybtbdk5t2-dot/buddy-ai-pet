import type { Mood } from "@/lib/types";

// 気分ごとの体のトーン（ベースはBuddyらしいラベンダーだがムードでほんのりシフトはCSS側で処理）
const moodLabel: Record<Mood, string> = {
  normal: "ふつう",
  happy: "うれしい",
  thinking: "かんがえ中",
  sleepy: "ねむい",
  lonely: "さみしい",
  surprised: "びっくり",
};

function Eyes({ mood }: { mood: Mood }) {
  // 笑顔・眠い・さみしいは「閉じ目/半目」なので瞬きさせない。
  if (mood === "happy") {
    return (
      <g stroke="#4a3b6b" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M70 96 q9 -12 18 0" />
        <path d="M112 96 q9 -12 18 0" />
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g stroke="#4a3b6b" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M70 98 q9 8 18 0" />
        <path d="M112 98 q9 8 18 0" />
      </g>
    );
  }
  if (mood === "lonely") {
    // しょんぼり眉（内側を上げる）＋うるっとした瞳＋涙
    return (
      <g>
        <g stroke="#4a3b6b" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M70 88 Q80 81 90 83" />
          <path d="M110 83 Q120 81 130 88" />
        </g>
        <circle cx="79" cy="101" r="7" fill="#3c2f5c" />
        <circle cx="121" cy="101" r="7" fill="#3c2f5c" />
        <circle cx="82" cy="98" r="2.4" fill="#fff" />
        <circle cx="124" cy="98" r="2.4" fill="#fff" />
        <path className="buddy-tear" d="M75 108 q-3 6 0 9 q3 -3 0 -9 z" fill="#7fc4f0" />
      </g>
    );
  }

  // normal / thinking / surprised は丸い瞳。瞬きアニメ付き。
  const big = mood === "surprised";
  const lookUp = mood === "thinking" ? -3 : 0;
  const r = big ? 11 : 9;
  return (
    <g className="buddy-eyes">
      <g transform={`translate(0 ${lookUp})`}>
        <circle cx="79" cy="98" r={r} fill="#3c2f5c" />
        <circle cx="121" cy="98" r={r} fill="#3c2f5c" />
        {/* ハイライト（きらめき） */}
        <circle cx="82.5" cy="94.5" r={big ? 3.4 : 3} fill="#fff" />
        <circle cx="124.5" cy="94.5" r={big ? 3.4 : 3} fill="#fff" />
        <circle cx="76" cy="101" r="1.6" fill="#fff" opacity="0.85" />
        <circle cx="118" cy="101" r="1.6" fill="#fff" opacity="0.85" />
      </g>
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "happy")
    return (
      <g>
        <path d="M89 116 q11 14 22 0 q-11 6 -22 0 z" fill="#4a3b6b" />
        <path d="M94 120 q6 6 12 0 z" fill="#ff8fa8" />
      </g>
    );
  if (mood === "surprised")
    return <ellipse cx="100" cy="119" rx="7" ry="9" fill="#4a3b6b" />;
  if (mood === "lonely")
    return <path d="M90 121 q10 -8 20 0" stroke="#4a3b6b" strokeWidth="4" fill="none" strokeLinecap="round" />;
  if (mood === "sleepy")
    return <ellipse cx="100" cy="118" rx="4.5" ry="5.5" fill="#4a3b6b" opacity="0.85" />;
  if (mood === "thinking")
    return <path d="M92 118 h12" stroke="#4a3b6b" strokeWidth="4" fill="none" strokeLinecap="round" />;
  // normal: やさしい微笑み
  return <path d="M89 115 q11 10 22 0" stroke="#4a3b6b" strokeWidth="4.5" fill="none" strokeLinecap="round" />;
}

export function PetAvatar({ mood, level }: { mood: Mood; level: number }) {
  return (
    <div className={`buddy buddy-${mood}`} aria-label={`Buddyの気分: ${moodLabel[mood]}`}>
      {/* 眠いときのZzz */}
      {mood === "sleepy" && (
        <div className="buddy-zzz" aria-hidden>
          <span>z</span><span>Z</span><span>z</span>
        </div>
      )}
      {/* うれしいときのきらきら */}
      {mood === "happy" && (
        <div className="buddy-sparkle" aria-hidden>
          <span>✧</span><span>✦</span><span>˖</span>
        </div>
      )}

      <svg viewBox="0 0 200 200" className="buddy-svg" role="img">
        <defs>
          <radialGradient id="buddyBody" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#c8b6ff" />
            <stop offset="60%" stopColor="#a98bf0" />
            <stop offset="100%" stopColor="#8f6fe0" />
          </radialGradient>
          <linearGradient id="buddyBelly" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdf4ff" />
            <stop offset="100%" stopColor="#f0e6ff" />
          </linearGradient>
        </defs>

        {/* 影 */}
        <ellipse className="buddy-shadow" cx="100" cy="180" rx="52" ry="11" fill="#6b4fb0" opacity="0.18" />

        {/* 全身（跳ねる） */}
        <g className="buddy-hop">
          {/* 足 */}
          <ellipse cx="78" cy="168" rx="15" ry="10" fill="#8f6fe0" />
          <ellipse cx="122" cy="168" rx="15" ry="10" fill="#8f6fe0" />
          {/* 耳 */}
          <path d="M60 60 q-14 -34 6 -44 q16 6 16 34 z" fill="url(#buddyBody)" />
          <path d="M140 60 q14 -34 -6 -44 q-16 6 -16 34 z" fill="url(#buddyBody)" />
          <path d="M64 52 q-8 -22 4 -30 q9 5 8 24 z" fill="#e7b8ff" opacity="0.7" />
          <path d="M136 52 q8 -22 -4 -30 q-9 5 -8 24 z" fill="#e7b8ff" opacity="0.7" />

          {/* 腕 */}
          <ellipse className="buddy-arm arm-l" cx="46" cy="120" rx="12" ry="17" fill="#9a79e8" />
          <ellipse className="buddy-arm arm-r" cx="154" cy="120" rx="12" ry="17" fill="#9a79e8" />

          {/* 体 */}
          <path
            d="M100 48
               C 150 48 162 88 162 116
               C 162 152 136 172 100 172
               C 64 172 38 152 38 116
               C 38 88 50 48 100 48 Z"
            fill="url(#buddyBody)"
          />
          {/* おなかの明るいパッチ */}
          <ellipse cx="100" cy="128" rx="40" ry="38" fill="url(#buddyBelly)" opacity="0.9" />

          {/* ほっぺ */}
          <ellipse className="buddy-cheek" cx="66" cy="112" rx="9" ry="6" fill="#ff9db6" opacity="0.7" />
          <ellipse className="buddy-cheek" cx="134" cy="112" rx="9" ry="6" fill="#ff9db6" opacity="0.7" />

          {/* 顔 */}
          <Eyes mood={mood} />
          <Mouth mood={mood} />

          {/* 成長でふえるアクセサリ */}
          {level >= 3 && (
            <g className="buddy-leaf">
              <path d="M100 44 q-4 -14 4 -20 q6 8 0 20 z" fill="#7ec98d" />
              <path d="M100 44 q4 -12 12 -14 q-2 10 -12 14 z" fill="#68b97a" />
            </g>
          )}
          {level >= 6 && (
            <g className="buddy-crown">
              <path d="M84 40 l6 -14 5 9 5 -13 5 13 5 -9 6 14 z" fill="#ffd35c" stroke="#f2b93a" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="100" cy="30" r="2.4" fill="#ff7aa8" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
