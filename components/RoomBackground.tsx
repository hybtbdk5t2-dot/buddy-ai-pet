import type { BackgroundSetting } from "@/lib/types";

export const BG_PRESETS: { id: string; label: string }[] = [
  { id: "room", label: "おへや" },
  { id: "night", label: "よぞら" },
  { id: "meadow", label: "くさはら" },
  { id: "sunset", label: "ゆうやけ" },
];

export const DEFAULT_BG_ID = "room";
export const DEFAULT_BACKGROUND: BackgroundSetting = { type: "preset", id: DEFAULT_BG_ID };

// 各プリセットのドット風デコレーション（背景の帯はCSS側で描画）
function PresetDecor({ id }: { id: string }) {
  if (id === "night") {
    return (
      <>
        <span className="px-moon" />
        <i className="px-star" style={{ left: "16%", top: "18%" }} />
        <i className="px-star" style={{ left: "34%", top: "10%" }} />
        <i className="px-star sm" style={{ left: "52%", top: "22%" }} />
        <i className="px-star" style={{ left: "72%", top: "14%" }} />
        <i className="px-star sm" style={{ left: "86%", top: "28%" }} />
        <i className="px-star sm" style={{ left: "24%", top: "34%" }} />
        <span className="px-rug night" />
      </>
    );
  }
  if (id === "meadow") {
    return (
      <>
        <span className="px-cloud" style={{ left: "14%", top: "16%" }} />
        <span className="px-cloud sm" style={{ left: "62%", top: "10%" }} />
        <i className="px-flower a" style={{ left: "18%", bottom: "16%" }} />
        <i className="px-flower b" style={{ left: "78%", bottom: "22%" }} />
        <i className="px-flower a" style={{ left: "88%", bottom: "12%" }} />
      </>
    );
  }
  if (id === "sunset") {
    return (
      <>
        <span className="px-sun-big" />
        <span className="px-cloud dusk" style={{ left: "10%", top: "30%" }} />
        <span className="px-cloud dusk sm" style={{ left: "66%", top: "22%" }} />
        <span className="px-rug dusk" />
      </>
    );
  }
  // room（既定）
  return (
    <>
      <span className="px-window"><i className="px-sun" /></span>
      <span className="px-plant" />
      <span className="px-rug" />
    </>
  );
}

export function RoomBackground({ background }: { background?: BackgroundSetting }) {
  if (background?.type === "image") {
    return <div className="bg bg-image" style={{ backgroundImage: `url(${background.data})` }} aria-hidden />;
  }
  const id = background?.type === "preset" ? background.id : DEFAULT_BG_ID;
  return (
    <div className={`bg bg-${id}`} aria-hidden>
      <PresetDecor id={id} />
    </div>
  );
}
