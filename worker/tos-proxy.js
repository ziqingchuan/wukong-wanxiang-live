/**
 * 火山引擎 TOS 转发 Worker
 *
 * 作用：TOS 的临时下载链接不返回 CORS 头，浏览器无法直接 fetch。
 * 这里做一层同源转发，并只允许 volces.com 域名，避免变成公开代理。
 *
 * 用法：GET /?url=<encodeURIComponent(完整TOS链接)>
 */

const ALLOWED_HOST = "volces.com";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

function isAllowed(hostname) {
  return hostname === ALLOWED_HOST || hostname.endsWith(`.${ALLOWED_HOST}`);
}

function text(message, status) {
  return new Response(message, {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return text("Method Not Allowed", 405);
    }

    const target = new URL(request.url).searchParams.get("url");
    if (!target) return text("Missing url param", 400);

    let upstreamUrl;
    try {
      upstreamUrl = new URL(target);
    } catch {
      return text("Invalid url param", 400);
    }
    if (upstreamUrl.protocol !== "https:") return text("Only https is allowed", 400);
    if (!isAllowed(upstreamUrl.hostname)) return text("Host not allowed", 403);

    const upstream = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: { Accept: "*/*" },
    });

    const headers = new Headers(CORS_HEADERS);
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);
    headers.set("Cache-Control", "public, max-age=86400");

    // 直接透传流，避免把几十 MB 的 zip 读进 Worker 内存
    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};
