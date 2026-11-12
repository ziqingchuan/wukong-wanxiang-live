import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// RoomEnvironment 弃用：它的"白色摄影棚"会把 PBR 材质全方位洗白
import { RotateCcw } from "lucide-react";
import JSZip from "jszip";
import { loadLocalModel } from "../lib/store";
import { toProxyUrl } from "../lib/proxy";

type Props = {
  // Seed3D 返回的 zip 文件下载链接，或 local://<id>（从 IndexedDB 读）
  zipUrl: string;
};

/** 同一个 zip 只解析一次，避免重复下载几十 MB */
const glbCache = new Map<string, Promise<string>>();

/** 获取 zip 字节：local:// 从 IndexedDB 读，否则走转发层下载 */
async function fetchZipBytes(zipUrl: string): Promise<ArrayBuffer> {
  if (zipUrl.startsWith("local://")) {
    const id = zipUrl.slice("local://".length);
    const buf = await loadLocalModel(id);
    if (!buf) throw new Error("本地未找到该 3D 存档");
    return buf;
  }
  const fetchUrl = toProxyUrl(zipUrl);
  console.log("[ModelViewer] 开始下载 zip:", fetchUrl.slice(0, 80));
  const resp = await fetch(fetchUrl);
  if (!resp.ok) throw new Error(`下载3D文件失败（${resp.status}）`);
  return resp.arrayBuffer();
}

/** 下载/读取 zip → 解压 → 找到 glb 文件 → 返回 blob URL */
function resolveZipToGlbUrl(zipUrl: string): Promise<string> {
  const cached = glbCache.get(zipUrl);
  if (cached) return cached;

  const task = (async () => {
    const arrayBuffer = await fetchZipBytes(zipUrl);

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

/** 下载 zip 原始字节（用于持久化到 IndexedDB）；local:// 直接读本机 */
export async function fetchZipRaw(zipUrl: string): Promise<ArrayBuffer> {
  return fetchZipBytes(zipUrl);
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

/**
 * 摄影棚环境：深色底 + 三块柔光箱
 * 深色底保证漫反射不被洗白，柔光箱负责给金属/漆面拉出高光，
 * 这样金色会有光泽而不是一片死灰。
 */
function StudioEnv() {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);

  useEffect(() => {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#0c0e13");

    const softbox = (color: string, w: number, h: number, pos: [number, number, number], rot: [number, number, number]) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color }),
      );
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      envScene.add(mesh);
      return mesh;
    };

    // 顶部主柔光箱：正面高光
    softbox("#e8f0ff", 7, 7, [0, 6, 1], [Math.PI / 2, 0, 0]);
    // 左侧暖光条：金色材质的高光
    softbox("#ffcf8a", 5, 7, [-6, 2, 1], [0, Math.PI / 2, 0]);
    // 右侧冷光条：轮廓冷反射
    softbox("#8fc4ff", 5, 7, [6, 2, -1], [0, -Math.PI / 2, 0]);

    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(envScene, 0.03).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 1.3;

    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      envMap.dispose();
      pmrem.dispose();
      envScene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
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
          gl={{
            antialias: true,
            alpha: true,
            // ACES 电影级色调映射：亮部平滑滚降，白色材质能保住层次
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
          }}
          dpr={[1, 2]}
          style={{ touchAction: "none" }}
        >
          {/* 背景交给外层 CSS 渐变，Canvas 保持透明 */}
          <ambientLight intensity={0.46} />
          <hemisphereLight args={["#cfd8ff", "#2a2118", 0.5]} />
          {/* 主光 */}
          <directionalLight position={[4, 7, 4]} intensity={1.3} />
          {/* 冷色轮廓光，勾出边缘 */}
          <directionalLight position={[-4.5, 3, -2.5]} intensity={0.8} color="#8fd0ff" />
          {/* 暖色背光，让紫色/金色材质有体积 */}
          <directionalLight position={[1, 2.5, -5]} intensity={0.8} color="#ffd6a0" />
          {/* 底部反弹光，避免下颌/裙摆死黑 */}
          <pointLight position={[0, -0.6, 1.8]} intensity={0.5} color="#d3b479" />
          <StudioEnv />

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
