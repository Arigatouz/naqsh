import { drawCover, paintStrokes, roundRect, wrapLines } from "./paint";
import { stickerSvg } from "./stickers";
import { filterCss, type DesignElement, type Project, type ShapeEl, type TextEl } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

async function loadSvg(svg: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function paintBackground(ctx: CanvasRenderingContext2D, project: Project, image: HTMLImageElement | null) {
  const { bg, w, h } = project;
  if (bg.transparent) return;
  ctx.save();
  ctx.filter = filterCss(bg.filter);
  if (bg.mode === "image" && image) {
    drawCover(ctx, image, 0, 0, w, h, image.width, image.height);
  } else if (bg.mode === "gradient") {
    const rad = (bg.angle * Math.PI) / 180;
    const x = Math.sin(rad);
    const y = -Math.cos(rad);
    const half = Math.abs(w * x) / 2 + Math.abs(h * y) / 2;
    const cx = w / 2;
    const cy = h / 2;
    const gradient = ctx.createLinearGradient(cx - x * half, cy - y * half, cx + x * half, cy + y * half);
    gradient.addColorStop(0, bg.from);
    gradient.addColorStop(1, bg.to);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function paintShape(ctx: CanvasRenderingContext2D, el: ShapeEl) {
  ctx.save();
  ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.globalAlpha = el.opacity;
  if (el.shape === "line") {
    ctx.strokeStyle = el.fill === "transparent" ? el.stroke : el.fill;
    ctx.lineWidth = Math.max(1, el.h);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-el.w / 2, 0);
    ctx.lineTo(el.w / 2, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  if (el.shape === "circle") {
    ctx.ellipse(0, 0, Math.max(1, el.w / 2), Math.max(1, el.h / 2), 0, 0, Math.PI * 2);
  } else if (el.shape === "triangle") {
    ctx.moveTo(0, -el.h / 2);
    ctx.lineTo(el.w / 2, el.h / 2);
    ctx.lineTo(-el.w / 2, el.h / 2);
    ctx.closePath();
  } else {
    roundRect(ctx, -el.w / 2, -el.h / 2, el.w, el.h, el.shape === "round" ? el.radius : 0);
  }
  if (el.fill !== "transparent") {
    ctx.fillStyle = el.fill;
    ctx.fill();
  }
  if (el.strokeWidth > 0) {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function paintText(ctx: CanvasRenderingContext2D, el: TextEl) {
  const pad = 8;
  ctx.save();
  ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.globalAlpha = el.opacity;
  if (el.textBg && el.textBg !== "transparent") {
    ctx.fillStyle = el.textBg;
    roundRect(ctx, -el.w / 2, -el.h / 2, el.w, el.h, el.radius);
    ctx.fill();
  }
  ctx.font = `${el.fontWeight} ${el.fontSize}px "${el.fontFamily}", "Cairo", "FreeSerif", sans-serif`;
  ctx.letterSpacing = `${el.letterSpacing}px`;
  ctx.direction = el.dir;
  ctx.textAlign = el.align;
  ctx.textBaseline = "top";
  const lines = wrapLines(ctx, el.text, Math.max(10, el.w - pad * 2));
  const lineHeight = el.fontSize * el.lineHeight;
  let anchor = -el.w / 2 + pad;
  if (el.align === "center") anchor = 0;
  if (el.align === "right") anchor = el.w / 2 - pad;
  const top = -el.h / 2 + pad;
  lines.forEach((line, index) => {
    const y = top + index * lineHeight;
    if (el.shadow) {
      ctx.save();
      ctx.shadowColor = el.shadowColor;
      ctx.shadowBlur = el.shadowBlur;
      ctx.shadowOffsetY = Math.max(2, el.fontSize * 0.06);
      ctx.fillStyle = el.color;
      ctx.fillText(line, anchor, y);
      ctx.restore();
    }
    if (el.strokeWidth > 0) {
      ctx.lineJoin = "round";
      ctx.lineWidth = el.strokeWidth * 2;
      ctx.strokeStyle = el.stroke;
      ctx.strokeText(line, anchor, y);
    }
    ctx.fillStyle = el.color;
    ctx.fillText(line, anchor, y);
  });
  ctx.restore();
}

async function paintElement(ctx: CanvasRenderingContext2D, el: DesignElement) {
  if (el.hidden) return;
  if (el.type === "shape") {
    paintShape(ctx, el);
    return;
  }
  if (el.type === "text") {
    paintText(ctx, el);
    return;
  }
  if (el.type === "sticker") {
    const img = await loadSvg(stickerSvg(el.sticker, el.color, el.id, "raster"));
    ctx.save();
    ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.globalAlpha = el.opacity;
    ctx.drawImage(img, -el.w / 2, -el.h / 2, el.w, el.h);
    ctx.restore();
    return;
  }
  if (el.type === "image") {
    const img = await loadImage(el.src);
    ctx.save();
    ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.globalAlpha = el.opacity;
    drawCover(ctx, img, -el.w / 2, -el.h / 2, el.w, el.h, img.width, img.height);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.translate(-el.w / 2, -el.h / 2);
  ctx.globalAlpha = el.opacity;
  paintStrokes(ctx, el.strokes);
  ctx.restore();
}

export async function exportProject(project: Project) {
  const families = new Set(
    project.elements.flatMap((el) => (el.type === "text" ? [el.fontFamily] : [])),
  );
  await Promise.all(
    [...families].map((family) => document.fonts.load(`16px "${family}"`).catch(() => undefined)),
  );
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = project.w;
  canvas.height = project.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  let bgImage: HTMLImageElement | null = null;
  if (!project.bg.transparent && project.bg.mode === "image" && project.bg.image) {
    bgImage = await loadImage(project.bg.image);
  }
  paintBackground(ctx, project, bgImage);
  for (const el of project.elements) {
    await paintElement(ctx, el);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("png");
  const safe = project.name.replace(/[^\u0600-\u06FFa-zA-Z0-9 _-]+/g, "").trim() || "naqsh";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safe}.png`;
  link.click();
  URL.revokeObjectURL(url);
}
