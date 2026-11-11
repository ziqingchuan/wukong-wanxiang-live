import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RotateCcw } from "lucide-react";
import JSZip from "jszip";

type Props = {
  // Seed3D 返回的 zip 文件下载链接
  zipUrl: string;
};

/** 将外部 TOS CDN URL 转成走转发层（dev 用 Vite 中间件，线上用 Cloudflare Worker） */
function toProxyUrl(url: string): string {
  // 线上：构建时注入的 Worker 地址，如 https://wukong-tos-proxy.xxx.workers.dev
  const workerBase = import.meta.env.VITE_TOS_PROXY;
  if (workerBase) {
    return `${String(workerBase).replace(/\/+$/, "")}/?url=${encodeURIComponent(url)}`;
  }
  // 本地：Vite dev server 中间件
  if (import.meta.env.DEV) {
    return `/api/tos-proxy?url=${encodeURIComponent(url)}`;
  }
  console.warn("[ModelViewer] 未配置 VITE_TOS_PROXY，浏览器直连 TOS 会因跨域失败");
  return url;
}

/** 同一个 zip 只解析一次，避免重复下载几十 MB */
const glbCache = new Map<string, Promise<string>>();

/** 下载 zip → 解压 → 找到 glb 文件 → 返回 blob URL */
function resolveZipToGlbUrl(zipUrl: string): Promise<string> {
  const cached = glbCache.get(zipUrl);
  if (cached) return cached;

  const task = (async () => {
    const fetchUrl = toProxyUrl(zipUrl);
    console.log("[ModelViewer] 开始下载 zip:", fetchUrl.slice(0, 80));
    const resp = await fetch(fetchUrl);
    if (!resp.ok) throw new Error(`下载3D文件失败（${resp.status}）`);
    const arrayBuffer = await resp.arrayBuffer();

    const zip = await JSZip.loadAsync(arrayBuffer);
    // 找第一个 .glb 文件
    const glbEntry = Object.entries(zip.files).find(([name]) =>
      name.toLowerCase().endsWith(".glb") && !zip.files[name].dir,
    );
    if (!glbEntry) {
      const gltfFiles = Object.keys(zip.files).filter(n => n.toLowerCase().endsWith(".gltf"));
      if (gltfFiles.length > 0) {
        throw new Error("压缩包里是 gltf 格式，暂不支持");
      }
      throw new Error("压缩包里未找到 .glb 文件");
    }

    const [name, entry] = glbEntry;
    const glbBuffer = await entry.async("arraybuffer");
    console.log("[ModelViewer] 解压得到 GLB:", name, Math.round(glbBuffer.byteLength / 1024 / 1024) + "MB");
    const blob = new Blob([glbBuffer], { type: "model/gltf-binary" });
    return URL.createObjectURL(blob);
  })();

  glbCache.set(zipUrl, task);
  task.catch(() => glbCache.delete(zipUrl));
  return task;
}

/** 提前下载并解压，让拆盒瞬间就能看到 3D */
export function preload3D(zipUrl: string) {
  resolveZipToGlbUrl(zipUrl).catch(() => {});
}

function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef<THREE.Group | null>(null);

  const cloned = useMemo(() => {
    const scene = gltf.scene.clone();
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 按高度归一化到 2.0，超宽/超深时再收一档，保证不出画
    const scale = Math.min(
      2.0 / Math.max(size.y, 0.001),
      2.6 / Math.max(size.x, 0.001),
      2.6 / Math.max(size.z, 0.001),
    );

    scene.scale.setScalar(scale);
    // 水平居中，底部落在 y=0（站在地台上）
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    return scene;
  }, [gltf]);

  return <primitive ref={modelRef} object={cloned} />;
}

function LoadingFallback({ status, error }: { status: string; error?: string | null }) {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "grid", placeItems: "center",
      color: error ? "#b95648" : "#d3b479", fontSize: 13, textAlign: "center",
    }}>
      <div>
        {error ? (
          <>
            <div style={{ fontSize: 28 }}>⚠️</div>
            <div style={{ marginTop: 10, color: "#b95648" }}>{error}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, animation: "pulse 1.5s ease-in-out infinite" }}>◐</div>
            <div style={{ marginTop: 10, letterSpacing: "0.15em" }}>{status}</div>
          </>
        )}
      </div>
    </div>
  );
}

/** 用内置房间环境生成 PBR 环境光照，不依赖外部 HDR 文件 */
function RoomEnv() {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    return () => {
      scene.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

export default function ModelViewer({ zipUrl }: Props) {
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("正在下载 3D 灵体…");
  // 默认缓慢自转，用户一旦拖动就交出完全控制权
  const [autoSpin, setAutoSpin] = useState(true);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGlbUrl(null);
    setError(null);
    setStatus("正在下载 3D 灵体…");

    resolveZipToGlbUrl(zipUrl)
      .then(url => {
        if (!cancelled) {
          setGlbUrl(url);
          setStatus("灵体载入中…");
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("[ModelViewer] 解压失败:", err);
          setError(err.message || "3D 灵体载入失败");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipUrl]);

  // 操作提示常驻（拖动时淡出），保证用户随时知道可以旋转
  return (
    <div
      className={`model-viewer${dragging ? " is-dragging" : ""}`}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      {!glbUrl && <LoadingFallback status={status} error={error} />}
      {glbUrl && (
        <Canvas
          camera={{ position: [0, 1.35, 3.3], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          style={{ touchAction: "none" }}
        >
          {/* 背景交给外层 CSS 渐变，Canvas 保持透明 */}
          <ambientLight intensity={0.35} />
          <hemisphereLight args={["#cfd8ff", "#2a2118", 0.55]} />
          {/* 主光 */}
          <directionalLight position={[4, 7, 4]} intensity={2.0} />
          {/* 冷色轮廓光，勾出边缘 */}
          <directionalLight position={[-4.5, 3, -2.5]} intensity={1.5} color="#8fd0ff" />
          {/* 暖色背光，让紫色/金色材质有体积 */}
          <directionalLight position={[1, 2.5, -5]} intensity={1.3} color="#ffd6a0" />
          {/* 底部反弹光，避免下颌/裙摆死黑 */}
          <pointLight position={[0, -0.6, 1.8]} intensity={0.6} color="#d3b479" />
          <RoomEnv />

          <Suspense fallback={null}>
            <Model url={glbUrl} />
          </Suspense>

          {/* 接触阴影：让手办真正"站在"台面上 */}
          <ContactShadows
            position={[0, 0.005, 0]}
            scale={6}
            far={2.6}
            blur={2.2}
            opacity={0.62}
            resolution={512}
            color="#000000"
          />

          <OrbitControls
            makeDefault
            target={[0, 1.0, 0]}
            enableZoom
            enablePan={false}
            minDistance={1.5}
            maxDistance={6}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            autoRotate={autoSpin}
            autoRotateSpeed={1.1}
            rotateSpeed={0.78}
            zoomSpeed={0.7}
            enableDamping
            dampingFactor={0.06}
            onStart={() => {
              setAutoSpin(false);
            }}
          />
        </Canvas>
      )}
      {glbUrl && (
        <div className="model-hint" aria-hidden="true">
          <RotateCcw size={12} strokeWidth={1.9} />
          <span>按住拖动旋转 · 滚轮缩放</span>
        </div>
      )}
    </div>
  );
}
