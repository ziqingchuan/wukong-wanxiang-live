import { useEffect, useRef, useState } from "react";
import GalleryModal from "./components/GalleryModal";
import HomeScreen from "./components/HomeScreen";
import { CustomModal, RulesModal } from "./components/Modals";
import MorphScreen from "./components/MorphScreen";
import { preload3D } from "./components/ModelViewer";
import ResultScreen from "./components/ResultScreen";
import SealedScreen from "./components/SealedScreen";
import Toast from "./components/Toast";
import { generateBox } from "./lib/ark";
import { playTone } from "./lib/audio";
import { preloadImage } from "./lib/image";
import { BASE_ROLES, createCustomRole } from "./lib/roles";
import { generate3D } from "./lib/seed3d";
import type { BoxResult, Role } from "./lib/types";

type Screen = "home" | "morph" | "sealed" | "result";
type Modal = "rules" | "custom" | null;

// 3D 生成阶段：生图 → 3D排队 → 3D生成中 → 完成
type GenPhase =
  | "idle"
  | "imaging"       // Seedream 生图中
  | "3d-queued"     // Seed3D 任务已创建，排队中
  | "3d-running"    // Seed3D 生成中
  | "3d-done"       // 3D 完成
  | "3d-fallback";  // 3D 失败，降级（只有图片）

/** 结果页 3D 铸造状态 */
export type ModelStatus = "idle" | "queued" | "running" | "done" | "error";

const DAILY_CHANCES = 2;
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

  // 3D 生成状态
  const [genPhase, setGenPhase] = useState<GenPhase>("idle");
  const [genAttempt, setGenAttempt] = useState(0);
  const [genFallback, setGenFallback] = useState(false);
  // 结果页的 3D 铸造状态
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const genSeq = useRef(0);

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

  /** 铸造 3D 肉身：必须铸成后才允许拆盒 */
  const forge3D = async (box: BoxResult): Promise<BoxResult> => {
    const seq = ++genSeq.current;
    const url = await generate3D(
      box.image,
      (status, attempt) => {
        if (genSeq.current !== seq) return;
        setGenAttempt(attempt);
        setGenPhase(status === "queued" ? "3d-queued" : "3d-running");
      },
      90,
      10,
    );
    if (genSeq.current !== seq) throw new Error("塑身已中断");
    return { ...box, modelUrl: url };
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
    setChances(current => Math.max(0, current - 1));
    setGenFallback(false);
    setGenAttempt(0);
    setModelStatus("idle");
    setScreen("morph");

    try {
      // ========== 第一阶段：Seedream 生图（图鉴封面） ==========
      setGenPhase("imaging");
      const box = await generateBox(selected);
      setResult(box);
      setGallery(current => [box, ...current.filter(item => item.id !== box.id)]);
      preloadImage(box.image).catch(() => {});

      // ========== 第二阶段：Seed3D 铸成 3D 肉身（阻塞，铸成后才可拆盒） ==========
      let finalBox = box;
      try {
        finalBox = await forge3D(box);
        setGenPhase("3d-done");
        setModelStatus("done");
        setResult(finalBox);
        setGallery(current => current.map(item => (item.id === finalBox.id ? finalBox : item)));
        // 提前拉取模型，拆盒时即刻呈现
        if (finalBox.modelUrl) preload3D(finalBox.modelUrl);
      } catch (err) {
        console.warn("[3D] 铸造失败:", err);
        setGenPhase("3d-fallback");
        setGenFallback(true);
        setModelStatus("error");
        notify("3D 肉身铸造未成，本次以图鉴封面试开");
      }

      await sleep(650);
      setScreen("sealed");
    } catch (error) {
      setGenPhase("idle");
      notify(error instanceof Error ? error.message : "塑身失败");
      setTimeout(() => setScreen("home"), 1000);
    }
  };

  /** 结果页重新铸造 3D */
  const retry3D = async () => {
    if (!result) return;
    setModelStatus("queued");
    try {
      const patched = await forge3D(result);
      setModelStatus("done");
      setResult(current => (current && current.id === patched.id ? patched : current));
      setGallery(current => current.map(item => (item.id === patched.id ? patched : item)));
      notify("3D 肉身铸造完成");
    } catch (err) {
      console.warn("[3D] 重铸失败:", err);
      setModelStatus("error");
      notify("3D 铸造仍未成功，请稍后再试");
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
    genSeq.current++;
    setResult(item);
    setModelStatus(item.modelUrl ? "done" : "idle");
    setScreen("result");
  };

  // 手动返回首页时重置生成状态
  const goHome = () => {
    genSeq.current++;
    setGenPhase("idle");
    setGenAttempt(0);
    setGenFallback(false);
    setModelStatus("idle");
    setScreen("home");
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
          onHome={goHome}
        />
      )}

      {screen === "morph" && (
        <MorphScreen
          custom={selected?.pattern === "custom"}
          sound={sound}
          genPhase={genPhase}
          genAttempt={genAttempt}
          genFallback={genFallback}
          onHome={goHome}
        />
      )}

      {screen === "sealed" && (
        <SealedScreen
          roleName={selected?.name ?? ""}
          breaking={breaking}
          onBreak={breakSeal}
          onShare={share}
          onHome={goHome}
        />
      )}

      {screen === "result" && result && (
        <ResultScreen
          result={result}
          modelStatus={modelStatus}
          onRetry3D={retry3D}
          onHome={goHome}
          onAgain={() => goHome()}
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
