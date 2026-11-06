# 悟空万象盲盒

纯前端项目：React + Vite，无需任何服务端、数据库或对象存储。生图直接由浏览器调用火山方舟（豆包）图片生成接口。

## 运行

```bash
npm install
npm run dev                  # http://127.0.0.1:5173
```

生图 Key 与模型已配置在 `.env.local`（该文件被 git 忽略，不会提交）：

```bash
VITE_ARK_API_KEY=ark-...
VITE_ARK_MODEL=doubao-seedream-5-0-pro-260628
```

## 构建与部署

```bash
npm run build     # 产物在 dist/，可放任意静态托管（GitHub Pages、Vercel、OSS 等）
npm run preview   # 本地预览构建产物
npm run deploy    # 构建并推送到 gh-pages 分支（GitHub Pages）
```

GitHub Pages 项目页地址：`https://ziqingchuan.github.io/wukong-wanxiang-live/`。
`vite.config.ts` 在构建时使用 `base: "/wukong-wanxiang-live/"`，开发时仍为 `/`。

首次部署：

```bash
git remote add origin https://github.com/ziqingchuan/wukong-wanxiang-live.git
npm run deploy
```

然后在仓库 Settings → Pages 中把 Source 设为 `gh-pages` 分支。

生图 Key 的注入方式：`npm run deploy` 会先执行 `npm run build`，Vite 在构建时把 `.env.local` 里的 `VITE_ARK_API_KEY` 内联进 JS，所以部署后访客可以直接使用，无需在页面填写。注意：纯前端构建产物里的 Key 对所有访客可见，请给该 Key 设置用量或额度上限。

## 目录

- `src/App.tsx`：页面状态机（择丹 → 塑身 → 封盒 → 结果 → 图鉴）
- `src/components/`：首页、塑形页、封盒页、结果页、图鉴抽屉、弹窗
- `src/lib/ark.ts`：火山方舟生图调用与稀有度、提示词
- `src/lib/roles.ts`：角色丹与塑身咒语
- `src/lib/image.ts`：图片预加载与白底转透明
- `public/assets/`：视觉素材

## 说明

- 图鉴与剩余机会只存在于当前页面会话，刷新即清空，不做持久化。
- 纯前端模式下 API Key 会被打进构建产物并从浏览器发出，本地自用没问题；如果要公开部署，建议换成使用者的 Key 或加一层免费代理。
