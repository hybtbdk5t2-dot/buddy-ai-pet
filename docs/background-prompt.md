# Buddy 背景生成プロンプト

別のAI（画像生成AI）に、Buddyのおへや背景（ドット絵）を作ってもらうためのプロンプト集です。
生成した画像は、アプリのおへや右上の 🖼 ボタン →「画像を選ぶ」からアップロードすると背景に設定できます。

---

## 技術仕様（この通りに作ってもらうと、きれいに収まります）

- **形式**: PNG
- **比率**: 横長 3:2（例 `960×640` px）。スマホでは中央を切り抜いて表示されるため、**大事な要素は中央〜やや上に置き、四隅は余白ぎみ**にする
- **画風**: ドット絵（ピクセルアート）。**低解像度で描いてから拡大**（例：`160×107` をニアレストネイバーで6倍）。アンチエイリアス（ぼかし）なし、輪郭くっきり
- **地面の位置**: 画面の **高さ55〜62%あたりに地平線／床の境目**（そこにBuddyが立ちます）
- **中央下は控えめに**: 中央下にBuddyが重なるので、その辺りは物を置かずシンプルに
- **入れないもの**: キャラクター・生き物、文字・ロゴ・UI・枠・透かし
- **シリーズで揃える**: 複数作るときは、同じ配色・光の向き・目線の高さ（正面のジオラマ視点）で統一

> アプリ側は拡大時もドットがくっきり見える設定（`image-rendering: pixelated`）です。低解像度のドット絵をそのまま渡してOKです。

---

## そのまま貼れるプロンプト（英語推奨・日本語訳つき）

### 基本テンプレート

```
Cozy 16-bit pixel art background for a virtual pet app room, front-facing diorama view.
{SCENE}. Soft pastel color palette, warm and gentle mood, limited palette (about 24 colors),
flat colors with crisp hard edges, no anti-aliasing, true low-resolution pixel art.
Horizon / floor line at ~58% height. Keep the lower-center area simple and uncluttered
(a character will stand there). Landscape 3:2. No characters, no creatures, no text,
no logo, no UI, no watermark, no border.
```

`{SCENE}` を下の候補に差し替えてください。

### シーン候補

1. **おへや（昼）**
   `A cute cozy pixel room: pastel wall, wooden floor, a small window with sunlight, a potted plant, a soft rug`
   （やさしい壁、木の床、日差しの入る小窓、鉢植え、ふわっとしたラグの小部屋）

2. **よぞら（夜の部屋）**
   `A calm night bedroom: deep indigo wall, wooden floor, a window showing a starry sky and a round moon, a warm lamp glow`
   （藍色の壁、木の床、星空と満月の見える窓、あたたかいランプの灯り）

3. **くさはら（草原）**
   `A gentle grassy meadow under a blue sky with a few pixel clouds, small flowers, distant soft hills`
   （青空と雲、小さな花、遠くのなだらかな丘がある草原）

4. **ゆうやけ（夕暮れ）**
   `A warm sunset scene: gradient sky in orange and pink, a big round setting sun, calm silhouette hills`
   （オレンジと桃色のグラデーション空、大きな夕日、静かな丘のシルエット）

5. **なぎさ（海辺）**
   `A quiet beach at dusk: pastel sky, calm sea, pixel waves, soft sand, a couple of seashells`
   （夕方の静かな浜辺、パステルの空、おだやかな海、砂浜、貝がら）

6. **まちのまど（部屋＋街の夜景）**
   `A cozy room at night with a large window overlooking a pixel city skyline with warm lit windows`
   （大きな窓から街の夜景が見えるあたたかい部屋）

---

## 使い方

1. 上のプロンプトで画像を生成（できれば同じシリーズで数枚）
2. Buddyを開き、おへや右上の **🖼** → **「画像を選ぶ」** で生成画像をアップロード
3. 気分で切り替えたいときは、また 🖼 から選び直せます

> 生成画像が横長すぎ／縦長すぎのときは、3:2 に近づけてトリミングしてからアップロードすると、切れずにきれいに収まります。

---

## 補足（開発者向け）

- 背景の描画は `components/RoomBackground.tsx`、設定の保存は `PetState.background`（`lib/types.ts`）。
- 現在は「同時に持てるカスタム背景は1枚」です。生成した複数の背景をアプリ内に保存して切り替えたい場合は、その拡張も可能です（要望があれば対応します）。
