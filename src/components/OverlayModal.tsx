import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** 全局统一浮层弹窗：遮罩 + 屏幕居中卡片 + 右上角关闭。 */
export default function OverlayModal({ open, onClose, children, labelledBy, size = "md", className = "" }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-overlay">
      <button className="ui-overlay__mask" onClick={onClose} tabIndex={-1} aria-label="关闭浮层"></button>
      <div
        className={`ui-dialog ui-dialog--${size} ${className}`}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <button className="ui-dialog__close" onClick={onClose} aria-label="关闭">
          <X size={17} strokeWidth={1.8} />
        </button>
        {children}
      </div>
    </div>
  );
}
