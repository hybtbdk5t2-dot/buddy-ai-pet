import type { AIMessage, GenerateOptions } from "../types";

// OpenAI互換の /chat/completions を叩く共通ヘルパー。
// OpenAI・OpenRouter・多くのローカルLLMサーバー（Ollama, LM Studio, vLLM 等）で共用できる。
export async function chatCompletions(params: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  messages: AIMessage[];
  extraHeaders?: Record<string, string>;
  options?: GenerateOptions;
}): Promise<string> {
  const { baseUrl, apiKey, model, messages, extraHeaders, options } = params;
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 400,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI応答エラー ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("空の応答が返されました");
  return text;
}
