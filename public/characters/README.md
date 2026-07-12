# キャラクター画像

`public/characters/{characterId}/{expression}.png` に、気分ごとの表情画像を置きます。
`components/PetAvatar.tsx` が現在の気分に対応する画像を表示します。

## robot（現在のデフォルト）

緑背景の表情シート（3×3）を透過処理して切り出したもの。9表情:

| ファイル | 意味 | ゲームの気分(mood) |
|---|---|---|
| normal.png | 通常 | normal |
| happy.png | にっこり | happy |
| excited.png | キラキラ | （予備：将来の「excited」用） |
| confused.png | 戸惑う | lonely（暫定） |
| question.png | 疑問 | thinking |
| surprised.png | 驚き | surprised |
| doubt.png | 疑い | （予備） |
| sleepy.png | 眠気 | sleepy |
| angry.png | 怒り | （予備：将来の「angry」用） |

気分→表情の対応は `components/PetAvatar.tsx` の `MOOD_TO_EXPR` で管理します。
新しいキャラクターを追加する場合は、同じ表情名で `public/characters/{id}/` に画像を置いてください。
