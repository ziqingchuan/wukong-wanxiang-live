import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { Bell, Brush, Flame, Glasses, Heart, Moon, MoonStar, Search, Sparkles, Waves, type LucideIcon } from "lucide-react";
import type { Role } from "../lib/types";

const PATTERN_ICONS: Record<string, LucideIcon> = {
  swirl: Brush,
  bow: Heart,
  stars: Sparkles,
  grid: Waves,
  jester: MoonStar,
  flame: Flame,
  bowtie: Search,
  bell: Bell,
  crescent: Moon,
  goggle: Glasses,
  custom: Sparkles,
};

type Props = {
  roles: Role[];
  selectedName?: string;
  onPick: (role: Role) => void;
  onPreview: (role: Role) => void;
  onRestore: () => void;
  focusTarget?: { name: string; nonce: number } | null;
};

const SPEED = 0.28;

export default function PillRail({ roles, selectedName, onPick, onPreview, onRestore, focusTarget }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const rail = useRef({ offset: 0, cycle: 0, paused: false, pressed: false, dragging: false, pointerX: 0, startOffset: 0, frame: 0 });
  const resumeTimer = useRef<number | undefined>(undefined);

  const apply = useCallback(() => {
    if (stripRef.current) stripRef.current.style.transform = `translate3d(${rail.current.offset}px,0,0)`;
  }, []);

  const normalize = useCallback(() => {
    const { cycle } = rail.current;
    if (!cycle) return;
    while (rail.current.offset <= -cycle * 2) rail.current.offset += cycle;
    while (rail.current.offset >= 0) rail.current.offset -= cycle;
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const strip = stripRef.current;
    if (!viewport || !strip) return;

    const state = rail.current;
    state.cycle = strip.scrollWidth / 3;
    state.offset = -state.cycle;
    apply();

    const tick = () => {
      if (!state.paused && !document.hidden) {
        state.offset -= SPEED;
        normalize();
        apply();
      }
      state.frame = requestAnimationFrame(tick);
    };
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) state.frame = requestAnimationFrame(tick);

    const pause = () => {
      state.paused = true;
    };
    const resume = () => {
      if (!state.dragging) state.paused = false;
    };
    const scheduleResume = (delay: number) => {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(resume, delay);
    };

    const onMouseEnter = () => pause();
    const onMouseLeave = () => resume();
    const onFocusIn = () => pause();
    const onFocusOut = (event: FocusEvent) => {
      if (!viewport.contains(event.relatedTarget as Node | null)) resume();
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.preventDefault();
      pause();
      state.offset -= (event.deltaX || event.deltaY) * 0.55;
      normalize();
      apply();
      scheduleResume(1200);
    };
    const onPointerDown = (event: PointerEvent) => {
      state.pressed = true;
      state.dragging = false;
      pause();
      state.pointerX = event.clientX;
      state.startOffset = state.offset;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!state.pressed) return;
      const distance = event.clientX - state.pointerX;
      if (!state.dragging && Math.abs(distance) < 7) return;
      state.dragging = true;
      state.offset = state.startOffset + distance;
      normalize();
      apply();
    };
    const endDrag = () => {
      state.pressed = false;
      state.dragging = false;
      scheduleResume(900);
    };

    viewport.addEventListener("mouseenter", onMouseEnter);
    viewport.addEventListener("mouseleave", onMouseLeave);
    viewport.addEventListener("focusin", onFocusIn);
    viewport.addEventListener("focusout", onFocusOut);
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", () => {
      if (state.pressed) endDrag();
    });

    const onVisibility = () => {
      state.paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(state.frame);
      clearTimeout(resumeTimer.current);
      viewport.removeEventListener("mouseenter", onMouseEnter);
      viewport.removeEventListener("mouseleave", onMouseLeave);
      viewport.removeEventListener("focusin", onFocusIn);
      viewport.removeEventListener("focusout", onFocusOut);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [roles, apply, normalize]);

  useEffect(() => {
    if (!focusTarget) return;
    const viewport = viewportRef.current;
    const strip = stripRef.current;
    if (!viewport || !strip) return;
    let timer: number | undefined;
    const frame = requestAnimationFrame(() => {
      const target = strip.querySelector<HTMLButtonElement>(
        `.pill[data-name="${CSS.escape(focusTarget.name)}"][data-copy="1"]`,
      );
      if (!target) return;
      const state = rail.current;
      state.paused = true;
      state.offset = viewport.clientWidth / 2 - target.offsetLeft - target.offsetWidth / 2;
      normalize();
      apply();
      target.focus({ preventScroll: true });
      timer = window.setTimeout(() => {
        state.paused = false;
      }, 2400);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [focusTarget, apply, normalize]);

  return (
    <div className="pill-viewport" ref={viewportRef}>
      <div
        className={`pill-strip${selectedName ? " has-selection" : ""}`}
        ref={stripRef}
        role="radiogroup"
        aria-label="选择一个联动角色"
      >
        {[...roles, ...roles, ...roles].map((role, index) => {
          const copy = Math.floor(index / roles.length);
          const Icon = PATTERN_ICONS[role.pattern] ?? Sparkles;
          return (
            <button
              key={`${role.name}-${copy}`}
              type="button"
              className="pill"
              data-name={role.name}
              data-copy={copy}
              data-pattern={role.pattern || "custom"}
              role="radio"
              aria-checked={selectedName === role.name}
              aria-label={`${role.name}：${role.trait}`}
              onClick={() => onPick(role)}
              onMouseEnter={() => onPreview(role)}
              onFocus={() => onPreview(role)}
              onMouseLeave={onRestore}
              onBlur={onRestore}
            >
              <span className="pill-orb" style={{ "--pill": role.color } as CSSProperties} aria-hidden="true">
                <Icon className="pill-orb__icon" size={18} strokeWidth={1.7} />
              </span>
              <b>{role.name}</b>
              <small>{role.trait.split(" · ")[1] || "万象之念"}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
