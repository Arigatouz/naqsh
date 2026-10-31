import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Trash2,
  X,
} from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FONTS } from "@/lib/studio/fonts";
import { readImageFile } from "@/lib/studio/image";
import { STICKERS, stickerSvg } from "@/lib/studio/stickers";
import { useStudio, type PanelId } from "@/lib/studio/store";
import { PHRASES, SWATCHES, identityFilter, type ShapeKind } from "@/lib/studio/types";

const TITLES: Record<Exclude<PanelId, null>, string> = {
  inspector: "تعديل",
  shapes: "أشكال",
  stickers: "ملصقات",
  phrases: "عبارات",
  background: "الخلفية",
  layers: "الطبقات",
  brush: "الفرشاة",
};

const SHAPES: { id: ShapeKind; name: string }[] = [
  { id: "rect", name: "مربع" },
  { id: "round", name: "مستدير" },
  { id: "circle", name: "دائرة" },
  { id: "triangle", name: "مثلث" },
  { id: "line", name: "خط" },
];

const LOOKS = [
  { name: "بسيط", patch: { strokeWidth: 0, shadow: false, textBg: "transparent" } },
  { name: "إطار", patch: { strokeWidth: 2, stroke: "#14120e", shadow: false } },
  { name: "ظل", patch: { strokeWidth: 0, shadow: true, shadowBlur: 18, shadowColor: "#000000" } },
  { name: "ذهبي", patch: { color: "#e0a84a", strokeWidth: 0, shadow: true, shadowColor: "#000000", shadowBlur: 14 } },
  { name: "لافتة", patch: { textBg: "#e0a84a", color: "#14120e", radius: 16, strokeWidth: 0, shadow: false } },
];

const FILTERS = [
  { name: "أصلي", filter: identityFilter() },
  { name: "دافئ", filter: { brightness: 1.05, contrast: 1.05, saturate: 1.3, blur: 0, grayscale: 0, sepia: 0.28 } },
  { name: "أبيض وأسود", filter: { brightness: 1.04, contrast: 1.12, saturate: 0, blur: 0, grayscale: 1, sepia: 0 } },
  { name: "سينما", filter: { brightness: 0.94, contrast: 1.18, saturate: 0.85, blur: 0, grayscale: 0, sepia: 0.18 } },
  { name: "ناعم", filter: { brightness: 1.08, contrast: 0.94, saturate: 0.9, blur: 0.6, grayscale: 0, sepia: 0.08 } },
];

function Swatches({ value, onPick }: { value: string; onPick: (value: string, history: boolean) => void }) {
  const remember = useStudio((s) => s.remember);
  const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="color"
        value={hex}
        aria-label="لون مخصص"
        className="size-11 cursor-pointer rounded-md border border-line bg-transparent"
        onPointerDown={() => remember()}
        onChange={(event) => onPick(event.target.value, false)}
      />
      {SWATCHES.map((swatch) => (
        <button
          key={swatch}
          type="button"
          aria-label={swatch}
          className={cn("size-8 rounded-full border", value.toLowerCase() === swatch ? "border-cream ring-2 ring-gold" : "border-line")}
          style={{ background: swatch }}
          onClick={() => onPick(swatch, true)}
        />
      ))}
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const remember = useStudio((s) => s.remember);
  return (
    <label className="flex flex-col gap-1 text-xs text-sand">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-cream">{Math.round(value * 100) / 100}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="h-8 w-full accent-gold"
        onPointerDown={() => remember()}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function Panel() {
  const panel = useStudio((s) => s.panel);
  const current = useStudio((s) => s.current);
  const selectedId = useStudio((s) => s.selectedId);
  const setMobileSheet = useStudio((s) => s.setMobileSheet);
  const active = panel ?? (selectedId ? "inspector" : null);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-cream">{active ? TITLES[active] : "اللوحة"}</h2>
        <button
          type="button"
          aria-label="إغلاق"
          className="flex size-11 items-center justify-center rounded-md text-sand hover:bg-ink lg:hidden"
          onClick={() => setMobileSheet(false)}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {!current ? null : active === "shapes" ? (
          <Shapes />
        ) : active === "stickers" ? (
          <Stickers />
        ) : active === "phrases" ? (
          <Phrases />
        ) : active === "background" ? (
          <Background />
        ) : active === "layers" ? (
          <Layers />
        ) : active === "brush" ? (
          <BrushPanel />
        ) : (
          <Inspector />
        )}
      </div>
    </div>
  );
}

function Shapes() {
  const addShape = useStudio((s) => s.addShape);
  return (
    <div className="grid grid-cols-2 gap-2">
      {SHAPES.map((shape) => (
        <button
          key={shape.id}
          type="button"
          className="flex h-16 items-center justify-center rounded-md border border-line bg-ink text-sm text-cream hover:border-gold"
          onClick={() => addShape(shape.id)}
        >
          {shape.name}
        </button>
      ))}
    </div>
  );
}

function Stickers() {
  const addSticker = useStudio((s) => s.addSticker);
  return (
    <div className="grid grid-cols-4 gap-2">
      {STICKERS.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          aria-label={sticker.name}
          title={sticker.name}
          className="flex aspect-square items-center justify-center rounded-md border border-line bg-ink p-2 hover:border-gold"
          onClick={() => addSticker(sticker.id)}
        >
          <span
            className="block h-full w-full"
            dangerouslySetInnerHTML={{ __html: stickerSvg(sticker.id, "#e0a84a", `pick-${sticker.id}`) }}
          />
        </button>
      ))}
    </div>
  );
}

