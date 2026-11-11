import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 自定义 Vite plugin：在 dev server 上加一个 /api/tos-proxy?url=xxx 接口
// 解决火山引擎 TOS CDN 下载链接不支持 CORS 的问题
function tosProxyPlugin() {
  return {
    name: "tos-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tos-proxy", async (req, res) => {
        try {
          const url = new URL(req.url, "http://localhost");
          const target = url.searchParams.get("url");
          if (!target || !target.includes("tos-cn-beijing.volces.com")) {
            res.statusCode = 400;
            res.end("Missing or invalid url param");
            return;
          }

          console.log("[TOS Proxy] →", target.slice(0, 80));
          const upstream = await fetch(target);
          const buf = await upstream.arrayBuffer();

          res.setHeader("Content-Type", "application/zip");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Content-Length", buf.byteLength.toString());
          res.statusCode = upstream.status;
          res.end(Buffer.from(buf));
        } catch (e) {
          console.error("[TOS Proxy] Error:", e);
          res.statusCode = 502;
          res.end("Proxy error: " + (e && e.message ? e.message : e));
        }
      });
    },
  };
}

// 部署到 GitHub Pages 项目页：https://ziqingchuan.github.io/wukong-wanxiang-live/
// 构建时使用仓库子路径，开发时仍走根路径。
export default defineConfig(({ command, mode }) => ({
  base: command === "build" && mode !== "sites" ? "/wukong-wanxiang-live/" : "/",
  plugins: [react(), tosProxyPlugin()],
}));
