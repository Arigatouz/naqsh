import {
  Brush,
  ChevronRight,
  Download,
  Grid3x3,
  ImagePlus,
  Layers,
  MousePointer2,
  Palette,
  Quote,
  Redo2,
  Shapes,
  Sticker,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/cn";
import { DesignBoard } from "@/components/studio/DesignBoard";
import { Panel } from "@/components/studio/Panel";
import { exportProject } from "@/lib/studio/export";
import { readImageFile } from "@/lib/studio/image";
import { paintStrokes } from "@/lib/studio/paint";
import { useStudio, type ElementPatch, type PanelId } from "@/lib/studio/store";
import type { DesignElement, Stroke } from "@/lib/studio/types";

type Gesture = {
  kind: "move" | "scale" | "rotate";
  id: string;
  x: number;
  y: number;
  el: DesignElement;
  remembered: boolean;
};

const TOOLS: { id: PanelId | "select" | "image"; label: string; icon: typeof Type }[] = [
  { id: "select", label: "تحديد", icon: MousePointer2 },
  { id: "inspector", label: "نص", icon: Type },
  { id: "shapes", label: "أشكال", icon: Shapes },
  { id: "stickers", label: "ملصقات", icon: Sticker },
  { id: "phrases", label: "عبارات", icon: Quote },
  { id: "image", label: "صورة", icon: ImagePlus },
  { id: "brush", label: "فرشاة", icon: Brush },
  { id: "background", label: "خلفية", icon: Palette },
  { id: "layers", label: "طبقات", icon: Layers },
];

export function Editor() {
  const current = useStudio((s) => s.current);
  const closeEditor = useStudio((s) => s.closeEditor);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const past = useStudio((s) => s.past.length);
  const future = useStudio((s) => s.future.length);
  const grid = useStudio((s) => s.grid);
  const toggleGrid = useStudio((s) => s.toggleGrid);
  const rename = useStudio((s) => s.rename);
  const select = useStudio((s) => s.select);
  const editText = useStudio((s) => s.editText);
  const stopEdit = useStudio((s) => s.stopEdit);
  const updateElement = useStudio((s) => s.updateElement);
  const remember = useStudio((s) => s.remember);
  const addText = useStudio((s) => s.addText);
  const addImage = useStudio((s) => s.addImage);
  const addStroke = useStudio((s) => s.addStroke);
  const selectedId = useStudio((s) => s.selectedId);
  const editingId = useStudio((s) => s.editingId);
  const tool = useStudio((s) => s.tool);
  const panel = useStudio((s) => s.panel);
  const openPanel = useStudio((s) => s.openPanel);
  const setTool = useStudio((s) => s.setTool);
  const mobileSheet = useStudio((s) => s.mobileSheet);
  const flash = useStudio((s) => s.flash);

  const artRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const drawingRef = useRef<Stroke | null>(null);
  const scaleRef = useRef(0.3);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!current) closeEditor();
  }, [current, closeEditor]);

  useEffect(() => {
    setZoom(1);
  }, [current?.id]);

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const w = node.clientWidth;
      const h = node.clientHeight;
      setViewport((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [current?.id]);

  const ready = viewport.w > 8 && viewport.h > 8;
  const pad = 32;
  const fit =
    current == null || !ready
      ? 0.2
      : Math.max(0.05, Math.min((viewport.w - pad * 2) / current.w, (viewport.h - pad * 2) / current.h));
  const scale = fit * zoom;
  scaleRef.current = scale;

  useLayoutEffect(() => {
    const node = hostRef.current;
    if (!node || !current || !ready) return;
    const center = () => {
      node.scrollLeft = Math.max(0, (node.scrollWidth - node.clientWidth) / 2);
      node.scrollTop = Math.max(0, (node.scrollHeight - node.clientHeight) / 2);
    };
    center();
    const id = requestAnimationFrame(center);
    return () => cancelAnimationFrame(id);
  }, [current, ready, zoom, scale, viewport.w, viewport.h]);

  function clientToDesign(clientX: number, clientY: number) {
    const node = artRef.current;
    const project = useStudio.getState().current;
    if (!node || !project) return { x: 0, y: 0 };
    const rect = node.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / (rect.width || 1)) * project.w,
      y: ((clientY - rect.top) / (rect.height || 1)) * project.h,
    };
  }

  useEffect(() => {
    function move(event: PointerEvent) {
      const gesture = gestureRef.current;
      const node = artRef.current;
      const project = useStudio.getState().current;
      if (!gesture || !node || !project) return;
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / (rect.width || 1)) * project.w;
      const y = ((event.clientY - rect.top) / (rect.height || 1)) * project.h;
      if (!gesture.remembered) {
        useStudio.getState().remember();
        gesture.remembered = true;
      }
      const el = gesture.el;
      const state = useStudio.getState();
      if (gesture.kind === "move") {
        let nx = el.x + (x - gesture.x);
        let ny = el.y + (y - gesture.y);
        const centerX = nx + el.w / 2;
        const centerY = ny + el.h / 2;
        const snapX = Math.abs(centerX - project.w / 2) < 14;
        const snapY = Math.abs(centerY - project.h / 2) < 14;
        if (snapX) nx = project.w / 2 - el.w / 2;
        if (snapY) ny = project.h / 2 - el.h / 2;
        if (state.grid) {
          if (!snapX) nx = Math.round(nx / 20) * 20;
          if (!snapY) ny = Math.round(ny / 20) * 20;
        }
        nx = Math.min(project.w - 24, Math.max(-el.w + 24, nx));
        ny = Math.min(project.h - 24, Math.max(-el.h + 24, ny));
        state.updateElement(gesture.id, { x: nx, y: ny }, false, false);
        return;
      }
      const cx = el.x + el.w / 2;
      const cy = el.y + el.h / 2;
      if (gesture.kind === "rotate") {
        const start = Math.atan2(gesture.y - cy, gesture.x - cx);
        const next = Math.atan2(y - cy, x - cx);
        let rotation = el.rotation + ((next - start) * 180) / Math.PI;
        if (state.grid) rotation = Math.round(rotation / 15) * 15;
        state.updateElement(gesture.id, { rotation }, false, false);
        return;
      }
      const d0 = Math.max(12, Math.hypot(gesture.x - cx, gesture.y - cy));
      const d1 = Math.max(12, Math.hypot(x - cx, y - cy));
      const factor = Math.min(6, Math.max(0.2, d1 / d0));
      const w = Math.max(24, el.w * factor);
      const h = Math.max(el.type === "shape" && el.shape === "line" ? 4 : 24, el.h * factor);
      const patch: ElementPatch = { w, h, x: cx - w / 2, y: cy - h / 2 };
      if (el.type === "text") patch.fontSize = Math.max(10, Math.round(el.fontSize * factor));
      state.updateElement(gesture.id, patch, false, false);
    }
    function up() {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (gesture?.remembered) useStudio.getState().persistCurrent();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) useStudio.getState().redo();
        else useStudio.getState().undo();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === "y") {
        event.preventDefault();
        useStudio.getState().redo();
        return;
      }
      if (typing) return;
      const id = useStudio.getState().selectedId;
      if ((event.key === "Delete" || event.key === "Backspace") && id) {
        event.preventDefault();
        useStudio.getState().removeElement(id);
      }
      if ((event.metaKey || event.ctrlKey) && key === "d" && id) {
        event.preventDefault();
        useStudio.getState().duplicateElement(id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function begin(kind: Gesture["kind"], id: string, event: ReactPointerEvent<HTMLElement>) {
    const project = useStudio.getState().current;
    const el = project?.elements.find((item) => item.id === id);
    if (!el || el.locked || el.type === "draw") return;
    const point = clientToDesign(event.clientX, event.clientY);
    gestureRef.current = { kind, id, x: point.x, y: point.y, el: structuredClone(el), remembered: false };
  }

  function paintOverlay(stroke: Stroke | null) {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!stroke) return;
    const preview = stroke.erase ? { ...stroke, erase: false, color: "#f6f1e7", opacity: 0.85 } : stroke;
    paintStrokes(ctx, [preview]);
  }

  if (!current) return null;
  const boardW = current.w * scale;
  const boardH = current.h * scale;
  const empty = current.elements.length === 0 && !current.bg.image;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-line px-2">
        <button
          type="button"
          aria-label="رجوع"
          className="flex size-11 items-center justify-center rounded-md text-cream hover:bg-panel"
          onClick={closeEditor}
        >
          <ChevronRight className="size-5" />
        </button>
        <input
          value={current.name}
          aria-label="اسم التصميم"
          onChange={(event) => rename(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-cream outline-none"
        />
        <button type="button" aria-label="تراجع" title="تراجع" disabled={!past} className="flex size-11 items-center justify-center rounded-md text-cream enabled:hover:bg-panel disabled:opacity-30" onClick={undo}>
          <Undo2 className="size-5" />
        </button>
        <button type="button" aria-label="إعادة" title="إعادة" disabled={!future} className="flex size-11 items-center justify-center rounded-md text-cream enabled:hover:bg-panel disabled:opacity-30" onClick={redo}>
          <Redo2 className="size-5" />
        </button>
        <button
          type="button"
          aria-label="شبكة"
          title="شبكة"
          className={cn("flex size-11 items-center justify-center rounded-md", grid ? "bg-gold text-ink" : "text-cream hover:bg-panel")}
          onClick={toggleGrid}
        >
          <Grid3x3 className="size-5" />
        </button>
        <button
          type="button"
          className="flex h-11 items-center gap-1 rounded-md bg-gold px-3 text-sm font-semibold text-ink disabled:opacity-60"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await exportProject(current);
              flash("تم تنزيل الصورة");
            } catch {
              flash("تعذر تصدير الصورة");
            } finally {
              setExporting(false);
            }
          }}
        >
          <Download className="size-4" />
          <span>{exporting ? "جارٍ الحفظ" : "تصدير"}</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <ToolRail
          className="hidden w-20 shrink-0 flex-col gap-1 overflow-y-auto border-e border-line p-2 md:flex"
          active={tool === "brush" ? "brush" : panel}
          onSelect={(id) => onTool(id)}
        />
        <div ref={stageRef} className="relative min-h-0 min-w-0 flex-1 bg-ink-2">
          <div ref={hostRef} dir="ltr" className="absolute inset-0 overflow-auto">
            <div
              className="grid place-items-center"
              style={{
                width: `max(100%, ${Math.ceil(boardW + pad * 2)}px)`,
                height: `max(100%, ${Math.ceil(boardH + pad * 2)}px)`,
              }}
            >
              <div
                className="relative shrink-0 overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,.5)] ring-1 ring-white/20"
                style={{ width: boardW, height: boardH, opacity: ready ? 1 : 0 }}
              >
                <div
                  ref={artRef}
                  className="absolute top-0 left-0"
                  style={{
                    width: current.w,
                    height: current.h,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                <DesignBoard
                  project={current}
                  selectedId={selectedId}
                  editingId={editingId}
                  grid={grid}
                  viewScale={scale}
                  onBackgroundPointerDown={() => {
                    if (tool === "brush") return;
                    select(null);
                  }}
                  onElementPointerDown={(id, event) => {
                    const state = useStudio.getState();
                    const el = state.current?.elements.find((item) => item.id === id);
                    if (!el || state.editingId === id) return;
                    select(id);
                    if (el.locked) return;
                    begin("move", id, event);
                  }}
                  onElementDoubleClick={(id) => editText(id)}
                  onTextChange={(id, text) => updateElement(id, { text }, false)}
                  onTextFocus={remember}
                  onEditEnd={stopEdit}
                  onScaleHandle={(id, event) => begin("scale", id, event)}
                  onRotateHandle={(id, event) => begin("rotate", id, event)}
                />
                <canvas
                  ref={overlayRef}
                  width={current.w}
                  height={current.h}
                  className="absolute inset-0 h-full w-full"
                  style={{ pointerEvents: tool === "brush" ? "auto" : "none", touchAction: "none" }}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const point = clientToDesign(event.clientX, event.clientY);
                    const state = useStudio.getState().brush;
                    drawingRef.current = {
                      color: state.color,
                      size: state.size / scaleRef.current,
                      opacity: state.opacity,
                      erase: state.erase,
                      points: [point],
                    };
                    paintOverlay(drawingRef.current);
                  }}
                  onPointerMove={(event) => {
                    const stroke = drawingRef.current;
                    if (!stroke) return;
                    const point = clientToDesign(event.clientX, event.clientY);
                    const last = stroke.points[stroke.points.length - 1];
                    if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.2) return;
                    stroke.points.push(point);
                    paintOverlay(stroke);
                  }}
                  onPointerUp={() => {
                    const stroke = drawingRef.current;
                    drawingRef.current = null;
                    paintOverlay(null);
                    if (stroke && stroke.points.length) addStroke(stroke);
                  }}
                />
              </div>
            </div>
            </div>
          </div>
          {empty ? (
            <p className="pointer-events-none absolute inset-x-0 top-6 z-10 text-center text-sm text-sand">
              أضف نصاً، أو ارفع صورة، أو ابدأ الرسم
            </p>
          ) : null}
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md bg-panel/95 p-1 shadow-lg">
            <button type="button" aria-label="تصغير" className="flex size-11 items-center justify-center rounded-md bg-panel text-cream" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}>
              <ZoomOut className="size-4" />
            </button>
            <button type="button" className="h-11 rounded-md bg-panel px-2 text-xs text-sand" onClick={() => setZoom(1)}>
              {Math.round(zoom * 100)}٪
            </button>
            <button type="button" aria-label="تكبير" className="flex size-11 items-center justify-center rounded-md bg-panel text-cream" onClick={() => setZoom((value) => Math.min(4, value + 0.25))}>
              <ZoomIn className="size-4" />
            </button>
          </div>
        </div>
        <aside className="hidden h-full w-80 shrink-0 flex-col border-s border-line bg-panel lg:flex">
          <Panel />
        </aside>
      </div>

      <ToolRail
        className="flex shrink-0 gap-1 overflow-x-auto border-t border-line px-1 md:hidden"
        dock
        active={tool === "brush" ? "brush" : panel}
        onSelect={(id) => onTool(id)}
      />
      {mobileSheet ? (
        <div className="fixed inset-x-0 bottom-16 z-30 flex h-80 flex-col overflow-hidden border-t border-line bg-panel lg:hidden">
          <Panel />
        </div>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            addImage(await readImageFile(file));
          } catch {
            flash("تعذر قراءة الصورة");
          }
        }}
      />
    </div>
  );

  function onTool(id: (typeof TOOLS)[number]["id"]) {
    if (id === "select") {
      setTool("select");
      useStudio.getState().setMobileSheet(false);
      return;
    }
    if (id === "image") {
      setTool("select");
      fileRef.current?.click();
      return;
    }
    if (id === "inspector") {
      addText();
      return;
    }
    openPanel(id);
  }
}

function ToolRail({
  className,
  dock,
  active,
  onSelect,
}: {
  className?: string;
  dock?: boolean;
  active: PanelId;
  onSelect: (id: (typeof TOOLS)[number]["id"]) => void;
}) {
  return (
    <nav className={className}>
      {TOOLS.map((item) => {
        const Icon = item.icon;
        const on = item.id !== "select" && item.id !== "image" && item.id !== "inspector" && active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex shrink-0 flex-col items-center justify-center gap-1 rounded-md text-xs",
              dock ? "h-16 w-14" : "h-16 w-full",
              on ? "bg-gold text-ink" : "text-sand hover:bg-ink",
            )}
          >
            <Icon className="size-5" />
            <span className="leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
