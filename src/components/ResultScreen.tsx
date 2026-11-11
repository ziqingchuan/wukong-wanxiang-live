import { LibraryBig, RotateCcw, Share2, X, RefreshCw } from "lucide-react";
import ModelViewer from "./ModelViewer";
import type { BoxResult, Rarity } from "../lib/types";

type ModelStatus = "idle" | "queued" | "running" | "done" | "error";

type Props = {
  result: BoxResult;
  modelStatus: ModelStatus;
  onRetry3D: () => void;
  onHome: () => void;
  onAgain: () => void;
  onGallery: () => void;
  onShare: () => void;
};

const META: Record<Rarity, { name: string; desc: string }> = {
  common: { name: "普通款", desc: "经典哑光 PVC 肉身，完整吸收角色造型与主色基因。" },
  rare: { name: "稀有款", desc: "紫晶珠光与透明树脂融合，拥有专属动态姿态和情景底座。" },
  legendary: { name: "珍品传说款", desc: "鎏金虹彩限定肉身，附带专属光环、双层底座与传说配件。" },
};

export default function ResultScreen({
  result,
  modelStatus,
  onRetry3D,
  onHome,
  onAgain,
  onGallery,
  onShare,
}: Props) {
  const meta = META[result.rarity] ?? META.common;
  const roleName = result.roleName || result.title?.split(" · ")[0] || "悟空万象";
  const description = result.rarity === "common"
    ? `经典款灵韵入体，神魂稳定，完整保留「${roleName}」鲜明的造型肌理与灵动气质。`
    : meta.desc;

  const has3D = !!result.modelUrl;

  return (
    <section className={`screen result is-active${has3D ? " has-3d" : ""}`} id="result" data-rarity={result.rarity}>
      <header className="flow-header result-header">
        <button className="icon-button" onClick={onHome} aria-label="关闭"><X size={18} strokeWidth={1.7} /></button><span className="result-label">万象结果</span>
        <button onClick={onShare} aria-label="分享获得一次额外塑身机会">
          <Share2 size={15} strokeWidth={1.7} aria-hidden="true" /><span>分享得机缘</span><b>+1 次</b>
        </button>
      </header>
      <div className="result-aura" aria-hidden="true"></div>
      <div className="rarity-mark">{meta.name}</div>

      {/* 拆盒即得 3D 肉身，可 360° 自由旋转 */}
      <div className="figure">
        <div className="result-spirit-ring" aria-hidden="true"></div>
        {has3D ? (
          <ModelViewer zipUrl={result.modelUrl!} />
        ) : (
          <>
            <img src={result.image} alt="生成的悟空联动盲盒手办" />
            {modelStatus === "error" && (
              <div className="forge-overlay is-error" aria-live="polite">
                <div className="forge-text">
                  <strong>3D 铸造未成</strong>
                  <span>灵体塑造超时，可重新铸造</span>
                  <button className="forge-retry" onClick={onRetry3D}>
                    <RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" /><span>重新铸造</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="result-info">
        <small>
          WUKONG WANXIANG · {result.id.slice(0, 6).toUpperCase()}
          {has3D ? " · 3D肉身" : " · 图鉴封面"}
        </small>
        <h2>{roleName}・{meta.name}</h2>
        <p className="result-story">一念附身，万象成形。这具肉身，带了点「{roleName}」的灵气。</p>
        <p>{description}</p>
        <div>
          <button className="spirit-button" onClick={onAgain}>
            <RotateCcw size={17} strokeWidth={1.7} aria-hidden="true" /><span>再塑一次</span>
          </button>
          <button className="spirit-button is-gold" onClick={onGallery}>
            <LibraryBig size={17} strokeWidth={1.7} aria-hidden="true" /><span>收录万象</span>
          </button>
        </div>
      </div>
    </section>
  );
}
