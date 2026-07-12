// AIコール削減のための、サーバー内メモリTTLキャッシュ（LRU風）。
// 同じ入力（同一プロバイダー・モデル・メッセージ列）への連続コールを間引く。
// 注意: サーバープロセス内でのみ有効。サーバーレスではインスタンスごと・短命だが、
// 連続リクエストのバースト抑制には十分に効く。

type Entry = { value: string; expires: number };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 200;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5分

// 依存を増やさない軽量ハッシュ（衝突耐性は不要、鍵短縮のみが目的）
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + ":" + input.length.toString(36);
}

export function cacheKey(parts: (string | number)[]): string {
  return hash(parts.join(""));
}

export function getCached(key: string): string | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return null;
  }
  // LRU: 参照されたものを末尾へ
  store.delete(key);
  store.set(key, hit);
  return hit.value;
}

export function setCached(key: string, value: string, ttlMs = DEFAULT_TTL_MS): void {
  if (store.has(key)) store.delete(key);
  store.set(key, { value, expires: Date.now() + ttlMs });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}
