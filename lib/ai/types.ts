// AIプロバイダー共通のインターフェイス。
// UI・ゲームロジックはこの層より下（各Provider）を直接知らない。

export type AIRole = "system" | "user" | "assistant";

export type AIMessage = {
  role: AIRole;
  content: string;
};

export type GenerateOptions = {
  temperature?: number;
  maxTokens?: number;
  /** このリクエストだけモデルを上書きする（ルーターのtier→モデル切替で使用） */
  model?: string;
};

export interface AIProvider {
  /** "openai" | "gemini" | "claude" | "openrouter" | "local" など */
  readonly id: string;
  /** 実際に使うモデル名（表示・キャッシュキー用） */
  readonly model: string;
  /** 必要な環境変数がそろっていて利用可能か */
  isConfigured(): boolean;
  /** メッセージ列からアシスタントの応答テキストを生成する */
  generate(messages: AIMessage[], options?: GenerateOptions): Promise<string>;
}
