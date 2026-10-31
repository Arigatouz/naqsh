import { Copy, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { DesignBoard } from "@/components/studio/DesignBoard";
import { useStudio } from "@/lib/studio/store";
import { SIZES, type Category, type Project } from "@/lib/studio/types";
import { TEMPLATES } from "@/lib/studio/templates";

const CATS = ["الكل", "تعليم", "مناسبات", "اقتباسات", "تجارة", "قصص", "هوية"] as const;

export function Home() {
  const projects = useStudio((s) => s.projects);
  const newDesign = useStudio((s) => s.newDesign);
  const openTemplate = useStudio((s) => s.openTemplate);
  const openProject = useStudio((s) => s.openProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const duplicateProject = useStudio((s) => s.duplicateProject);
  const [cat, setCat] = useState<(typeof CATS)[number]>("الكل");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const shown = TEMPLATES.filter((item) => cat === "الكل" || item.category === (cat as Category));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-2">
          <p className="text-xs text-gold">استوديو الكتابة على الصور</p>
          <h1 className="text-4xl font-bold text-cream">نَقْش</h1>
          <p className="max-w-xl text-sm leading-relaxed text-sand">
            صمّم منشورات وقصص وبطاقات بالعربي: خطوط، طبقات، ملصقات، ورسم. تصاميمك تبقى على جهازك فقط، بدون إعلانات وبدون رفع.
          </p>
        </header>

        <button
          type="button"
          className="flex h-12 items-center justify-center rounded-md bg-gold text-sm font-semibold text-ink hover:bg-gold-2"
          onClick={() => newDesign(1080, 1080)}
        >
          مساحة جديدة
        </button>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => newDesign(size.w, size.h, Boolean(size.transparent))}
              className="flex h-16 w-24 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-panel text-cream hover:border-gold"
            >
              <span className="text-sm font-semibold">{size.name}</span>
              <span className="text-xs text-sand">{size.hint}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {CATS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCat(item)}
              className={
                cat === item
                  ? "h-11 shrink-0 rounded-full bg-gold px-4 text-sm font-semibold text-ink"
                  : "h-11 shrink-0 rounded-full border border-line px-4 text-sm text-sand"
              }
            >
              {item}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {shown.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => openTemplate(template.project)}
              className="overflow-hidden rounded-lg border border-line bg-panel text-right hover:border-gold"
            >
              <Thumb project={template.project} />
              <span className="block px-3 py-2 text-sm text-cream">{template.name}</span>
            </button>
          ))}
        </section>

        <section className="flex flex-col gap-3 pb-8">
          <h2 className="text-sm font-semibold text-cream">تصاميمي</h2>
          {projects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-sand">
              ما عندك تصاميم محفوظة بعد. ابدأ من قالب أو من مساحة فاضية.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-lg border border-line bg-panel">
                  <button type="button" className="block w-full text-right" onClick={() => openProject(project.id)}>
                    <Thumb project={project} />
                    <span className="block truncate px-3 pt-2 text-sm text-cream">{project.name}</span>
                    <span className="block px-3 pb-2 text-xs text-sand">{formatTime(project.updatedAt)}</span>
                  </button>
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      type="button"
                      className="flex h-11 flex-1 items-center justify-center gap-1 rounded-md border border-line text-xs text-sand"
                      onClick={() => duplicateProject(project.id)}
                    >
                      <Copy className="size-4" />
                      نسخ
                    </button>
                    <button
                      type="button"
                      className="flex h-11 flex-1 items-center justify-center gap-1 rounded-md border border-line text-xs text-clay"
                      onClick={() => {
                        if (confirmId === project.id) deleteProject(project.id);
                        else setConfirmId(project.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                      {confirmId === project.id ? "تأكيد" : "حذف"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Thumb({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const apply = () => {
      if (node.clientWidth > 0) setScale(node.clientWidth / project.w);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => observer.disconnect();
  }, [project.w]);
  return (
    <div ref={ref} className="relative w-full overflow-hidden bg-ink" style={{ aspectRatio: `${project.w} / ${project.h}` }}>
      <div
        className="absolute top-0 left-0"
        style={{ width: project.w, height: project.h, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <DesignBoard project={project} viewScale={scale} />
      </div>
    </div>
  );
}

function formatTime(stamp: number) {
  if (!stamp) return "";
  return new Intl.DateTimeFormat("ar", { day: "numeric", month: "short" }).format(stamp);
}
