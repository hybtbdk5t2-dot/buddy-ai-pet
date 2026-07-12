import registry from "@/prompts/registry.json";

// プロンプトは prompts/registry.json（外部ファイル）で管理する。
// ビルド時に同梱（import）するため、ローカルでもクラウド（Vercel等）でも確実に読める。
// - version フィールドでバージョン管理
// - AI_PROMPT_VARIANT=B で "{id}__B" のバリアントを使えばA/Bテスト可能

type PromptEntry = { version: string; template: string };
const REG = registry as Record<string, PromptEntry>;

function resolveEntry(id: string): PromptEntry {
  const variant = process.env.AI_PROMPT_VARIANT;
  const entry = (variant && REG[`${id}__${variant}`]) || REG[id];
  if (!entry) throw new Error(`prompt "${id}" が prompts/registry.json に見つかりません`);
  return entry;
}

/** {var} をコンテキストで置換してプロンプト文字列を返す */
export function renderPrompt(id: string, vars: Record<string, string | number> = {}): string {
  const entry = resolveEntry(id);
  return entry.template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

export function promptVersion(id: string): string {
  return resolveEntry(id).version;
}
