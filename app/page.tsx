"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PetAvatar } from "@/components/PetAvatar";
import { BG_PRESETS, DEFAULT_BACKGROUND, RoomBackground } from "@/components/RoomBackground";
import { CHARACTERS } from "@/lib/characters";
import { evolutionStage, sortMemories, todayKey } from "@/lib/engagement";
import { detectLevelChange, processVisit } from "@/lib/engine/events";
import { appendUserMessage, applyChatError, applyChatResult, applyDiaryBody } from "@/lib/engine/reducer";
import { validatePet } from "@/lib/engine/validate";
import { driftEmotion, emotionLabel, ensurePersona, generateCurrentLife, syncPersonaToCharacter } from "@/lib/persona/engine";
import type { BackgroundSetting, ChatResult, PetState } from "@/lib/types";

const STORAGE_KEY = "buddy-ai-pet-v01";
const initialState: PetState = {
  name: "Buddy",
  level: 1,
  experience: 0,
  affection: 5,
  mood: "happy",
  personality: { music: 0, movement: 0, knowledge: 0, kindness: 1, curiosity: 1 },
  character: "robot",
  messages: [{ id: "welcome", role: "assistant", content: "はじめまして。今日から、君と一緒に育っていきたい。まずは今日のことを聞かせて？", createdAt: new Date().toISOString() }],
  memories: [],
  diary: [],
};

const uid = () => crypto.randomUUID();

const TRAIT_META: Record<string, [string, string]> = {
  music: ["🎵", "音楽"], movement: ["🏃", "運動"], knowledge: ["📚", "知識"], kindness: ["💗", "優しさ"], curiosity: ["✨", "好奇心"],
};

// どのAIプロバイダーで会話しているかの表示（AIServiceのmodeに対応）
const MODE_LABEL: Record<string, string> = {
  openai: "OpenAIモード",
  gemini: "Geminiモード",
  claude: "Claudeモード",
  openrouter: "OpenRouterモード",
  local: "ローカルAIモード",
  template: "定型応答（AI節約中）",
  demo: "デモモード（AI未設定）",
  "demo-fallback": "接続に失敗したため、いまはデモモードで話しています",
};

type LevelUp = { level: number; title: string; evolved: boolean };

