import { Sparkles } from "lucide-react";
import type { BoxResult } from "../lib/types";
import OverlayModal from "./OverlayModal";

type Props = {
  open: boolean;
  items: BoxResult[];
  onClose: () => void;
  onSelect: (item: BoxResult) => void;
};

const RARITY_LABEL: Record<string, string> = {
  common: "普通款",
  rare: "稀有款",
  legendary: "传说款",
};

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#1a1d26"/><text x="50%" y="56%" font-size="120" text-anchor="middle" fill="#d3b479">悟</text></svg>`,
  );

function GalleryCard({ item, onSelect }: { item: BoxResult; onSelect: (item: BoxResult) => void }) {
  return (
    <button className="gallery-card" data-rarity={item.rarity} onClick={() => onSelect(item)}>
      <div className="gallery-card__art">
        <span className="gallery-card__badge">{RARITY_LABEL[item.rarity] ?? RARITY_LABEL.common}</span>
        <img
          src={item.image || FALLBACK_IMAGE}
          loading="lazy"
          alt={item.title}
          onError={event => {
            // 兜底：本地 blob 失效或占位图异常时，退回内置占位图，避免出现空白卡片
            const img = event.currentTarget;
            if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
          }}
        />
      </div>
      <div className="gallery-card__body">
        <h3>{item.title}</h3>
        <small>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</small>
      </div>
    </button>
  );
}

export default function GalleryModal({ open, items, onClose, onSelect }: Props) {
  return (
    <OverlayModal open={open} onClose={onClose} labelledBy="gallery-title" size="lg" className="gallery-modal">
      <header className="gallery-modal__head">
        <div>
          <small>MY COLLECTION</small>
          <h1 id="gallery-title">万象图鉴</h1>
          <p>每一具肉身，都是一念的留影</p>
        </div>
        <span className="gallery-modal__count"><b>{items.length}</b> 件收藏</span>
      </header>

      {items.length === 0 ? (
        <div className="gallery-modal__empty">
          <span className="gallery-modal__empty-icon"><Sparkles size={30} strokeWidth={1.5} /></span>
          <h2>图鉴尚空</h2>
          <p>塑成第一副肉身，收藏便从此开始。</p>
          <button className="gold-button dialog-submit" onClick={onClose}>去择一枚丹</button>
        </div>
      ) : (
        <div className="gallery-modal__grid">
          {items.map(item => <GalleryCard key={item.id} item={item} onSelect={onSelect} />)}
        </div>
      )}
    </OverlayModal>
  );
}
