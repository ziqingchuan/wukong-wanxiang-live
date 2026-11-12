import type { Role } from "./types";

export const BASE_ROLES: Role[] = [
  { name: "蜡笔小新", pattern: "swirl", color: "#b95648", rgb: "185,86,72", trait: "红黄童趣 · 调皮行动派", expression: "眉毛上挑、咧嘴坏笑，眼神狡黠又天真" },
  { name: "Hello Kitty", pattern: "bow", color: "#b85d7a", rgb: "184,93,122", trait: "蝴蝶结轮廓 · 温柔甜系", expression: "眼神柔和含笑、嘴角浅浅上扬的乖巧神情" },
  { name: "史迪奇", pattern: "stars", color: "#476f91", rgb: "71,111,145", trait: "深海蓝紫 · 顽皮外星感", expression: "圆眼瞪大、咧嘴露齿，透着一股捣蛋的机灵劲" },
  { name: "海绵宝宝", pattern: "grid", color: "#b69a45", rgb: "182,154,69", trait: "明黄方形元素 · 乐观活力", expression: "眼睛睁得溜圆发亮、张嘴大笑的乐观神情" },
  { name: "库洛米", pattern: "jester", color: "#735593", rgb: "115,85,147", trait: "黑紫恶魔帽 · 反差甜酷", expression: "半眯着眼、嘴角勾起的甜酷坏笑" },
  { name: "漩涡鸣人", pattern: "flame", color: "#a35e37", rgb: "163,94,55", trait: "橙黑忍装 · 热血坚韧", expression: "眼神坚毅发亮、咧嘴自信笑的热血神情" },
  { name: "名侦探柯南", pattern: "bowtie", color: "#3f617d", rgb: "63,97,125", trait: "蓝西装与领结 · 冷静推理", expression: "眉头微蹙、目光锐利专注的冷静推理神情" },
  { name: "哆啦A梦", pattern: "bell", color: "#397b8d", rgb: "57,123,141", trait: "蓝白圆润 · 未来道具感", expression: "眼睛圆圆的好奇表情、嘴角温和的憨厚微笑" },
  { name: "美少女战士", pattern: "crescent", color: "#8a5f82", rgb: "138,95,130", trait: "月亮冠饰 · 华丽守护感", expression: "眼眸明亮坚定、下巴微扬的自信优雅神情" },
  { name: "小黄人", pattern: "goggle", color: "#a58b42", rgb: "165,139,66", trait: "黄蓝工装 · 搞怪机械感", expression: "眼睛瞪圆呆萌、咧嘴傻乐的搞怪神情" },
];

export function createCustomRole(name: string): Role {
  return {
    name,
    pattern: "custom",
    color: "#8b7550",
    rgb: "139,117,80",
    trait: "自炼角色 · 专属万象融合",
    expression: `神态由「${name}」这个名字传达的气质自然生成，可与参考图完全不同`,
  };
}

type VersePool = { weight: number; lines: string[] };

export const COMMON_VERSE_POOLS: VersePool[] = [
  { weight: 50, lines: ["一念落印，躯壳方生", "灵识为根，万象为形", "心有所向，身即随之", "印落方寸，幻骨初凝", "灵息缓缓，骨肉将成", "以念铸骸，以识绘容", "神藏于内，形显于外", "此念不熄，形骸不散", "方寸灵印，承载幻身", "识海翻涌，形貌渐生", "一念入丹，化万千相", "神意凝时，皮肉方聚", "灵根既定，万象来赴", "心印无声，塑骨有形", "寄一念于丹，化幻身于世", "神随念转，形由识生", "丹承一念，幻相将显", "灵息游走，脉络初成", "无固定相，唯念是从", "一念起处，身相萌生", "印驻掌心，幻躯待醒", "识为薪火，形为余烬", "心之所慕，形之所向", "灵丹沉敛，蓄势成形", "神念交织，皮肉渐凝"] },
  { weight: 25, lines: ["万象无定，唯念可塑", "不借凡胎，只凭心印", "诸相皆幻，一念可成", "世间万影，皆可入丹", "取万象之姿，铸悟空之躯", "形不拘一格，念不分远近", "凡所见相，皆可叩印", "借他者影，塑此身容", "万相流转，一念承接", "丹纳千影，印定一形", "相由念取，形随印生", "不取真身，只取意韵", "万象同归，归于一念", "影入丹府，骨相自具", "道无定形，念即是形"] },
  { weight: 20, lines: ["借星际之影，凝一身鲜活", "碧海长风，藏于一念之间", "奇思入丹，幻作玲珑之相", "月色入印，清辉附形", "弧光流转，铸俏皮之骸", "江湖旧事，凝作一身风骨", "童心未泯，幻相自生", "星尘漫卷，附于灵躯", "梦中之物，亦可化形", "风随影至，容由意生", "烂漫心意，凝作幻身", "千般趣相，尽归此丹", "异域灵影，赴此印约", "微光一点，幻出万千模样", "尘间诸趣，皆可塑身"] },
  { weight: 5, lines: ["静待形开", "神意将显", "幻相待生", "一念相候", "影自远方来", "形将破晦而出", "丹光敛，幻容生", "静候万象显", "心印不语", "幻身将醒"] },
];

export const CUSTOM_VERSE_POOLS: VersePool[] = [
  { weight: 45, lines: ["不借他影，自炼一念", "心为丹炉，意作灵材", "以我心念，铸我幻形", "识海自生，不假外求", "一念由我，形自心生", "丹火自心起，躯相随意成", "方寸心炉，熔炼本相", "无籍万象，独守己心", "神思辗转，自筑骨骸", "我意所至，身相随之", "心印自持，不循旧影", "灵苗内生，不必外寻", "凭一己神思，塑无名之躯", "念起于我，形归于我", "心炉缓缓，幻骨初凝", "本念无摹，自显真容", "所思即相，所想即形", "一意独明，幻躯待成"] },
  { weight: 10, lines: ["万象可弃，唯己念为宗", "不取世间旧影，只承心中本愿", "相无范本，念无定规", "道随心意，形不由人", "凡心之所想，皆可入丹成相", "不循他者形貌，只顺本心所向", "一念无拘，万相由己", "丹纳己思，不借尘影", "形无定式，我意即是准则", "心之所寄，便可塑身"] },
  { weight: 25, lines: ["揽心底风月，凝一寸幻身", "藏私梦于丹，化无形为相", "心底星河，随念赴印", "拾心上闲云，铸此身轮廓", "所思山海，渐入形骸", "一隅心景，凝作躯容", "私藏意趣，缓缓成形", "取梦中光景，塑独一之相", "心中风物，皆化为形", "一念里的远方，即将显化", "幽思漫卷，附于灵躯", "独属于你的意，慢慢成型"] },
  { weight: 20, lines: ["炼己一念", "随心赋形", "我意将显", "心炉待绽", "独铸本相", "一念自守", "静待心相", "意自无拘", "心影初生", "随念而生", "本念将出", "以心为印"] },
];

export function drawWeightedVerse(pools: VersePool[], lastVerse: string): string {
  let roll = Math.random() * pools.reduce((sum, pool) => sum + pool.weight, 0);
  const pool = pools.find(item => (roll -= item.weight) <= 0) || pools[0];
  let line = pool.lines[Math.floor(Math.random() * pool.lines.length)];
  if (line === lastVerse && pool.lines.length > 1) {
    line = pool.lines[(pool.lines.indexOf(line) + 1) % pool.lines.length];
  }
  return line;
}
