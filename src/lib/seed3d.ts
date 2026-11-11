// Seed3D 2.0 图生3D API 封装
// 文档: https://ark.volcengine.com/docs/3d-generation

const DEFAULT_MODEL = "doubao-seed3d-2-0-260328";
const DEFAULT_PARAMS = "--subdivisionlevel medium --fileformat glb";

function getKey(): string {
  return import.meta.env.VITE_ARK_API_KEY?.trim() ?? "";
}

function getBaseUrl(): string {
  return import.meta.env.VITE_ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
}

function getModel(): string {
  return import.meta.env.VITE_ARK_3D_MODEL || DEFAULT_MODEL;
}

/** 创建 3D 生成任务，返回任务 ID */
async function createTask(imageUrl: string): Promise<string> {
  const key = getKey();
  if (!key) throw new Error("未配置 VITE_ARK_API_KEY");

  const resp = await fetch(getBaseUrl() + "/contents/generations/tasks", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      content: [
        { type: "text", text: DEFAULT_PARAMS },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    }),
  });

  const text = await resp.text();
  let data: { id?: string; error?: { message?: string } } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!resp.ok || !data?.id) {
    throw new Error(`创建3D任务失败（${resp.status}）：${data?.error?.message || resp.statusText || text.slice(0, 300)}`);
  }

  return data.id;
}

/** 查询任务状态 */
async function getTask(taskId: string) {
  const key = getKey();
  const resp = await fetch(getBaseUrl() + "/contents/generations/tasks/" + taskId, {
    headers: { Authorization: "Bearer " + key },
  });
  const text = await resp.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  if (!resp.ok) {
    throw new Error(`查询3D任务失败（${resp.status}）：${text.slice(0, 300)}`);
  }
  return data as {
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    content?: { file_url?: string };
    error?: { message?: string };
  };
}

/** 轮询等待任务完成 */
export async function generate3D(
  imageUrl: string,
  onProgress?: (status: string, attempt: number) => void,
  maxAttempts = 30,
  intervalSec = 10,
): Promise<string> {
  console.log("[Seed3D] 开始创建任务, imageUrl:", imageUrl?.slice(0, 80));
  const taskId = await createTask(imageUrl);
  console.log("[Seed3D] 任务已创建:", taskId);
  onProgress?.("queued", 0);

  for (let i = 1; i <= maxAttempts; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r => setTimeout(r, intervalSec * 1000));
    // eslint-disable-next-line no-await-in-loop
    const task = await getTask(taskId);
    console.log(`[Seed3D] 第 ${i} 次查询, status:`, task.status);
    onProgress?.(task.status, i);

    if (task.status === "succeeded") {
      const url = task.content?.file_url;
      if (!url) throw new Error("3D 任务成功但未返回文件链接");
      console.log("[Seed3D] ✅ 成功拿到 GLB:", url.slice(0, 80));
      return url;
    }
    if (task.status === "failed") {
      throw new Error("3D 生成失败：" + (task.error?.message || "未知错误"));
    }
  }

  throw new Error(`3D 生成超时（${maxAttempts * intervalSec}s）`);
}
