import { NextResponse } from "next/server";
import { activeProviderId, generateText } from "@/lib/ai";
import { buildChatMessages } from "@/lib/ai/prompt";
import { classifyMessage } from "@/lib/ai/router";
import { analyzeMessage, fallbackReply } from "@/lib/game";
import type { PetState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string; pet?: PetState };
  if (!body.message || !body.pet) {
    return NextResponse.json({ error: "message と pet が必要です" }, { status: 400 });
  }
  const { message, pet } = body;
  const userId = request.headers.get("x-buddy-user") || "default";

  // 1) 状態変化はすべてローカルのゲームロジックで算出（AIは使わない・提案のみ）
  const outcome = analyzeMessage(message, pet);

  // 2) ルーターで「AIを使うか / どのモデル階層か」を判定（AI利用の最小化）
  const { intent, tier } = classifyMessage(message);

  let reply: string | null = null;
  let mode: string;

  if (tier === "template") {
    // 挨拶など定型で十分なものはAIを呼ばない（コスト削減）
    reply = fallbackReply(message, pet);
    mode = "template";
  } else {
    const result = await generateText(
      buildChatMessages(pet, message, outcome.mood, { story: intent === "story" }),
      { tier, userId },
    );
    reply = result?.text ?? null;
    mode = reply ? result!.providerId : activeProviderId() === "demo" ? "demo" : "demo-fallback";
  }

  return NextResponse.json({
    ...outcome,
    reply: reply ?? fallbackReply(message, pet),
    mode,
  });
}
