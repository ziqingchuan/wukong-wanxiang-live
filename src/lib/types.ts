export type Role = {
  name: string;
  pattern: string;
  color: string;
  rgb: string;
  trait: string;
};

export type Rarity = "common" | "rare" | "legendary";

export type BoxResult = {
  id: string;
  roleName: string;
  title: string;
  rarity: Rarity;
  image: string;       // Seedream 生图，用作图鉴封面
  modelUrl?: string;    // Seed3D 生成的 GLB 文件下载链接
  createdAt: number;
};
