import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import { asset } from "../lib/assets";
import { startAmbient } from "../lib/audio";
import { COMMON_VERSE_POOLS, CUSTOM_VERSE_POOLS, drawWeightedVerse } from "../lib/roles";

type GenPhase = "idle" | "imaging" | "3d-queued" | "3d-running" | "3d-done" | "3d-fallback";

type Props = {
  custom: boolean;
  sound: boolean;
  genPhase: GenPhase;
  genAttempt: number;
  genFallback: boolean;
  onHome: () => void;
};

const STEPS = [
  { step: "第一式・析一念本源", kicker: "神魂入体", title: "神魂解析", note: "读取万象丹内的一念灵息，萃取角色本源", scale: 0.22, mark: 0 },
  { step: "第二式・勾灵骸初形", kicker: "凝形塑身", title: "灵骸初成", note: "以灵骨为基，勾勒肉身轮廓", scale: 0.47, mark: 1 },
  { step: "第三式・铸灵韵肌理", kicker: "肌理渲染", title: "肌理凝华", note: "赋色泽、铸肌理，灵韵缓缓流淌", scale: 0.72, mark: 2 },
  { step: "第四式・凝万象为身", kicker: "封藏入盒", title: "封藏肉身", note: "收纳新躯，静待开盒揭晓", scale: 0.96, mark: 3 },
];

type PhaseStep = { mark: number; scale: number; kicker: string; title: string; note: string; step: string };

/** 根据 3D 阶段映射到 STEPS 的 mark 和进度 */
function phaseToStep(phase: GenPhase, attempt: number): PhaseStep | null {
  const baseKicker = "万象凝形";
  const baseStep = "肉身塑造中";
  switch (phase) {
    case "imaging":
      return { mark: 1, scale: 0.4, kicker: baseKicker, title: "肌理凝华", note: "万象神魂解析中，封面正在显形", step: baseStep };
    case "3d-queued":
      return { mark: 2, scale: 0.75, kicker: baseKicker, title: "灵骸凝立", note: "3D 肉身排队中，铸成后即刻开盒", step: baseStep };
    case "3d-running": {
      const progress = Math.min(1, attempt / 24);
      return {
        mark: 2,
        scale: 0.72 + progress * 0.22,
        kicker: baseKicker,
        title: "铸造3D肉身",
        note: `构建多边形、赋纹理材质…已凝练 ${attempt} 次`,
        step: baseStep,
      };
    }
    case "3d-done":
      return { mark: 3, scale: 1, kicker: baseKicker, title: "封藏肉身", note: "3D 肉身已塑成，即将封盒，可拆盒揭晓", step: baseStep };
    case "3d-fallback":
      return { mark: 3, scale: 1, kicker: baseKicker, title: "封藏肉身", note: "3D 铸造未成，本次以图鉴封面入盒", step: baseStep };
    default:
      return null;
  }
}

export default function MorphScreen({ custom, sound, genPhase, genAttempt, genFallback, onHome }: Props) {
  const [index, setIndex] = useState(0);
  const [verse, setVerse] = useState<{ text: string; x: number; nonce: number } | null>(null);
  const lastVerse = useRef("");

  // 根据 genPhase 计算要显示的步骤
  const phaseStep = phaseToStep(genPhase, genAttempt);
  const step = phaseStep ?? STEPS[index];

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
    const stopAmbient = sound ? startAmbient() : () => {};

    return () => {
      clearInterval(stageTimer);
      clearTimeout(firstVerseTimer);
      clearTimeout(verseTimer);
      stopAmbient();
    };
  }, [custom, sound]);

  // 强制用 genPhase 的进度值（覆盖定时器的 index）
  const displayMark = phaseStep?.mark ?? step.mark;
  const displayScale = phaseStep?.scale ?? step.scale;
  const displayTitle = phaseStep?.title ?? step.title;
  const displayNote = phaseStep?.note ?? step.note;

  // 根据阶段给提示文案
  const phaseHint = (() => {
    if (genPhase === "imaging") return "正在生成图鉴封面…";
    if (genPhase === "3d-queued") return "3D灵体排队中，预计数分钟";
    if (genPhase === "3d-running") return "灵体塑造中，多边形构建…";
    if (genPhase === "3d-done") return "灵体已塑成";
    if (genFallback) return "3D塑造稍慢，已降级";
    return "灵念繁复，塑身需些许时辰";
  })();

  return (
    <section className={`screen morph is-active phase-${displayMark}`} id="morph" aria-live="polite">
      <header className="flow-header">
        <button className="icon-button" onClick={onHome} aria-label="返回"><ArrowLeft size={18} strokeWidth={1.7} /></button><span>肉身塑造中</span><b>{step.step}</b>
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
          <small>{step.kicker}</small>
          <h2>{displayTitle}</h2>
          <p>{displayNote}</p>
          <div className="stage-progress" aria-label="塑身进度">
            <i style={{ transform: `scaleX(${displayScale})` }}></i><em></em><em></em><em></em><em></em>
          </div>
          <div className="stage-marks">
            {["解析", "塑形", "3D铸体", "封盒"].map((mark, i) => (
              <span key={mark} className={i <= displayMark ? "active" : undefined}>{mark}</span>
            ))}
          </div>
          <p className={`patience-note is-visible${genFallback ? " fallback" : ""}`}>{phaseHint}</p>
        </div>
      </div>
    </section>
  );
}
