import { useEffect, useRef, useState, type FormEvent } from "react";
import OverlayModal from "./OverlayModal";

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <OverlayModal open={open} onClose={onClose} labelledBy="rules-title" size="sm">
      <header className="dialog-head">
        <div><small>HOW TO PLAY</small><h2 id="rules-title">万象塑身录</h2></div>
      </header>
      <ol className="rules-list">
        <li><b>壹</b><div><h3>择一枚丹</h3><p>选择角色丹，或输入角色自炼一枚。每次只能融合一个角色。</p></div></li>
        <li><b>贰</b><div><h3>为悟空塑身</h3><p>悟空吸收角色造型、服饰、性格与主辅配色，生成完整 3D 潮玩。</p></div></li>
        <li><b>叁</b><div><h3>开盒入图鉴</h3><p>打开专属硬盒揭晓品质，每次成功生成都会自动收入万象图鉴。</p></div></li>
      </ol>
      <div className="rule-facts">
        <span>本次免费 <b>10 次</b></span><span>分享加赠 <b>1 次</b></span><span>普通 / 稀有 / 传说 <b>60 / 25 / 15</b></span>
      </div>
      <button className="gold-button dialog-submit" onClick={onClose}>已知晓，去择丹</button>
    </OverlayModal>
  );
}

export function CustomModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    inputRef.current?.focus();
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <OverlayModal open={open} onClose={onClose} labelledBy="custom-title" size="sm">
      <form onSubmit={submit}>
        <header className="dialog-head">
          <div><small>CUSTOM ELIXIR</small><h2 id="custom-title">自炼万象丹</h2></div>
        </header>
        <p className="dialog-desc">写下一个角色的名字，此丹只承一念。</p>
        <label className="field-label" htmlFor="custom-input">角色名称</label>
        <input
          id="custom-input"
          className="field-input"
          ref={inputRef}
          maxLength={30}
          placeholder="例如：小王子"
          autoComplete="off"
          value={name}
          onChange={event => setName(event.target.value)}
        />
        <small className="field-note">一次只能输入并融合一个角色</small>
        <button className="gold-button dialog-submit" type="submit">炼成此丹</button>
      </form>
    </OverlayModal>
  );
}
