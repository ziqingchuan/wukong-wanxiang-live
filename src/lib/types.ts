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
  image: string;
  createdAt: number;
};
