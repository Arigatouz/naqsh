function star(points: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const STAR8 = star(8, 46, 19);
const STAR12 = star(12, 46, 30);

const INNER: Record<string, string> = {
  najm: `<polygon points="${STAR8}" fill="currentColor"/>`,
  khatm: `<polygon points="${STAR12}" fill="currentColor"/><circle cx="50" cy="50" r="8" fill="currentColor" fill-opacity="0.35"/>`,
  hilal: `<defs><mask id="cres-UID"><rect width="100" height="100" fill="black"/><circle cx="46" cy="50" r="34" fill="white"/><circle cx="62" cy="42" r="28" fill="black"/></mask></defs><circle cx="46" cy="50" r="34" fill="currentColor" mask="url(#cres-UID)"/>`,
  muayn: `<polygon points="50,6 94,50 50,94 6,50" fill="none" stroke="currentColor" stroke-width="4"/><polygon points="50,24 76,50 50,76 24,50" fill="currentColor"/>`,
  halqa: `<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="currentColor"/>`,
  qalb: `<path fill="currentColor" d="M50 84 C22 64 10 50 10 34 C10 22 19 14 31 14 C40 14 46 19 50 27 C54 19 60 14 69 14 C81 14 90 22 90 34 C90 50 78 64 50 84 Z"/>`,
  sahm: `<polygon points="16,22 72,50 16,78 30,50" fill="currentColor"/><rect x="58" y="44" width="28" height="12" rx="2" fill="currentColor"/>`,
  fasil: `<polygon points="18,50 28,40 38,50 28,60" fill="currentColor"/><polygon points="40,50 50,36 60,50 50,64" fill="currentColor"/><polygon points="62,50 72,40 82,50 72,60" fill="currentColor"/>`,
  qaws: `<path d="M18 86 V46 A32 32 0 0 1 82 46 V86" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="40" r="5" fill="currentColor"/>`,
  warda: `<g fill="currentColor"><ellipse cx="50" cy="18" rx="9" ry="14" transform="rotate(0 50 50)"/><ellipse cx="50" cy="18" rx="9" ry="14" transform="rotate(60 50 50)"/><ellipse cx="50" cy="18" rx="9" ry="14" transform="rotate(120 50 50)"/><ellipse cx="50" cy="18" rx="9" ry="14" transform="rotate(180 50 50)"/><ellipse cx="50" cy="18" rx="9" ry="14" transform="rotate(240 50 50)"/><ellipse cx="50" cy="18" rx="9" ry="14" transform="rotate(300 50 50)"/><circle cx="50" cy="50" r="7"/></g>`,
};

export const STICKERS: { id: string; name: string }[] = [
  { id: "najm", name: "نجمة" },
  { id: "khatm", name: "خاتم" },
  { id: "hilal", name: "هلال" },
  { id: "muayn", name: "معين" },
  { id: "halqa", name: "حلقة" },
  { id: "qalb", name: "قلب" },
  { id: "sahm", name: "سهم" },
  { id: "fasil", name: "فاصل" },
  { id: "qaws", name: "قوس" },
  { id: "warda", name: "وردة" },
];

export function stickerSvg(name: string, color: string, uid: string, size: "fluid" | "raster" = "fluid") {
  const body = (INNER[name] ?? "").replaceAll("UID", uid).replaceAll("currentColor", color);
  const dim = size === "raster" ? `width="512" height="512"` : `width="100%" height="100%"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${dim}>${body}</svg>`;
}
