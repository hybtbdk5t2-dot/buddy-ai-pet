import type { AIMessage, AIProvider, GenerateOptions } from "../types";

// Anthropic Claude（Messages API）。systemは独立パラメータ、rolesはuser/assistantのみ。
export class ClaudeProvider implements AIProvider {
  readonly id = "claude";
  readonly model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  private readonly apiKey = process.env.ANTHROPIC_API_KEY;
  private readonly baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generate(messages: AIMessage[], options?: GenerateOptions): Promise<string> {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const conv = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options?.maxTokens ?? 400,
        temperature: options?.temperature ?? 0.8,
        ...(system ? { system } : {}),
        messages: conv,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Claude応答エラー ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim();
    if (!text) throw new Error("空の応答が返されました");
    return text;
  }
}
