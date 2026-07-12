# Buddy — 会話と思い出で育つAIペット

動作するMVPです。会話、経験値・親密度、個性、重要な思い出、Buddy自身の日記をブラウザ内に保存します。

## 起動

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## OpenAI連携

`.env.local` に以下を設定します。

```env
OPENAI_API_KEY=あなたのAPIキー
OPENAI_MODEL=gpt-4.1-mini
```

APIキーが空の場合でも、ルールベースのデモモードで一通り動作します。APIキーはブラウザへ送られず、Next.jsのサーバールートだけで利用されます。API呼び出しに失敗した場合も、自動的にデモモードへフォールバックして会話を続けられます。

## 主な機能

- **会話** — ChatGPT (OpenAI Responses API) がBuddyとして応答し、気分・経験値・親密度・個性が変化します
- **思い出** — 重要な出来事だけをBuddyが選んで記憶し、以降の会話で重要度順に参照します
- **日記** — 会話ごとの一言に加えて、「今日の日記を書いてもらう」ボタンでChatGPTがその日の会話全体からBuddy視点の日記を書きます
- **命名・誕生演出** — 初回起動時に名前をつけると、Buddyが目を覚まします

## 現在の保存方式

MVPでは `localStorage` を利用しています。本番化ではSupabase/PostgreSQLへ移行し、認証、複数端末同期、ベクトル検索による長期記憶を追加してください。

## 次に追加する候補

- Supabase認証とクラウド保存
- 季節・時間帯・放置時間による状態変化
- 進化分岐と部屋のアイテム
- 音声会話
- Notion / Google Calendar連携
