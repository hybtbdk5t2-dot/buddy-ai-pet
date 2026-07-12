import { NextResponse } from "next/server";
import { activeProviderId, generateText } from "@/lib/ai";
import { buildDiaryMessages } from "@/lib/ai/prompt";
import { localDiary } from "@/lib/game";
import type { PetState } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { pet?: PetState };
  if (!body.pet) {
    return NextResponse.json({ error: "pet が必要です" }, { status: 400 });
  }
  const { pet } = body;

  const today = new Date().toISOString().slice(0, 10);
  const todaysUserMessages = pet.messages
    .filter((m) => m.createdAt.slice(0, 10) === today && m.role === "user")
    .map((m) => m.content);

  const providerId = activeProviderId();
  let text: string | null = null;
  if (providerId !== "demo") {
    const result = await generateText(buildDiaryMessages(pet));
    text = result?.text ?? null;
  }
  const mode = text ? providerId : providerId === "demo" ? "demo" : "demo-fallback";

  return NextResponse.json({
    body: text ?? localDiary(pet, todaysUserMessages),
    mode,
  });
}
