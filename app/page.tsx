"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PetAvatar } from "@/components/PetAvatar";
import type { ChatResult, DiaryEntry, Memory, Message, PetState } from "@/lib/types";

const STORAGE_KEY = "buddy-ai-pet-v01";
const initialState: PetState = {
  name: "Buddy",
  level: 1,
  experience: 0,
  affection: 5,
  mood: "happy",
  personality: { music: 0, movement: 0, knowledge: 0, kindness: 1, curiosity: 1 },
  messages: [{ id: "welcome", role: "assistant", content: "はじめまして。今日から、君と一緒に育っていきたい。まずは今日のことを聞かせて？", createdAt: new Date().toISOString() }],
  memories: [],
  diary: [],
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const uid = () => crypto.randomUUID();

export default function Home() {
  const [pet, setPet] = useState<PetState>(initialState);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"chat" | "memories" | "diary" | "status">("chat");
  const [loading, setLoading] = useState(false);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [mode, setMode] = useState<"demo" | "openai" | "demo-fallback" | null>(null);
  const [naming, setNaming] = useState<"hidden" | "input" | "born">("hidden");
  const [nameInput, setNameInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPet(JSON.parse(saved));
    else setNaming("input");
  }, []);

  useEffect(() => {
    if (naming === "input") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
  }, [pet, naming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pet.messages.length]);

  const progress = useMemo(() => pet.experience % 100, [pet.experience]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    const userMessage: Message = { id: uid(), role: "user", content: text, createdAt: new Date().toISOString() };
    const nextPet = { ...pet, messages: [...pet.messages, userMessage] };
    setPet(nextPet);

    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, pet: nextPet }) });
      if (!response.ok) throw new Error("返答を取得できませんでした");
      const result = (await response.json()) as ChatResult & { mode?: "demo" | "openai" | "demo-fallback" };
      setMode(result.mode || null);

      setPet((current) => {
        const totalExp = current.experience + result.experienceDelta;
        const level = Math.floor(totalExp / 100) + 1;
        const memory: Memory | null = result.memory?.shouldSave ? {
          id: uid(), title: result.memory.title, summary: result.memory.summary, emotion: result.memory.emotion,
          importance: result.memory.importance, occurredAt: new Date().toISOString()
        } : null;
        const today = new Date().toISOString().slice(0, 10);
        const existingDiary = current.diary.find((d) => d.date === today);
        let diary: DiaryEntry[] = current.diary;
        if (result.diaryLine) {
          diary = existingDiary
            ? current.diary.map((d) => d.id === existingDiary.id ? { ...d, body: `${d.body}\n${result.diaryLine}` } : d)
            : [{ id: uid(), date: today, body: result.diaryLine }, ...current.diary];
        }
        const assistantMessage: Message = { id: uid(), role: "assistant", content: result.reply, createdAt: new Date().toISOString() };
        const p = result.personalityDelta || {};
        return {
          ...current,
          level,
          experience: totalExp,
          affection: clamp(current.affection + result.affectionDelta),
          mood: result.mood,
          personality: {
            music: clamp(current.personality.music + (p.music || 0)), movement: clamp(current.personality.movement + (p.movement || 0)),
            knowledge: clamp(current.personality.knowledge + (p.knowledge || 0)), kindness: clamp(current.personality.kindness + (p.kindness || 0)),
            curiosity: clamp(current.personality.curiosity + (p.curiosity || 0)),
          },
          messages: [...current.messages, assistantMessage],
          memories: memory ? [memory, ...current.memories].slice(0, 50) : current.memories,
          diary,
        };
      });
    } catch {
      setPet((current) => ({ ...current, mood: "lonely", messages: [...current.messages, { id: uid(), role: "assistant", content: "うまく言葉が出てこなかった……。もう一度だけ話しかけてもらえる？", createdAt: new Date().toISOString() }] }));
    } finally {
      setLoading(false);
    }
  }

  function completeNaming(event: FormEvent) {
    event.preventDefault();
    const name = nameInput.trim().slice(0, 12) || "Buddy";
    setPet((current) => ({
      ...current,
      name,
      messages: [{ id: "welcome", role: "assistant", content: `${name}……うん、いい名前。今日から${name}として、君と一緒に育っていくよ。まずは今日のことを聞かせて？`, createdAt: new Date().toISOString() }],
    }));
    setNaming("born");
    setTimeout(() => setNaming("hidden"), 2200);
  }

  async function writeDiary() {
    if (diaryLoading) return;
    setDiaryLoading(true);
    try {
      const response = await fetch("/api/diary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pet }) });
      if (!response.ok) throw new Error("日記を取得できませんでした");
      const result = (await response.json()) as { body: string; mode: "demo" | "openai" | "demo-fallback" };
      setMode(result.mode);
      setPet((current) => {
        const today = new Date().toISOString().slice(0, 10);
        const existing = current.diary.find((d) => d.date === today);
        const diary: DiaryEntry[] = existing
          ? current.diary.map((d) => (d.id === existing.id ? { ...d, body: result.body } : d))
          : [{ id: uid(), date: today, body: result.body }, ...current.diary];
        return { ...current, diary };
      });
    } catch {
      alert("日記をうまく書けなかったみたい。もう一度試してみてね。");
    } finally {
      setDiaryLoading(false);
    }
  }

  function reset() {
    if (confirm("Buddyとの思い出をすべてリセットしますか？")) {
      localStorage.removeItem(STORAGE_KEY);
      setPet(initialState);
      setNameInput("");
      setNaming("input");
    }
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
      <section className="app-card">
        <header className="topbar">
          <div><div className="eyebrow">AI PET</div><h1>{pet.name}</h1></div>
          <div className="level-box"><strong>Lv.{pet.level}</strong><span>♥ {pet.affection}</span></div>
        </header>

        <div className="progress" aria-label="経験値"><div style={{ width: `${progress}%` }} /></div>

        <section className="room">
          <div className="window"><span>☁</span><span>✦</span></div>
          <div className="plant">♧</div>
          <PetAvatar mood={pet.mood} level={pet.level} />
          <div className="rug" />
          <div className="speech">{loading ? "考え中……" : pet.messages.filter((m) => m.role === "assistant").at(-1)?.content}</div>
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
            <p className="mode-note">{mode === "openai" ? "OpenAIモード" : mode === "demo-fallback" ? "接続に失敗したため、いまはデモモードで話しています" : "APIキー未設定時はデモモード"}</p>
          </>}

          {tab === "memories" && <div className="cards"><h2>思い出の部屋</h2>{pet.memories.length === 0 ? <Empty text="大切な出来事を話すと、ここに残るよ。" /> : pet.memories.map((m) => <article key={m.id}><small>{new Date(m.occurredAt).toLocaleDateString('ja-JP')} · 重要度 {m.importance}</small><h3>{m.title}</h3><p>{m.summary}</p></article>)}</div>}
          {tab === "diary" && <div className="cards">
            <div className="cards-head"><h2>{pet.name}の日記</h2><button className="diary-write" onClick={writeDiary} disabled={diaryLoading}>{diaryLoading ? "書いている……" : "今日の日記を書いてもらう"}</button></div>
            {pet.diary.length === 0 ? <Empty text={`今日の会話から、${pet.name}が日記を書くよ。`} /> : pet.diary.map((d) => <article key={d.id}><small>{d.date}</small><p className="diary-body">{d.body}</p></article>)}
          </div>}
          {tab === "status" && <div className="status"><h2>育っている個性</h2>{Object.entries(pet.personality).map(([key,value]) => <div className="stat" key={key}><span>{({music:'音楽',movement:'運動',knowledge:'知識',kindness:'優しさ',curiosity:'好奇心'} as Record<string,string>)[key]}</span><div><i style={{width:`${value}%`}} /></div><b>{value}</b></div>)}<button className="reset" onClick={reset}>データをリセット</button></div>}
        </section>
      </section>
    </main>
  );
}

function Empty({ text }: { text: string }) { return <div className="empty">✦<p>{text}</p></div>; }
