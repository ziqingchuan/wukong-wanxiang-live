/**
 * 火山 TOS 资源转发。
 * TOS 的临时链接不返回 CORS 头，浏览器无法直接 fetch：
 * - 线上走 Cloudflare Worker（VITE_TOS_PROXY）
 * - 本地走 Vite dev server 的 /api/tos-proxy 中间件
 */
export function toProxyUrl(url: string): string {
  const workerBase = import.meta.env.VITE_TOS_PROXY;
  if (workerBase) {
    return `${String(workerBase).replace(/\/+$/, "")}/?url=${encodeURIComponent(url)}`;
  }
  if (import.meta.env.DEV) {
    return `/api/tos-proxy?url=${encodeURIComponent(url)}`;
  }
  console.warn("[proxy] 未配置 VITE_TOS_PROXY，浏览器直连 TOS 会因跨域失败");
  return url;
}
