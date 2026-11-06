import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 部署到 GitHub Pages 项目页：https://ziqingchuan.github.io/wukong-wanxiang-live/
// 构建时使用仓库子路径，开发时仍走根路径。
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/wukong-wanxiang-live/" : "/",
  plugins: [react()],
}));
