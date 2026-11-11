import { WUKONG_REFERENCE } from "./wukong-reference";
import type { BoxResult, Rarity, Role } from "./types";

export function getArkKey(): string {
  return import.meta.env.VITE_ARK_API_KEY?.trim() ?? "";
}

const RARITY_META: Record<Rarity, { name: string; finish: string }> = {
  legendary: {
    name: "珍品传说款",
    finish: "珍品传说款：鎏金、透明树脂与虹彩漆融合，戏剧化动作，专属光环、双层情景底座和丰富限定配件，具有最高收藏级别。",
  },
  rare: {
    name: "稀有款",
    finish: "稀有款：紫晶珠光与局部透明树脂材质，动态姿态，专属道具和情景底座。",
  },
  common: {
    name: "普通款",
    finish: "普通款：经典PVC搪胶材质，鲜明角色动作，简洁圆形收藏底座。",
  },
};

function buildPrompt(roleName: string, rarity: Rarity) {
  return `以参考图中的原创悟空猴子为主体，设计与「${roleName}」深度融合的完整3D盲盒手办。必须保留参考图悟空的核心造型、圆脸、大眼、猴耳、卷尾、金色祥云头箍、红色围巾、原有表情气质与整体辨识度；同时准确提取「${roleName}」的角色形象、发型或头部轮廓、服装元素、标志配件、人物性格、主色调和辅助配色，并进行立体化设计。融合需要自然统一，不能只是简单换装。${RARITY_META[rarity].finish} 手办为PVC软质塑料，表面细腻哑光，边缘干净，五官精致但不改变原图角色特征。产品摄影构图，手办在前景正中央，正面三分之四视角，完整展示全身、配件和底座，轻微接触阴影，高清商业级PBR渲染。输出必须为真正透明背景的PNG RGBA图像：除手办、配件、底座和轻微接触阴影外，画布所有区域（特别是四个角）alpha值必须为0。不要环境、不要渐变或纯色背景、不要摄影棚背景、不要文字、不要logo、不要水印、不要包装盒。`;
}

export async function generateBox(role: Role): Promise<BoxResult> {
  const apiKey = getArkKey();
  if (!apiKey) throw new Error("未配置 VITE_ARK_API_KEY");

  const baseUrl = import.meta.env.VITE_ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  const model = import.meta.env.VITE_ARK_MODEL || "doubao-seedream-5-0-pro-260628";

  const roll = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  // 60% 普通款 / 25% 稀有款 / 15% 珍品传说款
  const rarity: Rarity = roll < 0.15 ? "legendary" : roll < 0.4 ? "rare" : "common";
  const roleName = role.name.trim().slice(0, 30);
  const title = roleName + " · " + RARITY_META[rarity].name;

  console.time("[ARK] 生图耗时");
  console.log("[ARK] 开始生图:", roleName, rarity, "model:", model);

  const upstream = await fetch(baseUrl + "/images/generations", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(roleName, rarity),
      image: WUKONG_REFERENCE,
      size: "2K",
      output_format: "png",
      background: "transparent",
      response_format: "url",
      watermark: false,
    }),
  });

  const responseText = await upstream.text();
  let data: { data?: Array<{ url?: string }>; error?: { message?: string; code?: string } } | null = null;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = null;
  }

  if (!upstream.ok || !data?.data?.[0]?.url) {
    console.error("[ARK] generation failed", upstream.status, responseText.slice(0, 2000));
    const detail = data?.error?.message || upstream.statusText || "图片生成未成功";
    throw new Error(`生图失败（${upstream.status}）：${detail}`);
  }

  console.timeEnd("[ARK] 生图耗时");
  console.log("[ARK] ✅ 生图成功, url:", data.data[0].url.slice(0, 80));

  return {
    id: crypto.randomUUID(),
    roleName,
    title,
    rarity,
    image: data.data[0].url,
    createdAt: Date.now(),
  };
}
