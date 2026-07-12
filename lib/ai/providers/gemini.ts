import type { AIMessage, AIProvider, GenerateOptions } from "../types";

// Google Gemini（Generative Language API）。REST形状がOpenAIと異なるため個別実装。
export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly baseUrl = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          maxOutputTokens: options?.maxTokens ?? 400,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini応答エラー ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) throw new Error("空の応答が返されました");
    return text;
  }
}