function Phrases() {
  const addText = useStudio((s) => s.addText);
  return (
    <div className="flex flex-col gap-2">
      {PHRASES.map((phrase) => (
        <button
          key={phrase}
          type="button"
          className="rounded-md border border-line bg-ink px-3 py-3 text-right text-sm text-cream hover:border-gold"
          onClick={() => addText(phrase)}
        >
          {phrase}
        </button>
      ))}
    </div>
  );
}

function BrushPanel() {
  const brush = useStudio((s) => s.brush);
  const setBrush = useStudio((s) => s.setBrush);
  const setTool = useStudio((s) => s.setTool);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn("h-11 rounded-md text-sm", !brush.erase ? "bg-gold text-ink" : "border border-line text-cream")}
          onClick={() => {
            setBrush({ erase: false });
            setTool("brush");
          }}
        >
          رسم
        </button>
        <button
          type="button"
          className={cn("h-11 rounded-md text-sm", brush.erase ? "bg-gold text-ink" : "border border-line text-cream")}
          onClick={() => {
            setBrush({ erase: true });
            setTool("brush");
          }}
        >
          ممحاة
        </button>
      </div>
      {!brush.erase ? <Swatches value={brush.color} onPick={(color) => setBrush({ color })} /> : null}
      <Slider label="السماكة" min={4} max={120} value={brush.size} onChange={(size) => setBrush({ size })} />
      <Slider
        label="الشفافية"
        min={0.15}
        max={1}
        step={0.05}
        value={brush.opacity}
        onChange={(opacity) => setBrush({ opacity })}
      />
      <p className="text-xs leading-relaxed text-sand">ارسم على اللوحة مباشرة. كل ضربة تتراجع من زر التراجع.</p>
    </div>
  );
}

function Background() {
  const bg = useStudio((s) => s.current?.bg);
  const setBg = useStudio((s) => s.setBg);
  const flash = useStudio((s) => s.flash);
  const inputRef = useRef<HTMLInputElement>(null);
  if (!bg) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["color", "لون"],
            ["gradient", "تدرج"],
            ["image", "صورة"],
            ["clear", "شفاف"],
          ] as const
        ).map(([id, label]) => {
          const active = id === "clear" ? bg.transparent : !bg.transparent && bg.mode === id;
          return (
            <button
              key={id}
              type="button"
              className={cn("h-11 rounded-md text-sm", active ? "bg-gold text-ink" : "border border-line text-cream")}
              onClick={() => {
                if (id === "clear") setBg({ transparent: true });
                else if (id === "image") inputRef.current?.click();
                else setBg({ mode: id, transparent: false });
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            const image = await readImageFile(file);
            setBg({ mode: "image", image, transparent: false });
          } catch {
            flash("تعذر قراءة الصورة");
          }
        }}
      />
      {!bg.transparent && bg.mode === "color" ? (
        <Swatches value={bg.color} onPick={(color, history) => setBg({ color }, history)} />
      ) : null}
      {!bg.transparent && bg.mode === "gradient" ? (
        <div className="flex flex-col gap-3">
          <Swatches value={bg.from} onPick={(from, history) => setBg({ from }, history)} />
          <Swatches value={bg.to} onPick={(to, history) => setBg({ to }, history)} />
          <Slider label="الزاوية" min={0} max={360} value={bg.angle} onChange={(angle) => setBg({ angle }, false)} />
        </div>
      ) : null}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-sand">مؤثرات الخلفية</p>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="rounded-md border border-line px-3 py-2 text-xs text-cream hover:border-gold"
              onClick={() => setBg({ filter: preset.filter })}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <Slider
          label="السطوع"
          min={0.4}
          max={1.6}
          step={0.02}
          value={bg.filter.brightness}
          onChange={(brightness) => setBg({ filter: { ...bg.filter, brightness } }, false)}
        />
        <Slider
          label="التباين"
          min={0.4}
          max={1.8}
          step={0.02}
          value={bg.filter.contrast}
          onChange={(contrast) => setBg({ filter: { ...bg.filter, contrast } }, false)}
        />
        <Slider
          label="التشبع"
          min={0}
          max={2}
          step={0.02}
          value={bg.filter.saturate}
          onChange={(saturate) => setBg({ filter: { ...bg.filter, saturate } }, false)}
        />
      </div>
    </div>
  );
}

