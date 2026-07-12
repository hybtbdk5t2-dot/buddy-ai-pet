import { NextResponse } from "next/server";
import { activeProviderId, generateText } from "@/lib/ai";
import { buildChatMessages } from "@/lib/ai/prompt";
import { analyzeMessage, fallbackReply } from "@/lib/game";
import type { PetState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string; pet?: PetState };
  if (!body.message || !body.pet) {
    return NextResponse.json({ error: "message と pet が必要です" }, { status: 400 });
  }
  const { message, pet } = body;

  // 1) 状態変化はすべてローカルのゲームロジックで算出（AIは使わない）
  const outcome = analyzeMessage(message, pet);

  // 2) 会話文だけをAI（プロバイダー抽象化レイヤー）で生成。未設定/失敗時はローカル応答。
  const providerId = activeProviderId();
  let reply: string | null = null;
  if (providerId !== "demo") {
    const result = await generateText(buildChatMessages(pet, message, outcome.mood));
    reply = result?.text ?? null;
  }
  const mode = reply ? providerId : providerId === "demo" ? "demo" : "demo-fallback";

  return NextResponse.json({
    ...outcome,
    reply: reply ?? fallbackReply(message, pet),
    mode,
  });
}
