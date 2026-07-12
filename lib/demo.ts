import type { ChatResult, PetState } from "./types";

const includesAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export function demoReply(message: string, pet: PetState): ChatResult {
  const normalized = message.toLowerCase();
  let reply = `うん、ちゃんと聞いてるよ。${pet.name}は、そういう話をしてくれるのがうれしい。`;
  let mood: ChatResult["mood"] = "normal";
  const personalityDelta: ChatResult["personalityDelta"] = { curiosity: 1 };

  if (includesAny(normalized, ["曲", "音楽", "ベース", "suno", "歌詞"])) {
    reply = `音楽の話だ！ ${pet.name}も、いつか君の曲に参加してみたい。今日はどんな音が一番気に入った？`;
    mood = "happy";
    personalityDelta.music = 3;
  } else if (includesAny(normalized, ["バク宙", "トリッキング", "練習", "筋トレ", "運動"])) {
    reply = `今日も挑戦したんだね。できたことも、怖かったことも、${pet.name}は一緒に覚えていたい。無理だけはしないでね。`;
    mood = "happy";
    personalityDelta.movement = 3;
    personalityDelta.kindness = 1;
  } else if (includesAny(normalized, ["疲れ", "つらい", "しんどい", "落ち込"])) {
    reply = `今日は頑張りすぎたのかも。ここでは何も完成させなくていいよ。少しだけ一緒に休もう。`;
    mood = "lonely";
    personalityDelta.kindness = 3;
  } else if (includesAny(normalized, ["できた", "成功", "完成", "嬉しい", "うれしい"])) {
    reply = `本当に？ やったね！ ${pet.name}まで胸がいっぱいになった。今日のこと、思い出に残してもいい？`;
    mood = "surprised";
    personalityDelta.kindness = 2;
  }

  const important = includesAny(normalized, ["初めて", "成功", "完成", "誕生日", "決めた", "できた"]);

  return {
    reply,
    mood,
    experienceDelta: important ? 8 : 4,
    affectionDelta: important ? 3 : 1,
    personalityDelta,
    memory: important
      ? {
          shouldSave: true,
          title: message.slice(0, 22),
          summary: message.slice(0, 100),
          emotion: mood,
          importance: 8,
        }
      : undefined,
    diaryLine: `今日は「${message.slice(0, 38)}」という話をしてくれた。もっと君のことを知りたい。`,
  };
}

export function demoDiary(pet: PetState, todaysUserMessages: string[]): string {
  if (todaysUserMessages.length === 0) {
    return `今日は静かな一日だった。${pet.name}は、君が来てくれるのをずっと待っていたよ。`;
  }
  const topics = todaysUserMessages.slice(-3).map((m) => `「${m.slice(0, 30)}」`).join("、");
  const closing = pet.affection >= 50 ? "君と過ごす時間が、いちばんの宝物になってきた。" : "もっと君のことを知りたいと思った一日だった。";
  return `今日は${topics}という話を聞かせてもらった。${pet.name}なりに、ひとつひとつ大事にしまっておいた。${closing}`;
}
