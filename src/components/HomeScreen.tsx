import { useEffect, useState, type CSSProperties } from "react";
import { BookOpen, Check, Images, Plus, Share2, Ticket, Volume2, VolumeX } from "lucide-react";
import { asset } from "../lib/assets";
import { playTone } from "../lib/audio";
import type { Role } from "../lib/types";
import HeaderButton from "./HeaderButton";
import PillRail from "./PillRail";

type Props = {
  roles: Role[];
  selected: Role | null;
  chances: number;
  galleryCount: number;
  galleryOpen: boolean;
  shared: boolean;
  sound: boolean;
  focusTarget: { name: string; nonce: number } | null;
  onPick: (role: Role) => void;
  onFeed: () => void;
  onOpenRules: () => void;
  onOpenGallery: () => void;
  onShare: () => void;
  onToggleSound: () => void;
  onOpenCustom: () => void;
  onHome: () => void;
};

const DEFAULT_COLOR = "117,182,173";
const DEFAULT_TRAIT = "悬停丹药可感应其角色特征";

export default function HomeScreen({
  roles,
  selected,
  chances,
  galleryCount,
  galleryOpen,
  shared,
  sound,
  focusTarget,
  onPick,
  onFeed,
  onOpenRules,
  onOpenGallery,
  onShare,
  onToggleSound,
  onOpenCustom,
  onHome,
}: Props) {
  const [stageColor, setStageColor] = useState(selected?.rgb ?? DEFAULT_COLOR);
  const [trait, setTrait] = useState(selected?.trait ?? DEFAULT_TRAIT);

  useEffect(() => {
    setStageColor(selected?.rgb ?? DEFAULT_COLOR);
    setTrait(selected?.trait ?? DEFAULT_TRAIT);
  }, [selected]);

  const preview = (role: Role) => {
    setStageColor(role.rgb);
    setTrait(role.trait);
    if (sound) playTone("hover");
  };

  const restore = () => {
    setStageColor(selected?.rgb ?? DEFAULT_COLOR);
    setTrait(selected?.trait ?? DEFAULT_TRAIT);
  };

  const feedLabel = selected
    ? chances > 0
      ? `以「${selected.name}」为悟空塑身`
      : "今日机会已用完"
    : "掌心灵印尚未显化";

  return (
    <section className="screen home is-active" id="home">
      <div className="atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
      <header className="topbar">
        <button className="brand" onClick={onHome} aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true"></span>
          <span><b>悟空万象</b><small>WANXIANG BLIND BOX</small></span>
        </button>
        <nav className="header-nav" aria-label="快捷功能">
          <HeaderButton icon={BookOpen} label="玩法说明" onClick={onOpenRules} />
          <HeaderButton
            icon={Ticket}
            label="剩余机会"
            value={`${Math.max(0, chances)} 次`}
            stat
            title={`今日尚余 ${Math.max(0, chances)} 次塑身机缘`}
            ariaLabel={`今日尚余 ${Math.max(0, chances)} 次塑身机缘`}
          />
          <HeaderButton
            icon={Images}
            label="万象图鉴"
            badge={galleryCount}
            active={galleryOpen}
            onClick={onOpenGallery}
            ariaLabel="打开万象图鉴"
          />
          <HeaderButton
            icon={shared ? Check : Share2}
            label={shared ? "已得机缘" : "分享得机缘"}
            value={shared ? undefined : "+1 次"}
            disabled={shared}
            onClick={onShare}
            ariaLabel={shared ? "已分享并获得额外机缘" : "分享获得一次额外塑身机会"}
          />
          <HeaderButton
            icon={sound ? Volume2 : VolumeX}
            label={sound ? "灵音已启" : "灵音"}
            active={sound}
            pressed={sound}
            onClick={onToggleSound}
            ariaLabel={sound ? "关闭仪式音效" : "开启仪式音效"}
          />
        </nav>
      </header>

      <div className="home-layout ritual-field">
        <div className="control-panel ritual-intro">
          <div className="eyebrow"><i></i><span>THE UNFORMED · 001</span></div>
          <h1 aria-label="为悟空塑身"><span>为悟空</span><strong>塑身</strong></h1>
          <p className="lead" id="ritual-guidance">
            {selected ? "此念已定，神魂通道已启。叩开灵印，引万象入灵。" : "世间万象，皆为一念。择一丹，以众生神魂，塑悟空新身。"}
          </p>
        </div>

        <div className={`spirit-stage${selected ? " has-selection" : ""}`} style={{ "--stage-color": stageColor } as CSSProperties}>
          <div className="stage-copy"><b><i></i> 灵体・待塑</b><strong>投一念神魂，塑全新肉身</strong></div>
          <div className="energy-wash" aria-hidden="true"></div>
          <picture>
            <source type="image/avif" media="(max-width: 759px)" srcSet={asset("wukong-spirit-v4-640.avif")} />
            <source type="image/avif" srcSet={asset("wukong-spirit-v4-960.avif")} />
            <source type="image/webp" media="(max-width: 759px)" srcSet={asset("wukong-spirit-v4-640.webp")} />
            <source type="image/webp" srcSet={asset("wukong-spirit-v4-960.webp")} />
            <img src={asset("wukong-spirit-v4-960.webp")} width="960" height="1440" fetchPriority="high" alt="闭目合十、等待塑造肉身的玄铁灵体悟空" />
          </picture>
          <div className="soul-channel" aria-hidden="true"><i></i><i></i><i></i></div>
          <p className="stage-note">闭目守一，万象将生</p>
        </div>

        <div className="ritual-action" aria-live="polite">
          <span className="action-thread" aria-hidden="true"></span>
          <button
            className="palm-seal"
            onClick={onFeed}
            disabled={!selected || chances < 1}
            aria-describedby="ritual-guidance"
            style={selected ? ({ "--seal-color": selected.color } as CSSProperties) : undefined}
          >
            <span className="spirit-sense-seal" aria-hidden="true"><i></i><em></em></span>
            <b>{feedLabel}</b>
            <small>叩印塑身</small>
          </button>
        </div>

        <section className="pill-picker elixir-array" aria-labelledby="pill-title">
          <header>
            <div><small>万象丹阵</small><h2 id="pill-title">此丹，只承一念</h2></div>
            <p id="hover-trait">{trait}</p>
          </header>
          <PillRail
            roles={roles}
            selectedName={selected?.name}
            onPick={onPick}
            onPreview={preview}
            onRestore={restore}
            focusTarget={focusTarget}
          />
          <div className="selection-status" aria-live="polite">
            <span className="status-orb" style={{ background: selected?.color }}></span>
            <p>一念 <b>{selected?.name ?? "未定"}</b></p>
          </div>
          <button className="custom-forge" onClick={onOpenCustom}>
            <span aria-hidden="true"><Plus size={22} strokeWidth={1.8} /></span><b>自炼一丹</b><small>注入专属一念</small>
          </button>
        </section>
      </div>
    </section>
  );
}
