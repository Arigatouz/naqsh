import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { paintStrokes } from "@/lib/studio/paint";
import { stickerSvg } from "@/lib/studio/stickers";
import { filterCss, type DrawEl, type Project, type ShapeEl, type TextEl } from "@/lib/studio/types";

type Props = {
  project: Project;
  selectedId?: string | null;
  editingId?: string | null;
  grid?: boolean;
  viewScale?: number;
  onBackgroundPointerDown?: () => void;
  onElementPointerDown?: (id: string, event: PointerEvent<HTMLElement>) => void;
  onElementDoubleClick?: (id: string) => void;
  onTextChange?: (id: string, text: string) => void;
  onTextFocus?: () => void;
  onEditEnd?: () => void;
  onScaleHandle?: (id: string, event: PointerEvent<HTMLElement>) => void;
  onRotateHandle?: (id: string, event: PointerEvent<HTMLElement>) => void;
};

function DrawCanvas({ el }: { el: DrawEl }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintStrokes(ctx, el.strokes);
  }, [el]);
  return (
    <canvas
      ref={ref}
      width={Math.max(1, Math.round(el.w))}
      height={Math.max(1, Math.round(el.h))}
      className="h-full w-full"
    />
  );
}

function ShapeView({ el }: { el: ShapeEl }) {
  if (el.shape === "line") {
    return (
      <div className="flex h-full w-full items-center">
        <div
          className="w-full rounded-full"
          style={{ height: Math.max(2, el.h * 0.7), background: el.fill === "transparent" ? el.stroke : el.fill }}
        />
      </div>
    );
  }
  const stroke = el.strokeWidth;
  if (el.shape === "circle") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <ellipse cx="50" cy="50" rx="48" ry="48" fill={el.fill} stroke={el.stroke} strokeWidth={stroke} />
      </svg>
    );
  }
  if (el.shape === "triangle") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <polygon points="50,4 96,96 4,96" fill={el.fill} stroke={el.stroke} strokeWidth={stroke} />
      </svg>
    );
  }
  const rx = el.shape === "round" ? Math.min(48, (el.radius / Math.max(el.w, 1)) * 100) : 0;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
      <rect x="1" y="1" width="98" height="98" rx={rx} fill={el.fill} stroke={el.stroke} strokeWidth={stroke} />
    </svg>
  );
}

