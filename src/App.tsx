import { useEffect, useRef, useState } from "react";
import GalleryModal from "./components/GalleryModal";
import HomeScreen from "./components/HomeScreen";
import { CustomModal, RulesModal } from "./components/Modals";
import MorphScreen from "./components/MorphScreen";
import ResultScreen from "./components/ResultScreen";
import SealedScreen from "./components/SealedScreen";
import Toast from "./components/Toast";
import { generateBox } from "./lib/ark";
import { playTone } from "./lib/audio";
import { preloadImage } from "./lib/image";
import { BASE_ROLES, createCustomRole } from "./lib/roles";
import type { BoxResult, Role } from "./lib/types";

type Screen = "home" | "morph" | "sealed" | "result";
type Modal = "rules" | "custom" | null;

const DAILY_CHANCES = 10;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [roles, setRoles] = useState<Role[]>(BASE_ROLES);
  const [selected, setSelected] = useState<Role | null>(null);
  const [chances, setChances] = useState(DAILY_CHANCES);
  const [gallery, setGallery] = useState<BoxResult[]>([]);
  const [result, setResult] = useState<BoxResult | null>(null);
  const [breaking, setBreaking] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [sound, setSound] = useState(false);
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState<{ message: string; nonce: number } | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ name: string; nonce: number } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = (message: string) => {
    setToast({ message, nonce: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3600);
  };

  useEffect(() => {
    document.body.classList.toggle("modal-open", modal !== null || galleryOpen);
  }, [modal, galleryOpen]);

  useEffect(() => {
    document.body.classList.toggle("gallery-open", galleryOpen);
  }, [galleryOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [screen]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const pickRole = (role: Role) => {
    setSelected(role);
    if (sound) playTone("select");
  };

  const feed = async () => {
    if (!selected) {
      notify("先选择一枚万象丹");
      return;
    }
    if (chances < 1) {
      notify("今日机会已用完，分享结果可再得 1 次");
      return;
    }
    playTone("start");
    setScreen("morph");
    try {
      const box = await generateBox(selected);
      setResult(box);
      setChances(current => Math.max(0, current - 1));
      setGallery(current => [box, ...current.filter(item => item.id !== box.id)]);
      await Promise.all([preloadImage(box.image), sleep(650)]);
      setScreen("sealed");
    } catch (error) {
      notify(error instanceof Error ? error.message : "塑身失败");
      setTimeout(() => setScreen("home"), 1000);
    }
  };

  const breakSeal = async () => {
    if (!result || breaking) return;
    setBreaking(true);
    playTone("start");
    await sleep(matchMedia("(prefers-reduced-motion: reduce)").matches ? 20 : 720);
    setScreen("result");
    setBreaking(false);
  };

  const share = async () => {
    const text = result ? `我抽到了悟空万象盲盒「${result.title}」！` : "我正在为悟空注入一念神魂，来看看你的万象肉身。";
    try {
      if (navigator.share) await navigator.share({ title: "悟空万象盲盒", text, url: location.href });
      else await navigator.clipboard.writeText(text + " " + location.href);
      if (!shared) {
        setChances(current => current + 1);
        setShared(true);
      }
      notify("分享成功，获得 1 次额外机会");
    } catch (error) {
      if ((error as Error).name !== "AbortError") notify("分享未完成");
    }
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    if (next) playTone("select");
    notify(next ? "灵音已启" : "灵音已静");
  };

  const submitCustom = (name: string) => {
    const custom = createCustomRole(name);
    setRoles(current => [custom, ...current.filter(role => role.name !== name)]);
    setSelected(custom);
    setModal(null);
    setFocusTarget({ name, nonce: Date.now() });
    playTone("select");
    notify("专属万象丹已炼成");
  };

  const openResultFromGallery = (item: BoxResult) => {
    setGalleryOpen(false);
    setResult(item);
    setScreen("result");
  };

  return (
    <main className="app">
      {screen === "home" && (
        <HomeScreen
          roles={roles}
          selected={selected}
          chances={chances}
          galleryCount={gallery.length}
          galleryOpen={galleryOpen}
          shared={shared}
          sound={sound}
          focusTarget={focusTarget}
          onPick={pickRole}
          onFeed={feed}
          onOpenRules={() => setModal("rules")}
          onOpenGallery={() => setGalleryOpen(true)}
          onShare={share}
          onToggleSound={toggleSound}
          onOpenCustom={() => setModal("custom")}
          onHome={() => setScreen("home")}
        />
      )}

      {screen === "morph" && (
        <MorphScreen custom={selected?.pattern === "custom"} sound={sound} onHome={() => setScreen("home")} />
      )}

      {screen === "sealed" && (
        <SealedScreen
          roleName={selected?.name ?? ""}
          breaking={breaking}
          onBreak={breakSeal}
          onShare={share}
          onHome={() => setScreen("home")}
        />
      )}

      {screen === "result" && result && (
        <ResultScreen
          result={result}
          image={result.image}
          onHome={() => setScreen("home")}
          onAgain={() => setScreen("home")}
          onGallery={() => setGalleryOpen(true)}
          onShare={share}
        />
      )}

      <GalleryModal open={galleryOpen} items={gallery} onClose={() => setGalleryOpen(false)} onSelect={openResultFromGallery} />

      <RulesModal open={modal === "rules"} onClose={() => setModal(null)} />
      <CustomModal open={modal === "custom"} onClose={() => setModal(null)} onSubmit={submitCustom} />

      <Toast message={toast?.message ?? null} />
    </main>
  );
}
