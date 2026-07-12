import OpenAI from "openai";
import { NextResponse } from "next/server";
import { demoReply } from "@/lib/demo";
import type { ChatResult, PetState } from "@/lib/types";

export const runtime = "nodejs";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "mood", "experienceDelta", "affectionDelta", "personalityDelta", "memory", "diaryLine"],
  properties: {
    reply: { type: "string" },
    mood: { type: "string", enum: ["normal", "happy", "thinking", "sleepy", "lonely", "surprised"] },
    experienceDelta: { type: "integer", minimum: 0, maximum: 10 },
    affectionDelta: { type: "integer", minimum: -2, maximum: 5 },
    personalityDelta: {
      type: "object",
      additionalProperties: false,
      required: ["music", "movement", "knowledge", "kindness", "curiosity"],
      properties: {
        music: { type: "integer", minimum: 0, maximum: 3 },
        movement: { type: "integer", minimum: 0, maximum: 3 },
        knowledge: { type: "integer", minimum: 0, maximum: 3 },
        kindness: { type: "integer", minimum: 0, maximum: 3 },
        curiosity: { type: "integer", minimum: 0, maximum: 3 }
      }
    },
    memory: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["shouldSave", "title", "summary", "emotion", "importance"],
          properties: {
            shouldSave: { type: "boolean" },
            title: { type: "string" },
            summary: { type: "string" },
            emotion: { type: "string" },
            importance: { type: "integer", minimum: 1, maximum: 10 }
          }
        }
      ]
    },
    diaryLine: { type: "string" }
  }
};

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string; pet?: PetState };
  if (!body.message || !body.pet) {
    return NextResponse.json({ error: "message と pet が必要です" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ...demoReply(body.message, body.pet), mode: "demo" });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const recentMessages = body.pet.messages.slice(-10).map((m) => `${m.role === "user" ? "ユーザー" : body.pet!.name}: ${m.content}`).join("\n");
  const memories = body.pet.memories.slice(0, 8).map((m) => `- ${m.title}: ${m.summary}`).join("\n") || "まだない";

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    instructions: `あなたはAIペット「${body.pet.name}」。便利なアシスタントではなく、ユーザーと一緒に育つ小さな相棒です。日本語で1〜3文、親しみがあり、過剰に幼児的ではない話し方をしてください。知ったふりをせず、重要な達成・決断・初体験だけを思い出候補にします。数値変化は控えめにしてください。`,
    input: `現在: Lv.${body.pet.level}, 親密度${body.pet.affection}, 気分${body.pet.mood}\n思い出:\n${memories}\n最近の会話:\n${recentMessages}\n\nユーザー: ${body.message}`,
    text: {
      format: {
        type: "json_schema",
        name: "buddy_chat_result",
        strict: true,
        schema
      }
    }
  });

  const result = JSON.parse(response.output_text) as ChatResult;
  return NextResponse.json({ ...result, mode: "openai" });
}
