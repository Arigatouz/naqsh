export type BgFilter = {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  grayscale: number;
  sepia: number;
};

export type Background = {
  mode: "color" | "gradient" | "image";
  color: string;
  from: string;
  to: string;
  angle: number;
  image?: string;
  transparent: boolean;
  filter: BgFilter;
};

export type Stroke = {
  color: string;
  size: number;
  opacity: number;
  erase: boolean;
  points: { x: number; y: number }[];
};

type Base = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
};

export type TextEl = Base & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 700;
  color: string;
  align: "right" | "center" | "left";
  dir: "rtl" | "ltr";
  letterSpacing: number;
  lineHeight: number;
  stroke: string;
  strokeWidth: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  textBg: string;
  radius: number;
};

export type ShapeKind = "rect" | "round" | "circle" | "triangle" | "line";

export type ShapeEl = Base & {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
};

export type StickerEl = Base & {
  type: "sticker";
  sticker: string;
  color: string;
};

export type ImageEl = Base & {
  type: "image";
  src: string;
};

export type DrawEl = Base & {
  type: "draw";
  strokes: Stroke[];
};

export type DesignElement = TextEl | ShapeEl | StickerEl | ImageEl | DrawEl;

export type Project = {
  id: string;
  name: string;
  updatedAt: number;
  w: number;
  h: number;
  bg: Background;
  elements: DesignElement[];
};

export type Category = "مناسبات" | "تعليم" | "اقتباسات" | "تجارة" | "قصص" | "هوية";

export type Template = {
  id: string;
  name: string;
  category: Category;
  project: Project;
};

export const SWATCHES = [
  "#f6f1e7",
  "#14120e",
  "#e0a84a",
  "#ffffff",
  "#000000",
  "#6e2430",
  "#1d4d3e",
  "#1d3557",
  "#c4623a",
  "#5c3d55",
];

export const PHRASES = [
  "كل عام وأنتم بخير",
  "عيد مبارك",
  "جمعة مباركة",
  "رمضان كريم",
  "تهانينا",
  "عرض خاص",
  "خصم اليوم",
  "افتتاح قريب",
  "للبيع",
  "نتشرف بدعوتكم",
  "شكراً لثقتكم",
  "جودة تثقون بها",
  "أحسنت يا بطل",
  "فخورون بك",
  "نجمة الأسبوع",
  "واصل تميّزك",
  "شكراً لجهودك",
  "طالب متميز",
];

export const SIZES: { id: string; name: string; hint: string; w: number; h: number; transparent?: boolean }[] = [
  { id: "square", name: "مربع", hint: "1:1", w: 1080, h: 1080 },
  { id: "post", name: "بوست", hint: "4:5", w: 1080, h: 1350 },
  { id: "story", name: "قصة", hint: "9:16", w: 1080, h: 1920 },
  { id: "cover", name: "غلاف", hint: "16:9", w: 1920, h: 1080 },
  { id: "logo", name: "شعار", hint: "شفاف", w: 1080, h: 1080, transparent: true },
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export function identityFilter(): BgFilter {
  return { brightness: 1, contrast: 1, saturate: 1, blur: 0, grayscale: 0, sepia: 0 };
}

export function defaultBg(transparent = false): Background {
  return {
    mode: "color",
    color: "#17140f",
    from: "#2a2118",
    to: "#14120e",
    angle: 160,
    transparent,
    filter: identityFilter(),
  };
}

export function filterCss(filter: BgFilter): string {
  return `brightness(${filter.brightness}) contrast(${filter.contrast}) saturate(${filter.saturate}) blur(${filter.blur}px) grayscale(${filter.grayscale}) sepia(${filter.sepia})`;
}

export function hexLuma(hex: string): number {
  const raw = hex.replace("#", "").trim();
  if (raw.length < 6) return 0;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function bgLooksLight(bg: Background): boolean {
  if (bg.transparent || bg.mode === "image") return false;
  return hexLuma(bg.mode === "gradient" ? bg.from : bg.color) > 165;
}

function base(id: string, name: string): Base {
  return { id, name, x: 0, y: 0, w: 100, h: 100, rotation: 0, opacity: 1, locked: false, hidden: false };
}

export function makeText(
  init: Partial<TextEl> & { text: string; x: number; y: number; w: number; fontSize: number },
): TextEl {
  const { type: _type, ...rest } = init;
  return {
    ...base(rest.id ?? uid(), rest.name ?? (rest.text.slice(0, 24) || "نص")),
    h: Math.round(rest.fontSize * 1.8),
    fontFamily: "Cairo",
    fontWeight: 700,
    color: "#f6f1e7",
    align: "center",
    dir: "rtl",
    letterSpacing: 0,
    lineHeight: 1.35,
    stroke: "#14120e",
    strokeWidth: 0,
    shadow: false,
    shadowColor: "#000000",
    shadowBlur: 18,
    textBg: "transparent",
    radius: 14,
    ...rest,
    type: "text",
  };
}

export function makeShape(
  init: Partial<ShapeEl> & { shape: ShapeKind; x: number; y: number; w: number; h: number },
): ShapeEl {
  const { type: _type, ...rest } = init;
  return {
    ...base(rest.id ?? uid(), rest.name ?? "شكل"),
    fill: "#e0a84a",
    stroke: "#e0a84a",
    strokeWidth: 0,
    radius: 24,
    ...rest,
    type: "shape",
  };
}

export function makeSticker(
  init: Partial<StickerEl> & { sticker: string; x: number; y: number; w: number; h: number },
): StickerEl {
  const { type: _type, ...rest } = init;
  return {
    ...base(rest.id ?? uid(), rest.name ?? "ملصق"),
    color: "#e0a84a",
    ...rest,
    type: "sticker",
  };
}

export function blankProject(w: number, h: number, transparent = false, name = "تصميم جديد"): Project {
  return {
    id: uid(),
    name,
    updatedAt: Date.now(),
    w,
    h,
    bg: defaultBg(transparent),
    elements: [],
  };
}

export function cloneProject(project: Project, name?: string): Project {
  const copy = structuredClone(project);
  copy.id = uid();
  copy.updatedAt = Date.now();
  if (name) copy.name = name;
  copy.elements = copy.elements.map((el) => ({ ...el, id: uid() }));
  return copy;
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Project;
  return typeof p.id === "string" && typeof p.w === "number" && typeof p.h === "number" && Array.isArray(p.elements) && !!p.bg;
}