function Layers() {
  const elements = useStudio((s) => s.current?.elements ?? []);
  const selectedId = useStudio((s) => s.selectedId);
  const select = useStudio((s) => s.select);
  const moveLayer = useStudio((s) => s.moveLayer);
  const toggleHide = useStudio((s) => s.toggleHide);
  const toggleLock = useStudio((s) => s.toggleLock);
  const removeElement = useStudio((s) => s.removeElement);
  const ordered = [...elements].reverse();
  if (!ordered.length) return <p className="text-sm text-sand">لا توجد عناصر بعد.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {ordered.map((el) => (
        <li key={el.id} className={cn("rounded-md border px-2 py-1", selectedId === el.id ? "border-gold bg-ink" : "border-line")}>
          <button type="button" className="w-full truncate py-2 text-right text-sm text-cream" onClick={() => select(el.id)}>
            {el.name}
          </button>
          <div className="flex items-center justify-end gap-1">
            <Mini icon={ArrowUp} label="للأمام" onClick={() => moveLayer(el.id, 1)} />
            <Mini icon={ArrowDown} label="للخلف" onClick={() => moveLayer(el.id, -1)} />
            <Mini icon={el.hidden ? EyeOff : Eye} label={el.hidden ? "إظهار" : "إخفاء"} onClick={() => toggleHide(el.id)} />
            <Mini icon={el.locked ? Lock : LockOpen} label={el.locked ? "فتح" : "قفل"} onClick={() => toggleLock(el.id)} />
            <Mini icon={Trash2} label="حذف" onClick={() => removeElement(el.id)} danger />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Mini({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Trash2;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("flex size-11 items-center justify-center rounded-md hover:bg-panel", danger ? "text-clay" : "text-sand")}
    >
      <Icon className="size-4" />
    </button>
  );
}

function Inspector() {
  const current = useStudio((s) => s.current);
  const selectedId = useStudio((s) => s.selectedId);
  const update = useStudio((s) => s.updateElement);
  const duplicateElement = useStudio((s) => s.duplicateElement);
  const removeElement = useStudio((s) => s.removeElement);
  const remember = useStudio((s) => s.remember);
  const el = current?.elements.find((item) => item.id === selectedId);
  if (!el) return <p className="text-sm leading-relaxed text-sand">اختر عنصراً من اللوحة، أو أضف نصاً وشكلاً وملصقاً.</p>;
  return (
    <div className="flex flex-col gap-4">
      {el.type === "text" ? (
        <>
          <textarea
            value={el.text}
            dir={el.dir}
            onFocus={() => remember()}
            onChange={(event) => update(el.id, { text: event.target.value }, false)}
            className="min-h-24 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-cream outline-none"
          />
          <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto">
            {FONTS.map((font) => (
              <button
                key={font.family}
                type="button"
                className={cn(
                  "truncate rounded-md border px-2 py-2 text-lg",
                  el.fontFamily === font.family ? "border-gold text-gold" : "border-line text-cream",
                )}
                style={{ fontFamily: `"${font.family}", "Cairo", sans-serif` }}
                onClick={() => update(el.id, { fontFamily: font.family })}
              >
                نقش
              </button>
            ))}
          </div>
          <Slider label="الحجم" min={12} max={240} value={el.fontSize} onChange={(fontSize) => update(el.id, { fontSize }, false)} />
          <Swatches value={el.color} onPick={(color, history) => update(el.id, { color }, history)} />
          <div className="flex gap-2">
            <AlignBtn active={el.align === "right"} label="يمين" onClick={() => update(el.id, { align: "right" })}>
              <AlignRight className="size-4" />
            </AlignBtn>
            <AlignBtn active={el.align === "center"} label="وسط" onClick={() => update(el.id, { align: "center" })}>
              <AlignCenter className="size-4" />
            </AlignBtn>
            <AlignBtn active={el.align === "left"} label="يسار" onClick={() => update(el.id, { align: "left" })}>
              <AlignLeft className="size-4" />
            </AlignBtn>
            <AlignBtn active={el.fontWeight === 700} label="عريض" onClick={() => update(el.id, { fontWeight: el.fontWeight === 700 ? 400 : 700 })}>
              <Bold className="size-4" />
            </AlignBtn>
            <AlignBtn active={el.dir === "rtl"} label="اتجاه" onClick={() => update(el.id, { dir: el.dir === "rtl" ? "ltr" : "rtl" })}>
              <span className="text-xs">{el.dir === "rtl" ? "ع" : "EN"}</span>
            </AlignBtn>
          </div>
          <div className="flex flex-wrap gap-2">
            {LOOKS.map((look) => (
              <button
                key={look.name}
                type="button"
                className="rounded-md border border-line px-3 py-2 text-xs text-cream hover:border-gold"
                onClick={() => update(el.id, look.patch)}
              >
                {look.name}
              </button>
            ))}
          </div>
          <Slider label="الإطار" min={0} max={12} value={el.strokeWidth} onChange={(strokeWidth) => update(el.id, { strokeWidth }, false)} />
          <Slider
            label="المسافة"
            min={-2}
            max={20}
            value={el.letterSpacing}
            onChange={(letterSpacing) => update(el.id, { letterSpacing }, false)}
          />
          <Slider
            label="ارتفاع السطر"
            min={0.8}
            max={2.2}
            step={0.05}
            value={el.lineHeight}
            onChange={(lineHeight) => update(el.id, { lineHeight }, false)}
          />
          <p className="text-xs text-sand">خلفية النص</p>
          <Swatches value={el.textBg} onPick={(textBg, history) => update(el.id, { textBg }, history)} />
          <button type="button" className="text-right text-xs text-sand underline" onClick={() => update(el.id, { textBg: "transparent" })}>
            بدون خلفية
          </button>
        </>
      ) : null}
      {el.type === "shape" ? (
        <>
          <p className="text-xs text-sand">التعبئة</p>
          <Swatches value={el.fill} onPick={(fill, history) => update(el.id, { fill }, history)} />
          <p className="text-xs text-sand">الحد</p>
          <Swatches value={el.stroke} onPick={(stroke, history) => update(el.id, { stroke }, history)} />
          <Slider label="سماكة الحد" min={0} max={40} value={el.strokeWidth} onChange={(strokeWidth) => update(el.id, { strokeWidth }, false)} />
          {el.shape === "round" || el.shape === "rect" ? (
            <Slider label="الاستدارة" min={0} max={200} value={el.radius} onChange={(radius) => update(el.id, { radius }, false)} />
          ) : null}
        </>
      ) : null}
      {el.type === "sticker" ? (
        <>
          <p className="text-xs text-sand">لون الملصق</p>
          <Swatches value={el.color} onPick={(color, history) => update(el.id, { color }, history)} />
        </>
      ) : null}
      <Slider
        label="الشفافية"
        min={0.1}
        max={1}
        step={0.05}
        value={el.opacity}
        onChange={(opacity) => update(el.id, { opacity }, false)}
      />
      {el.type !== "draw" ? (
        <Slider label="الدوران" min={-180} max={180} value={el.rotation} onChange={(rotation) => update(el.id, { rotation }, false)} />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm text-cream"
          onClick={() => duplicateElement(el.id)}
          disabled={el.type === "draw"}
        >
          <Copy className="size-4" />
          نسخ
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm text-clay"
          onClick={() => removeElement(el.id)}
        >
          <Trash2 className="size-4" />
          حذف
        </button>
      </div>
    </div>
  );
}

function AlignBtn({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn("flex size-11 items-center justify-center rounded-md border", active ? "border-gold bg-gold text-ink" : "border-line text-cream")}
    >
      {children}
    </button>
  );
}
