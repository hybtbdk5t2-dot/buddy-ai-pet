import OpenAI from "openai";
import { NextResponse } from "next/server";
import { demoDiary } from "@/lib/demo";
import type { PetState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { pet?: PetState };
  if (!body.pet) {
    return NextResponse.json({ error: "pet が必要です" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaysMessages = body.pet.messages.filter((m) => m.createdAt.slice(0, 10) === today);
  const todaysUserMessages = todaysMessages.filter((m) => m.role === "user").map((m) => m.content);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ body: demoDiary(body.pet, todaysUserMessages), mode: "demo" });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const conversation = todaysMessages
    .slice(-24)
    .map((m) => `${m.role === "user" ? "ユーザー" : body.pet!.name}: ${m.content}`)
    .join("\n") || "（今日はまだ会話がない）";
  const memories = [...body.pet.memories]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5)
    .map((m) => `- ${m.title}: ${m.summary}`)
    .join("\n") || "まだない";

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `あなたはAIペット「${body.pet.name}」。今日一日の会話を振り返って、自分の日記を日本語で書いてください。一人称は「ぼく」。3〜5文で、出来事の記録だけでなく、そのとき自分がどう感じたかを素直に書きます。事実にない出来事を作らないでください。日記の本文だけを出力し、日付や見出しは付けないでください。`,
      input: `現在: Lv.${body.pet.level}, 親密度${body.pet.affection}, 気分${body.pet.mood}\n大切な思い出:\n${memories}\n今日の会話:\n${conversation}`,
    });

    const text = response.output_text.trim();
    if (!text) throw new Error("空の日記が返されました");
    return NextResponse.json({ body: text, mode: "openai" });
  } catch (error) {
    console.error("OpenAI呼び出しに失敗したためデモモードで日記を書きます", error);
    return NextResponse.json({ body: demoDiary(body.pet, todaysUserMessages), mode: "demo-fallback" });
  }
}
