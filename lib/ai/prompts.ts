import fs from "fs";
import path from "path";

// プロンプトはコードに直書きせず、prompts/registry.json（外部ファイル）で管理する。
// - version フィールドでバージョン管理
// - AI_PROMPT_VARIANT=B で "{id}__B" のバリアントを使えばA/Bテスト可能
// 将来的にDB管理へ差し替える場合も、この loadRegistry() を置き換えるだけでよい。

type PromptEntry = { version: string; template: string };
type Registry = Record<string, PromptEntry>;

let cache: Registry | null = null;

function loadRegistry(): Registry {
  if (cache) return cache;
  const file = path.join(process.cwd(), "prompts", "registry.json");
  cache = JSON.parse(fs.readFileSync(file, "utf-8")) as Registry;
  return cache;
}

function resolveEntry(id: string): PromptEntry {
  const reg = loadRegistry();
  const variant = process.env.AI_PROMPT_VARIANT;
  const entry = (variant && reg[`${id}__${variant}`]) || reg[id];
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
