import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value?: string;
  badge?: number | string;
  active?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  stat?: boolean;
  title?: string;
  ariaLabel?: string;
  onClick?: () => void;
};

/** 顶栏统一按钮：图标 + 文案 + 可选角标，支持 active / pressed / disabled 状态。 */
export default function HeaderButton({
  icon: Icon,
  label,
  value,
  badge,
  active = false,
  pressed,
  disabled = false,
  stat = false,
  title,
  ariaLabel,
  onClick,
}: Props) {
  const className = `nav-btn${active ? " is-active" : ""}${stat ? " nav-btn--stat" : ""}`;
  const content = (
    <>
      <span className="nav-btn__icon" aria-hidden="true"><Icon size={17} strokeWidth={1.7} /></span>
      <span className="nav-btn__label">{label}</span>
      {value !== undefined && <span className="nav-btn__value">{value}</span>}
      {badge !== undefined && <span className="nav-btn__badge">{badge}</span>}
    </>
  );

  if (stat) {
    return <div className={className} title={title} aria-label={ariaLabel ?? label}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? label}
      aria-pressed={pressed}
    >
      {content}
    </button>
  );
}
