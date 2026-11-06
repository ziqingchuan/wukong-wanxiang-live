import { useRef, useState, type CSSProperties } from "react";
import { Share2, X } from "lucide-react";
import { asset } from "../lib/assets";

type Props = {
  roleName: string;
  breaking: boolean;
  onBreak: () => void;
  onShare: () => void;
  onHome: () => void;
};

export default function SealedScreen({ roleName, breaking, onBreak, onShare, onHome }: Props) {
  const [angle, setAngle] = useState(-12);
  const drag = useRef({ active: false, startX: 0, startAngle: -12 });

  return (
    <section className={`screen sealed is-active${breaking ? " is-breaking" : ""}`} id="sealed">
      <header className="flow-header sealed-header">
        <button className="icon-button" onClick={onHome} aria-label="关闭"><X size={18} strokeWidth={1.7} /></button><span>封藏已成</span>
        <button className="sealed-share" onClick={onShare} aria-label="分享获得一次额外塑身机会">
          <Share2 size={15} strokeWidth={1.7} aria-hidden="true" /><span>分享得机缘</span><b>+1 次</b>
        </button>
      </header>
      <div
        className="box-scene"
        onPointerDown={event => {
          drag.current.active = true;
          drag.current.startX = event.clientX;
          drag.current.startAngle = angle;
        }}
        onPointerMove={event => {
          if (!drag.current.active) return;
          const next = Math.max(-35, Math.min(35, drag.current.startAngle + (event.clientX - drag.current.startX) * 0.18));
          setAngle(next);
        }}
        onPointerUp={() => { drag.current.active = false; }}
        onPointerCancel={() => { drag.current.active = false; }}
        onPointerLeave={() => { drag.current.active = false; }}
      >
        <div className="spotlight" aria-hidden="true"></div>
        <div className="seal-particles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <button
          className="hard-box mechanism-box"
          onClick={onBreak}
          aria-label="触碰机关盒，破印启封"
          style={{ "--box-y": `${angle}deg` } as CSSProperties}
        >
          <img src={asset("mechanism-seal-box-v1.webp")} width="1037" height="1536" alt="玄铁暗金、青玉灵锁的立体机关封印盒" />
          <span className="mechanism-glow" aria-hidden="true"></span>
          <span className="sr-only">{roleName.toUpperCase()}</span>
        </button>
        <div className="sealed-meta"><b>最终式・封藏入盒</b><span>灵念稳定，肉身待启</span></div>
      </div>
      <div className="sealed-copy">
        <h2>启封你的万象肉身</h2>
        <p>神魂已归位，灵骸已封藏。轻轻破印，揭晓今日之形。</p>
        <span className="seal-guide" aria-hidden="true"></span>
        <button className="gold-button break-seal" onClick={onBreak}>破印启封</button>
      </div>
    </section>
  );
}