function textStyle(el: TextEl): CSSProperties {
  return {
    fontFamily: `"${el.fontFamily}", "Cairo", "FreeSerif", sans-serif`,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    color: el.color,
    textAlign: el.align,
    direction: el.dir,
    letterSpacing: el.letterSpacing,
    lineHeight: el.lineHeight,
    WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${el.stroke}` : undefined,
    textShadow: el.shadow ? `0 ${Math.max(2, el.fontSize * 0.06)}px ${el.shadowBlur}px ${el.shadowColor}` : undefined,
    background: el.textBg,
    borderRadius: el.radius,
    height: "100%",
    padding: 8,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  };
}

export function DesignBoard({
  project,
  selectedId,
  editingId,
  grid,
  viewScale = 1,
  onBackgroundPointerDown,
  onElementPointerDown,
  onElementDoubleClick,
  onTextChange,
  onTextFocus,
  onEditEnd,
  onScaleHandle,
  onRotateHandle,
}: Props) {
  const interactive = Boolean(onElementPointerDown);
  const handle = Math.max(12, 18 / viewScale);
  const selectedEl = project.elements.find((el) => el.id === selectedId);
  const guideX = Boolean(selectedEl && Math.abs(selectedEl.x + selectedEl.w / 2 - project.w / 2) < 1.5);
  const guideY = Boolean(selectedEl && Math.abs(selectedEl.y + selectedEl.h / 2 - project.h / 2) < 1.5);
  return (
    <div className="absolute inset-0" onPointerDown={onBackgroundPointerDown}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="checker absolute inset-0" />
        {!project.bg.transparent && project.bg.mode === "image" && project.bg.image ? (
          <img
            src={project.bg.image}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: filterCss(project.bg.filter) }}
          />
        ) : null}
        {!project.bg.transparent && project.bg.mode !== "image" ? (
          <div
            className="absolute inset-0"
            style={{
              filter: filterCss(project.bg.filter),
              background:
                project.bg.mode === "gradient"
                  ? `linear-gradient(${project.bg.angle}deg, ${project.bg.from}, ${project.bg.to})`
                  : project.bg.color,
            }}
          />
        ) : null}
      </div>
      {grid ? <div className="design-grid pointer-events-none absolute inset-0" /> : null}
      {project.elements.map((el) => {
        const selected = interactive && selectedId === el.id;
        const editing = el.type === "text" && editingId === el.id;
        return (
          <div
            key={el.id}
            className={interactive && el.type !== "draw" ? "absolute" : "pointer-events-none absolute"}
            style={{
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              transform: `rotate(${el.rotation}deg)`,
              opacity: el.hidden ? 0.15 : el.opacity,
              display: el.hidden && !interactive ? "none" : "block",
              outline: selected ? `${Math.max(1, 2 / viewScale)}px solid var(--color-gold)` : undefined,
              outlineOffset: 2 / viewScale,
              touchAction: "none",
              cursor: !interactive || el.locked || el.type === "draw" ? "default" : "grab",
            }}
            onPointerDown={(event) => {
              if (!interactive || el.type === "draw") return;
              event.stopPropagation();
              onElementPointerDown?.(el.id, event);
            }}
            onDoubleClick={(event) => {
              event.stopPropagation();
              if (el.type === "text") onElementDoubleClick?.(el.id);
            }}
          >
            {el.type === "text" ? (
              editing ? (
                <textarea
                  autoFocus
                  value={el.text}
                  dir={el.dir}
                  onChange={(event) => onTextChange?.(el.id, event.target.value)}
                  onFocus={() => onTextFocus?.()}
                  onBlur={onEditEnd}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="h-full w-full resize-none bg-transparent outline-none"
                  style={textStyle(el)}
                />
              ) : (
                <div style={textStyle(el)}>{el.text}</div>
              )
            ) : null}
            {el.type === "shape" ? <ShapeView el={el} /> : null}
            {el.type === "sticker" ? (
              <div
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: stickerSvg(el.sticker, el.color, el.id) }}
              />
            ) : null}
            {el.type === "image" ? (
              <img src={el.src} alt="" draggable={false} className="h-full w-full object-cover" />
            ) : null}
            {el.type === "draw" ? <DrawCanvas el={el} /> : null}
            {selected && !el.locked && el.type !== "draw" ? (
              <>
                <button
                  type="button"
                  aria-label="تدوير"
                  className="absolute z-10 rounded-full border border-ink bg-cream"
                  style={{
                    width: handle,
                    height: handle,
                    left: "50%",
                    top: 0,
                    transform: `translate(-50%, calc(-100% - ${10 / viewScale}px))`,
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onRotateHandle?.(el.id, event);
                  }}
                />
                <button
                  type="button"
                  aria-label="تغيير الحجم"
                  className="absolute z-10 rounded-sm border border-ink bg-gold"
                  style={{
                    width: handle,
                    height: handle,
                    left: "100%",
                    top: "100%",
                    transform: "translate(-50%, -50%)",
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onScaleHandle?.(el.id, event);
                  }}
                />
              </>
            ) : null}
          </div>
        );
      })}
      {guideX ? (
        <div className="pointer-events-none absolute inset-y-0 w-px bg-gold" style={{ left: project.w / 2 }} />
      ) : null}
      {guideY ? (
        <div className="pointer-events-none absolute inset-x-0 h-px bg-gold" style={{ top: project.h / 2 }} />
      ) : null}
    </div>
  );
}
