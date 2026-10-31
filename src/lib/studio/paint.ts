import type { Stroke } from "./types";

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function paintStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  const base = ctx.globalAlpha;
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.save();
    ctx.globalAlpha = base * stroke.opacity;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1, stroke.size);
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.erase ? "#000" : stroke.color;
    ctx.beginPath();
    const first = stroke.points[0];
    if (!first) {
      ctx.restore();
      continue;
    }
    ctx.moveTo(first.x, first.y);
    if (stroke.points.length === 1) ctx.lineTo(first.x + 0.01, first.y + 0.01);
    else for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  sw: number,
  sh: number,
) {
  const ir = sw / sh;
  const r = w / h;
  let sx = 0;
  let sy = 0;
  let cw = sw;
  let ch = sh;
  if (ir > r) {
    cw = sh * r;
    sx = (sw - cw) / 2;
  } else {
    ch = sw / r;
    sy = (sh - ch) / 2;
  }
  ctx.drawImage(img, sx, sy, cw, ch, x, y, w, h);
}
