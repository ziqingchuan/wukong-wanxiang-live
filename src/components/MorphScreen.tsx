import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { asset } from "../lib/assets";
import { startAmbient } from "../lib/audio";
import { COMMON_VERSE_POOLS, CUSTOM_VERSE_POOLS, drawWeightedVerse } from "../lib/roles";

type Props = {
  custom: boolean;
  sound: boolean;
  onHome: () => void;
};

const STEPS = [
  { step: "第一式・析一念本源", kicker: "神魂入体", title: "神魂解析", note: "读取万象丹内的一念灵息，萃取角色本源", scale: 0.22, mark: 0 },
  { step: "第二式・勾灵骸初形", kicker: "凝形塑身", title: "灵骸初成", note: "以灵骨为基，勾勒肉身轮廓", scale: 0.47, mark: 1 },
  { step: "第三式・铸灵韵肌理", kicker: "肌理渲染", title: "肌理凝华", note: "赋色泽、铸肌理，灵韵缓缓流淌", scale: 0.72, mark: 2 },
  { step: "第四式・凝万象为身", kicker: "封藏入盒", title: "封藏肉身", note: "收纳新躯，静待开盒揭晓", scale: 0.96, mark: 3 },
];

export default function MorphScreen({ custom, sound, onHome }: Props) {
  const [index, setIndex] = useState(0);
  const [verse, setVerse] = useState<{ text: string; x: number; nonce: number } | null>(null);
  const [showPatience, setShowPatience] = useState(false);
  const lastVerse = useRef("");

  useEffect(() => {
    const stageTimer = window.setInterval(() => {
      setIndex(current => Math.min(current + 1, STEPS.length - 1));
    }, 3400);

    const pools = custom ? CUSTOM_VERSE_POOLS : COMMON_VERSE_POOLS;
    let verseTimer: number | undefined;
    const summonVerse = () => {
      const text = drawWeightedVerse(pools, lastVerse.current);
      lastVerse.current = text;
      setVerse({ text, x: 18 + Math.random() * 58, nonce: performance.now() });
      verseTimer = window.setTimeout(summonVerse, 2500 + Math.random() * 1500);
    };
    const firstVerseTimer = window.setTimeout(summonVerse, 2200);
    const patienceTimer = window.setTimeout(() => setShowPatience(true), 17500);
    const stopAmbient = sound ? startAmbient() : () => {};

    return () => {
      clearInterval(stageTimer);
      clearTimeout(firstVerseTimer);
      clearTimeout(verseTimer);
      clearTimeout(patienceTimer);
      stopAmbient();
    };
  }, [custom, sound]);

  const current = STEPS[index];

  return (
    <section className={`screen morph is-active phase-${current.mark}`} id="morph" aria-live="polite">
      <header className="flow-header">
        <button className="icon-button" onClick={onHome} aria-label="返回"><ArrowLeft size={18} strokeWidth={1.7} /></button><span>肉身塑造中</span><b>{current.step}</b>
      </header>
      <div className="morph-layout">
        <div className="morph-stage">
          <div className="incarnation-light" aria-hidden="true"></div>
          <div className="spirit-particles" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
          <div className="gold-veins" aria-hidden="true"></div>
          <div className="surface-sheen" aria-hidden="true"></div>
          <picture>
            <source type="image/avif" srcSet={asset("wukong-spirit-v4-960.avif")} />
            <img src={asset("wukong-spirit-v4-960.webp")} width="960" height="1440" alt="正在塑形的悟空" />
          </picture>
          {verse && (
            <p
              key={verse.nonce}
              className="floating-verse is-visible"
              aria-hidden="true"
              style={{ "--verse-x": `${verse.x}%` } as CSSProperties}
            >
              {verse.text}
            </p>
          )}
        </div>
        <div className="morph-copy">
          <small>{current.kicker}</small>
          <h2>{current.title}</h2>
          <p>{current.note}</p>
          <div className="stage-progress" aria-label="塑身进度">
            <i style={{ transform: `scaleX(${current.scale})` }}></i><em></em><em></em><em></em><em></em>
          </div>
          <div className="stage-marks">
            {["解析", "塑形", "渲染", "封盒"].map((mark, i) => (
              <span key={mark} className={i <= current.mark ? "active" : undefined}>{mark}</span>
            ))}
          </div>
          <p className={`patience-note${showPatience ? " is-visible" : ""}`}>灵念繁复，塑身需些许时辰，切莫心急</p>
        </div>
      </div>
    </section>
  );
}
