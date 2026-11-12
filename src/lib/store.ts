/**
 * 本地持久化：
 * - localStorage 存图鉴元数据（id/标题/稀有度/日期，体积小）
 * - IndexedDB 存大文件（封面图 blob + 3D zip 的 ArrayBuffer）
 *
 * 解决两个过期问题：
 * 1. 页面刷新后 React state 清空
 * 2. 火山 TOS 签名 URL 24h 过期 → 文件落本地后永久可用
 */
import type { BoxResult } from "./types";
import { toProxyUrl } from "./proxy";

/** 无封面时用的占位图（注意：不要对它再做 encodeURIComponent，会二次转义导致颜色失效） */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#1a1d26"/><text x="50%" y="56%" font-size="120" text-anchor="middle" fill="#d3b479">悟</text></svg>`,
  );

const LS_KEY = "wukong-gallery-v1";
const DB_NAME = "wukong-store";
const DB_VERSION = 1;
const STORE = "assets";

/* ---------------- IndexedDB 极简封装 ---------------- */

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: Blob | ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key: string): Promise<Blob | ArrayBuffer | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as Blob | ArrayBuffer | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbKeys(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
    req.onerror = () => reject(req.error);
  });
}

/* ---------------- 图鉴元数据 ---------------- */

export type StoredBox = Omit<BoxResult, "image" | "modelUrl"> & {
  /** 本地是否已缓存封面 / 3D */
  hasImage: boolean;
  hasModel: boolean;
};

export function loadGalleryMeta(): StoredBox[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoredBox[]) : [];
  } catch {
    return [];
  }
}

function saveGalleryMeta(items: StoredBox[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 60))); // 最多留 60 条
    console.log("[store] 图鉴元数据已写入，共", Math.min(items.length, 60), "条");
  } catch (err) {
    console.error("[store] 图鉴元数据写入失败:", err);
  }
}

/* ---------------- 对外 API ---------------- */

const imageKey = (id: string) => `img:${id}`;
const modelKey = (id: string) => `model:${id}`;

/** 下载封面图并本地化，返回可持久使用的 blob URL */
export async function persistImage(id: string, remoteUrl: string): Promise<string> {
  // TOS 链接没有 CORS 头，必须走转发层，否则 fetch 直接失败
  const resp = await fetch(toProxyUrl(remoteUrl));
  if (!resp.ok) throw new Error(`封面下载失败 ${resp.status}`);
  const blob = await resp.blob();
  await idbSet(imageKey(id), blob);
  return URL.createObjectURL(blob);
}

/** 下载 3D zip 并本地化（保存压缩包字节，渲染时再解压） */
export async function persistModel(id: string, zipBuffer: ArrayBuffer): Promise<void> {
  await idbSet(modelKey(id), zipBuffer);
}

/** 读取本地封面；没有返回 null */
export async function loadLocalImage(id: string): Promise<string | null> {
  const data = await idbGet(imageKey(id));
  if (!data) return null;
  const blob = data instanceof Blob ? data : new Blob([data]);
  return URL.createObjectURL(blob);
}

/** 读取本地 3D zip 字节；没有返回 null */
export async function loadLocalModel(id: string): Promise<ArrayBuffer | null> {
  const data = await idbGet(modelKey(id));
  if (!data) return null;
  return data instanceof Blob ? data.arrayBuffer() : data;
}

/** 登记/更新一条图鉴元数据 */
export function upsertGalleryMeta(box: BoxResult, flags: { hasImage: boolean; hasModel: boolean }) {
  const items = loadGalleryMeta();
  const rest = items.filter(i => i.id !== box.id);
  const { image: _i, modelUrl: _m, ...meta } = box;
  rest.unshift({ ...meta, ...flags });
  saveGalleryMeta(rest);
}

/** 恢复图鉴：把本地缓存的封面/模型换回 blob URL，组装成完整 BoxResult */
export async function restoreGallery(): Promise<BoxResult[]> {
  let metas = loadGalleryMeta();

  // 自愈：IndexedDB 里有存档但元数据缺失时，补一条最小元数据
  // （封面缺失的模型无法展示封面，但仍可保留 3D 让图鉴能打开）
  try {
    const keys = await idbKeys();
    const knownIds = new Set(metas.map(m => m.id));
    const orphanIds = new Set<string>();
    for (const k of keys) {
      const m = k.match(/^(img|model):(.+)$/);
      if (m && !knownIds.has(m[2])) orphanIds.add(m[2]);
    }
    if (orphanIds.size > 0) {
      console.warn("[store] 发现无元数据的存档，自动补登:", [...orphanIds]);
      for (const id of orphanIds) {
        const hasImage = keys.includes(imageKey(id));
        const hasModel = keys.includes(modelKey(id));
        metas.push({
          id,
          roleName: "往昔一念",
          title: "往昔一念",
          rarity: "common",
          createdAt: Date.now(),
          hasImage,
          hasModel,
        });
      }
      saveGalleryMeta(metas);
    }
  } catch (err) {
    console.warn("[store] 自愈扫描失败:", err);
  }

  const out: BoxResult[] = [];
  for (const m of metas) {
    let image = m.hasImage ? await loadLocalImage(m.id) : null;
    // 没有封面时给一张占位图，保证条目能出现在图鉴里
    if (!image) image = PLACEHOLDER_IMAGE;
    const hasModel = m.hasModel ? (await loadLocalModel(m.id)) !== null : false;
    out.push({
      id: m.id,
      roleName: m.roleName,
      title: m.title,
      rarity: m.rarity,
      createdAt: m.createdAt,
      image,
      // 模型恢复为特殊协议，ModelViewer 识别后从 IndexedDB 取字节
      modelUrl: hasModel ? `local://${m.id}` : undefined,
    });
  }
  return out;
}
