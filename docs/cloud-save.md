# 任意のクラウド保存

通常はこれまでどおり端末内に保存されます。Supabase を設定した場合だけ、メール認証後に同じ Buddy を別端末でも復元できます。

## 設定

1. Supabase の SQL Editor で `supabase/schema.sql` を実行する。
2. Authentication の Email ログインを有効にする。
3. `.env.local` に次を設定する。

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

4. Supabase の URL Configuration に公開先URLを登録する。

公開用キーはブラウザから見える前提のキーです。データは Row Level Security により、ログイン中の本人だけが読み書きできます。`service_role` キーは絶対に設定しないでください。

クラウド未設定・未ログイン・通信エラーの場合も、端末内保存は継続します。