export default function Home() {
  const [pet, setPet] = useState<PetState>(initialState);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"chat" | "memories" | "diary" | "status">("chat");
  const [loading, setLoading] = useState(false);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [naming, setNaming] = useState<"hidden" | "input" | "born">("hidden");
  const [nameInput, setNameInput] = useState("");
  const [heartBurst, setHeartBurst] = useState(0);
  const [levelUp, setLevelUp] = useState<LevelUp | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; summary: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [bgPicker, setBgPicker] = useState(false);
  const [charPicker, setCharPicker] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const prevLevel = useRef(initialState.level);

  // 読み込み＋長期利用向けメタ情報の補完＋再訪あいさつ
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) { setNaming("input"); setHydrated(true); return; }
    let loaded: PetState;
    try { loaded = JSON.parse(saved) as PetState; } catch { setNaming("input"); setHydrated(true); return; }

    const today = todayKey();
    const visit = processVisit(loaded, today);

    // Persona Engine：新しい日は「留守中の暮らし」を生成し、感情を自然にドリフトさせる
    let persona = ensurePersona(loaded);
    let greeting = visit.greeting;
    if (visit.isNewDay) {
      const emotion = driftEmotion({ daysAway: visit.daysAway, streak: visit.streak, affection: loaded.affection });
      const currentLife = greeting ? generateCurrentLife({ ...persona, emotion }, visit.daysAway) : persona.currentLife;
      persona = { ...persona, emotion, currentLife, emotionUpdatedAt: new Date().toISOString() };
      if (greeting && currentLife[0]) greeting = `${greeting} ……あ、留守のあいだ、${currentLife[0].text}んだ。`;
    }

    const withMeta: PetState = validatePet({
      ...loaded,
      bornAt: loaded.bornAt ?? loaded.messages?.[0]?.createdAt ?? new Date().toISOString(),
      streak: visit.streak,
      lastVisitDate: today,
      persona,
      ...(greeting
        ? {
            messages: [...loaded.messages, { id: uid(), role: "assistant", content: greeting, createdAt: new Date().toISOString() }],
            mood: visit.moodOverride ?? loaded.mood,
          }
        : {}),
    });
    prevLevel.current = withMeta.level; // ロードによるレベル変化を「レベルアップ」と誤検知しない
    setPet(withMeta);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || naming === "input") return; // 読み込み完了までは保存しない（初期状態での上書き防止）
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
    } catch {
      // 主に背景画像が大きすぎて保存容量を超えたケース。落とさず通知する。
      alert("データを保存できませんでした。背景画像が大きすぎる可能性があります。小さめの画像を選んでください。");
    }
  }, [pet, naming, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pet.messages.length]);

  // レベルアップ／進化の検知（読み込み完了後のみ。読み込みによる変化は演出しない）
  useEffect(() => {
    if (!hydrated) return;
    const event = detectLevelChange(prevLevel.current, pet.level);
    if (event && (event.type === "levelup" || event.type === "evolve")) {
      setLevelUp({ level: event.level, title: event.type === "evolve" ? event.title : evolutionStage(event.level).title, evolved: event.type === "evolve" });
    }
    prevLevel.current = pet.level;
  }, [pet.level, hydrated]);

  const progress = useMemo(() => pet.experience % 100, [pet.experience]);
  const stage = useMemo(() => evolutionStage(pet.level), [pet.level]);
  const sortedMemories = useMemo(() => sortMemories(pet.memories), [pet.memories]);
  const daysTogether = useMemo(() => {
    if (!pet.bornAt) return 1;
    return Math.max(1, Math.floor((Date.now() - new Date(pet.bornAt).getTime()) / 86400000) + 1);
  }, [pet.bornAt]);
  const persona = useMemo(() => ensurePersona(pet), [pet.persona, pet.character]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    // 状態更新はすべて Pet Engine 経由（検証込み）。まずユーザー発話を追加。
    const nextPet = appendUserMessage(pet, text);
    setPet(nextPet);

    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, pet: nextPet }) });
      if (!response.ok) throw new Error("返答を取得できませんでした");
      const result = (await response.json()) as ChatResult & { mode?: string };
      setMode(result.mode || null);
      if (result.affectionDelta > 0) setHeartBurst((n) => n + 1);
      // AIの結果は「提案」。エンジンが適用・検証して確定する。
      setPet((current) => applyChatResult(current, result));
    } catch {
      setPet((current) => applyChatError(current));
    } finally {
      setLoading(false);
    }
  }

  function completeNaming(event: FormEvent) {
    event.preventDefault();
    const name = nameInput.trim().slice(0, 12) || "Buddy";
    const now = new Date().toISOString();
    setPet((current) => ({
      ...current,
      name,
      bornAt: now,
      streak: 1,
      lastVisitDate: todayKey(),
      messages: [{ id: "welcome", role: "assistant", content: `${name}……うん、いい名前。今日から${name}として、君と一緒に育っていくよ。まずは今日のことを聞かせて？`, createdAt: now }],
    }));
    prevLevel.current = 1;
    setNaming("born");
    setTimeout(() => setNaming("hidden"), 2200);
  }

  async function writeDiary() {
    if (diaryLoading) return;
    setDiaryLoading(true);
    try {
      const response = await fetch("/api/diary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pet }) });
      if (!response.ok) throw new Error("日記を取得できませんでした");
      const result = (await response.json()) as { body: string; mode: string };
      setMode(result.mode);
      setPet((current) => applyDiaryBody(current, result.body));
    } catch {
      alert("日記をうまく書けなかったみたい。もう一度試してみてね。");
    } finally {
      setDiaryLoading(false);
    }
  }

  // ---- 思い出の管理 ----
  function togglePin(id: string) {
    setPet((c) => ({ ...c, memories: c.memories.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)) }));
  }
  function deleteMemory(id: string) {
    if (!confirm("この思い出を消しますか？")) return;
    setPet((c) => ({ ...c, memories: c.memories.filter((m) => m.id !== id) }));
    if (editing?.id === id) setEditing(null);
  }
  function saveEdit() {
    if (!editing) return;
    const title = editing.title.trim().slice(0, 40) || "無題の思い出";
    const summary = editing.summary.trim().slice(0, 300);
    setPet((c) => ({ ...c, memories: c.memories.map((m) => (m.id === editing.id ? { ...m, title, summary } : m)) }));
    setEditing(null);
  }

  // ---- データの保全・移行 ----
  function exportData() {
    const blob = new Blob([JSON.stringify(pet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buddy-${pet.name}-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as PetState;
        if (!data || typeof data.name !== "string" || !data.personality || !Array.isArray(data.messages)) {
          throw new Error("形式が違います");
        }
        if (!confirm(`「${data.name}」のバックアップを読み込みます。いまのデータは置き換わります。よろしいですか？`)) return;
        prevLevel.current = data.level;
        setPet({ ...data, lastVisitDate: todayKey(), streak: data.streak ?? 1 });
        setNaming("hidden");
        setTab("chat");
      } catch {
        alert("このファイルは読み込めませんでした。Buddyのバックアップ（.json）を選んでください。");
      }
    };
    reader.readAsText(file);
  }

  // ---- キャラクターの選択（見た目＋芯の口調が切り替わる。人格の芯も新キャラへ、感情や暮らしは引き継ぐ） ----
  function setCharacter(id: string) {
    setPet((c) => ({ ...c, character: id, persona: syncPersonaToCharacter(c.persona, id) }));
    setCharPicker(false);
  }

  // ---- 背景の設定 ----
  function setBackground(bg: BackgroundSetting) {
    setPet((c) => ({ ...c, background: bg }));
  }
  function chooseBackgroundImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("画像ファイルを選んでください。"); return; }
    resizeImage(file, 1280)
      .then((data) => { setBackground({ type: "image", data }); setBgPicker(false); })
      .catch(() => alert("この画像は読み込めませんでした。別の画像を試してください。"));
  }

  return (
    <main className="shell">
      {naming !== "hidden" && (
        <div className="naming-overlay">
          {naming === "input" ? (
            <form className="naming-card" onSubmit={completeNaming}>
              <div className="naming-egg">🥚</div>
              <h2>小さな相棒が生まれようとしている</h2>
              <p>名前を呼んであげると、目を覚ますよ。</p>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="なまえ（12文字まで）" maxLength={12} autoFocus />
              <button type="submit">この名前にする</button>
            </form>
          ) : (
            <div className="naming-card naming-born">
              <div className="naming-egg born">✨</div>
              <h2>{pet.name}が生まれた！</h2>
              <p>これから、たくさんの思い出をいっしょに。</p>
            </div>
          )}
        </div>
      )}

      {charPicker && (
        <div className="bg-picker-overlay" onClick={() => setCharPicker(false)}>
          <div className="bg-picker" onClick={(e) => e.stopPropagation()}>
            <div className="bg-picker-head">
              <h2>キャラクターをえらぶ</h2>
              <button className="bg-close" onClick={() => setCharPicker(false)} aria-label="閉じる">✕</button>
            </div>
            <p className="bg-picker-note">見た目と「芯の口調」が切り替わります。育てた個性や思い出はそのまま引き継がれます。</p>
            <div className="char-grid">
              {CHARACTERS.map((c) => {
                const active = (pet.character ?? "robot") === c.id;
                return (
                  <button key={c.id} className={`char-thumb ${active ? "active" : ""}`} onClick={() => setCharacter(c.id)}>
                    <span className="char-art"><img src={`/characters/${c.id}/happy.png`} alt="" /></span>
                    <b>{c.label}</b>
                    <small>{c.persona}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {bgPicker && (
        <div className="bg-picker-overlay" onClick={() => setBgPicker(false)}>
          <div className="bg-picker" onClick={(e) => e.stopPropagation()}>
            <div className="bg-picker-head">
              <h2>背景をえらぶ</h2>
              <button className="bg-close" onClick={() => setBgPicker(false)} aria-label="閉じる">✕</button>
            </div>
            <p className="bg-picker-note">ドット風のプリセット、または好きな画像を背景にできます。</p>
            <div className="bg-grid">
              {BG_PRESETS.map((preset) => {
                const activeBg = pet.background ?? DEFAULT_BACKGROUND;
                const active = activeBg.type === "preset" && activeBg.id === preset.id;
                return (
                  <button key={preset.id} className={`bg-thumb ${active ? "active" : ""}`} onClick={() => { setBackground({ type: "preset", id: preset.id }); setBgPicker(false); }}>
                    <span className={`bg bg-${preset.id}`}>
                      <span className="bg-photo" style={{ backgroundImage: `url(/backgrounds/${preset.id}.png)` }} />
                    </span>
                    <b>{preset.label}</b>
                  </button>
                );
              })}
              <button className={`bg-thumb upload ${pet.background?.type === "image" ? "active" : ""}`} onClick={() => bgFileRef.current?.click()}>
                {pet.background?.type === "image"
                  ? <span className="bg bg-image" style={{ backgroundImage: `url(${pet.background.data})` }} />
                  : <span className="bg bg-upload">＋</span>}
                <b>{pet.background?.type === "image" ? "変える" : "画像を選ぶ"}</b>
              </button>
            </div>
            <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={chooseBackgroundImage} />
          </div>
        </div>
      )}

      {levelUp && (
        <div className="levelup-overlay" onClick={() => setLevelUp(null)}>
          <div className="levelup-card">
            <div className="levelup-burst">{levelUp.evolved ? "🌟" : "🎉"}</div>
            <div className="eyebrow">{levelUp.evolved ? "しんか！" : "レベルアップ！"}</div>
            <h2>Lv.{levelUp.level}</h2>
            <p>{levelUp.evolved ? `${pet.name}は「${levelUp.title}」に成長した！` : `${pet.name}がまた少し大きくなった。`}</p>
            <button onClick={() => setLevelUp(null)}>やったね</button>
          </div>
        </div>
      )}

      <section className="app-card">
        <header className="topbar">
          <div>
            <div className="eyebrow">AI PET · {stage.title}</div>
            <h1>{pet.name}</h1>
          </div>
          <div className="level-box">
            {(pet.streak ?? 0) >= 2 && <span className="streak" title="連続来訪">🔥 {pet.streak}</span>}
            <strong>Lv.{pet.level}</strong>
            <span className="heart">♥ {pet.affection}</span>
          </div>
        </header>

        <div className="progress" aria-label="経験値"><div style={{ width: `${progress}%` }} /></div>

        <section className="room">
          <RoomBackground background={pet.background} />
          <PetAvatar mood={pet.mood} character={pet.character} />
          {heartBurst > 0 && (
            <div className="love-burst" key={heartBurst}><span>♥</span><span>♥</span><span>♥</span></div>
          )}
          <button className="char-btn" onClick={() => setCharPicker(true)} aria-label="キャラを変える" title="キャラを変える">🐾</button>
          <button className="bg-btn" onClick={() => setBgPicker(true)} aria-label="背景を変える" title="背景を変える">🖼</button>
          <div className={`speech ${loading ? "thinking" : ""}`}>
            {loading
              ? <span className="dots"><span>●</span><span>●</span><span>●</span></span>
              : pet.messages.filter((m) => m.role === "assistant").at(-1)?.content}
          </div>
        </section>

        <nav className="tabs">
          {([['chat','会話'],['memories','思い出'],['diary','日記'],['status','成長']] as const).map(([key,label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>

        <section className="panel">
          {tab === "chat" && <>
            <div className="messages">
              {pet.messages.slice(-20).map((message) => <div key={message.id} className={`message ${message.role}`}>{message.content}</div>)}
              <div ref={bottomRef} />
            </div>
            <form className="composer" onSubmit={sendMessage}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="今日あったことを話す…" maxLength={500} />
              <button disabled={loading || !input.trim()}>送る</button>
            </form>
            <p className="mode-note">{mode ? MODE_LABEL[mode] ?? mode : "APIキー未設定時はデモモード"}</p>
          </>}

          {tab === "memories" && <div className="cards">
            <h2>思い出の部屋</h2>
            {pet.memories.length === 0 ? <Empty emoji="🌱" text="大切な出来事を話すと、ここに残るよ。" /> : sortedMemories.map((m) => (
              <article key={m.id} className={m.pinned ? "pinned" : ""}>
                {editing?.id === m.id ? (
                  <div className="mem-edit">
                    <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={40} placeholder="タイトル" />
                    <textarea value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} maxLength={300} rows={3} placeholder="どんな出来事？" />
                    <div className="mem-actions">
                      <button className="mem-save" onClick={saveEdit}>保存</button>
                      <button className="mem-cancel" onClick={() => setEditing(null)}>やめる</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <small>
                      {new Date(m.occurredAt).toLocaleDateString('ja-JP')} · 重要度 {m.importance}
                      {m.emotion && <span className="mem-emotion">{m.emotion}</span>}
                    </small>
                    <h3>{m.pinned && <span className="pin-mark">★</span>}{m.title}</h3>
                    <p>{m.summary}</p>
                    <div className="mem-actions">
                      <button onClick={() => togglePin(m.id)}>{m.pinned ? "★ 固定中" : "☆ お気に入り"}</button>
                      <button onClick={() => setEditing({ id: m.id, title: m.title, summary: m.summary })}>編集</button>
                      <button className="mem-del" onClick={() => deleteMemory(m.id)}>削除</button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>}

          {tab === "diary" && <div className="cards">
            <div className="cards-head"><h2>{pet.name}の日記</h2><button className="diary-write" onClick={writeDiary} disabled={diaryLoading}>{diaryLoading ? "書いている……" : "今日の日記を書いてもらう"}</button></div>
            {pet.diary.length === 0 ? <Empty emoji="📖" text={`今日の会話から、${pet.name}が日記を書くよ。`} /> : pet.diary.map((d) => <article key={d.id}><small>{d.date}</small><p className="diary-body">{d.body}</p></article>)}
          </div>}

          {tab === "status" && <div className="status">
            <div className="persona-card">
              <div className="persona-now">いまの気分 <b>{emotionLabel(persona.emotion)}</b></div>
              <div className="persona-sec">
                <h3>🌟 {pet.name}のゆめ</h3>
                <ul>{persona.dreams.map((d, i) => <li key={i}>{d.text}</li>)}</ul>
              </div>
              {persona.currentLife.length > 0 && (
                <div className="persona-sec">
                  <h3>🏠 さいきんの暮らし</h3>
                  <ul>{persona.currentLife.slice(0, 4).map((l, i) => <li key={i}>{l.text}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="evo-card">
              <div className="evo-stage">{"●".repeat(stage.stage)}{"○".repeat(5 - stage.stage)}</div>
              <div className="evo-title">{stage.title}</div>
              <div className="evo-sub">{stage.next ? `あと Lv.${stage.next} でつぎの段階へ` : "最終段階に到達"}</div>
              <div className="evo-meta">
                <span>🔥 {pet.streak ?? 1}日連続</span>
                <span>🎂 一緒に {daysTogether} 日目</span>
              </div>
            </div>

            <h2>育っている個性</h2>
            {Object.entries(pet.personality).map(([key, value]) => {
              const meta = TRAIT_META[key];
              return <div className="stat" key={key}><span className="stat-label">{meta[0]} {meta[1]}</span><div className="bar"><i style={{ width: `${value}%` }} /></div><b>{value}</b></div>;
            })}
            <p className="trait-note">話す内容にあわせて、個性は伸びたり少し下がったりします。</p>

            <div className="data-tools">
              <h3>データの保全</h3>
              <p>思い出はこの端末に保存されます。ときどき書き出して、大切に残しておきましょう。</p>
              <div className="data-buttons">
                <button className="data-export" onClick={exportData}>⬇ バックアップを書き出す</button>
                <button className="data-import" onClick={() => fileRef.current?.click()}>⬆ バックアップから復元</button>
              </div>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
            </div>
          </div>}
        </section>
      </section>
    </main>
  );
}

function Empty({ text, emoji = "✦" }: { text: string; emoji?: string }) {
  return <div className="empty"><div className="emoji">{emoji}</div><p>{text}</p></div>;
}

// 画像を読み込み、大きすぎる写真だけ縮小して保存サイズを抑える。
// 小さな画像（ドット絵など）はそのまま返して質感を保つ。
function resizeImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error("decode error"));
      img.onload = () => {
        const { width, height } = img;
        if (width <= maxDim && height <= maxDim) { resolve(src); return; }
        const scale = maxDim / Math.max(width, height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(src); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
