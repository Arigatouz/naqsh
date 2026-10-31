import { create } from "zustand";
import {
  bgLooksLight,
  blankProject,
  cloneProject,
  isProject,
  makeShape,
  makeSticker,
  makeText,
  uid,
  type Background,
  type DesignElement,
  type DrawEl,
  type ImageEl,
  type Project,
  type ShapeEl,
  type ShapeKind,
  type StickerEl,
  type Stroke,
  type TextEl,
} from "./types";

const KEY = "naqsh.projects.v1";

export type PanelId = "inspector" | "shapes" | "stickers" | "phrases" | "background" | "layers" | "brush" | null;
export type ToolId = "select" | "brush";

type AllFields = Omit<TextEl, "type"> &
  Omit<ShapeEl, "type"> &
  Omit<StickerEl, "type"> &
  Omit<ImageEl, "type"> &
  Omit<DrawEl, "type">;

export type ElementPatch = Partial<AllFields>;

type StudioState = {
  ready: boolean;
  screen: "home" | "editor";
  projects: Project[];
  current: Project | null;
  selectedId: string | null;
  editingId: string | null;
  tool: ToolId;
  panel: PanelId;
  mobileSheet: boolean;
  grid: boolean;
  past: string[];
  future: string[];
  brush: { color: string; size: number; opacity: number; erase: boolean };
  notice: string | null;
  boot: () => void;
  flash: (notice: string) => void;
  remember: () => void;
  newDesign: (w: number, h: number, transparent?: boolean) => void;
  openTemplate: (project: Project) => void;
  openProject: (id: string) => void;
  closeEditor: () => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  rename: (name: string) => void;
  undo: () => void;
  redo: () => void;
  select: (id: string | null) => void;
  editText: (id: string) => void;
  stopEdit: () => void;
  setTool: (tool: ToolId) => void;
  openPanel: (panel: PanelId) => void;
  setMobileSheet: (open: boolean) => void;
  toggleGrid: () => void;
  setBrush: (patch: Partial<StudioState["brush"]>) => void;
  updateElement: (id: string, patch: ElementPatch, history?: boolean, persist?: boolean) => void;
  persistCurrent: () => void;
  setBg: (patch: Partial<Background>, history?: boolean) => void;
  addText: (text?: string) => void;
  addShape: (shape: ShapeKind) => void;
  addSticker: (sticker: string) => void;
  addImage: (src: string) => void;
  addStroke: (stroke: Stroke) => void;
  duplicateElement: (id: string) => void;
  removeElement: (id: string) => void;
  moveLayer: (id: string, dir: -1 | 1) => void;
  toggleLock: (id: string) => void;
  toggleHide: (id: string) => void;
};

function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

function upsert(projects: Project[], project: Project) {
  const next = projects.some((item) => item.id === project.id)
    ? projects.map((item) => (item.id === project.id ? project : item))
    : [project, ...projects];
  return next.slice(0, 20);
}

function wideScreen() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

export const useStudio = create<StudioState>((set, get) => {
  function commit(project: Project, extra?: Partial<StudioState>) {
    const projects = upsert(get().projects, project);
    const ok = saveProjects(projects);
    set({
      current: project,
      projects,
      ...extra,
      notice: ok ? get().notice : "المساحة ممتلئة. احذف تصميماً قديماً أو صورة كبيرة.",
    });
  }

  function remember() {
    const current = get().current;
    if (!current) return;
    set({ past: [...get().past, JSON.stringify(current)].slice(-30), future: [] });
  }

  function placeSize(project: Project) {
    return Math.round(Math.min(project.w, project.h) * 0.36);
  }

  return {
    ready: false,
    screen: "home",
    projects: [],
    current: null,
    selectedId: null,
    editingId: null,
    tool: "select",
    panel: null,
    mobileSheet: false,
    grid: false,
    past: [],
    future: [],
    brush: { color: "#e0a84a", size: 28, opacity: 1, erase: false },
    notice: null,

    boot: () => {
      if (get().ready) return;
      let projects: Project[] = [];
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) projects = parsed.filter(isProject);
        }
      } catch {
        projects = [];
      }
      set({ projects, ready: true });
    },

    flash: (notice) => {
      set({ notice });
      window.setTimeout(() => {
        if (get().notice === notice) set({ notice: null });
      }, 2400);
    },

    remember,

    newDesign: (w, h, transparent = false) => {
      const project = blankProject(w, h, transparent);
      commit(project, {
        screen: "editor",
        selectedId: null,
        editingId: null,
        past: [],
        future: [],
        tool: "select",
        panel: null,
        mobileSheet: false,
      });
    },

    openTemplate: (project) => {
      commit(cloneProject(project), {
        screen: "editor",
        selectedId: null,
        editingId: null,
        past: [],
        future: [],
        tool: "select",
        panel: "inspector",
        mobileSheet: false,
      });
    },

    openProject: (id) => {
      const found = get().projects.find((item) => item.id === id);
      if (!found) return;
      set({
        current: structuredClone(found),
        screen: "editor",
        selectedId: null,
        editingId: null,
        past: [],
        future: [],
        tool: "select",
        panel: null,
        mobileSheet: false,
      });
    },

    closeEditor: () => set({ screen: "home", selectedId: null, editingId: null, tool: "select", mobileSheet: false }),

    deleteProject: (id) => {
      const projects = get().projects.filter((item) => item.id !== id);
      saveProjects(projects);
      const leaving = get().current?.id === id;
      set({
        projects,
        current: leaving ? null : get().current,
        screen: leaving ? "home" : get().screen,
      });
    },

    duplicateProject: (id) => {
      const found = get().projects.find((item) => item.id === id);
      if (!found) return;
      const copy = cloneProject(found, `${found.name} نسخة`);
      const projects = [copy, ...get().projects].slice(0, 20);
      saveProjects(projects);
      set({ projects });
    },

    rename: (name) => {
      const current = get().current;
      if (!current) return;
      commit({ ...current, name, updatedAt: Date.now() });
    },

    undo: () => {
      const { past, current, future } = get();
      if (!past.length || !current) return;
      const prev = JSON.parse(past[past.length - 1] ?? "null") as Project | null;
      if (!prev) return;
      prev.updatedAt = Date.now();
      const projects = upsert(get().projects, prev);
      saveProjects(projects);
      set({
        past: past.slice(0, -1),
        future: [...future, JSON.stringify(current)].slice(-30),
        current: prev,
        projects,
        selectedId: null,
        editingId: null,
      });
    },

    redo: () => {
      const { past, current, future } = get();
      if (!future.length || !current) return;
      const next = JSON.parse(future[future.length - 1] ?? "null") as Project | null;
      if (!next) return;
      next.updatedAt = Date.now();
      const projects = upsert(get().projects, next);
      saveProjects(projects);
      set({
        future: future.slice(0, -1),
        past: [...past, JSON.stringify(current)].slice(-30),
        current: next,
        projects,
        selectedId: null,
        editingId: null,
      });
    },

    select: (id) =>
      set({
        selectedId: id,
        editingId: null,
        tool: "select",
        panel: id ? "inspector" : get().panel,
        mobileSheet: false,
      }),

    editText: (id) => {
      const wide = wideScreen();
      set({
        selectedId: id,
        editingId: wide ? id : null,
        panel: "inspector",
        mobileSheet: !wide,
        tool: "select",
      });
    },

    stopEdit: () => set({ editingId: null }),

    setTool: (tool) => set({ tool, mobileSheet: tool === "brush" ? true : get().mobileSheet, panel: tool === "brush" ? "brush" : get().panel }),

    openPanel: (panel) => set({ panel, mobileSheet: true, tool: panel === "brush" ? "brush" : "select" }),

    setMobileSheet: (mobileSheet) => set({ mobileSheet }),

    toggleGrid: () => set({ grid: !get().grid }),

    setBrush: (patch) => set({ brush: { ...get().brush, ...patch } }),

    updateElement: (id, patch, history = true, persist = true) => {
      const current = get().current;
      if (!current) return;
      if (history) remember();
      const elements = current.elements.map((el) => {
        if (el.id !== id) return el;
        const next = { ...el, ...patch, type: el.type } as DesignElement;
        if (next.type === "text" && typeof patch.text === "string") next.name = patch.text.slice(0, 24) || "نص";
        return next;
      });
      const nextProject = { ...current, elements, updatedAt: Date.now() };
      if (!persist) {
        set({ current: nextProject });
        return;
      }
      commit(nextProject);
    },

    persistCurrent: () => {
      const current = get().current;
      if (!current) return;
      commit(current);
    },

    setBg: (patch, history = true) => {
      const current = get().current;
      if (!current) return;
      if (history) remember();
      const filter = patch.filter ? { ...current.bg.filter, ...patch.filter } : current.bg.filter;
      commit({ ...current, updatedAt: Date.now(), bg: { ...current.bg, ...patch, filter } });
    },

    addText: (text = "اكتب هنا") => {
      const current = get().current;
      if (!current) return;
      remember();
      const w = Math.round(current.w * 0.78);
      const fontSize = Math.max(32, Math.min(96, Math.round(current.w * 0.07)));
      const el = makeText({
        text,
        x: (current.w - w) / 2,
        y: (current.h - fontSize * 2) / 2,
        w,
        h: Math.round(fontSize * 2.2),
        fontSize,
        color: bgLooksLight(current.bg) ? "#14120e" : "#f6f1e7",
      });
      const wide = wideScreen();
      commit({ ...current, elements: [...current.elements, el], updatedAt: Date.now() }, {
        selectedId: el.id,
        editingId: wide ? el.id : null,
        panel: "inspector",
        mobileSheet: !wide,
        tool: "select",
      });
    },

    addShape: (shape) => {
      const current = get().current;
      if (!current) return;
      remember();
      const size = placeSize(current);
      const w = shape === "line" ? Math.round(current.w * 0.6) : size;
      const h = shape === "line" ? 10 : size;
      const el = makeShape({
        shape,
        x: (current.w - w) / 2,
        y: (current.h - h) / 2,
        w,
        h,
        fill: shape === "line" ? "#e0a84a" : "#e0a84a",
        stroke: "#f6f1e7",
        strokeWidth: shape === "line" ? 0 : 0,
        radius: 28,
        name: "شكل",
      });
      commit({ ...current, elements: [...current.elements, el], updatedAt: Date.now() }, {
        selectedId: el.id,
        panel: "shapes",
        tool: "select",
      });
    },

    addSticker: (sticker) => {
      const current = get().current;
      if (!current) return;
      remember();
      const size = Math.round(Math.min(current.w, current.h) * 0.28);
      const el = makeSticker({
        sticker,
        x: (current.w - size) / 2,
        y: (current.h - size) / 2,
        w: size,
        h: size,
        color: "#e0a84a",
      });
      commit({ ...current, elements: [...current.elements, el], updatedAt: Date.now() }, {
        selectedId: el.id,
        panel: "stickers",
        tool: "select",
      });
    },

    addImage: (src) => {
      const current = get().current;
      if (!current) return;
      remember();
      const size = Math.round(Math.min(current.w, current.h) * 0.55);
      const el: ImageEl = {
        id: uid(),
        type: "image",
        name: "صورة",
        x: (current.w - size) / 2,
        y: (current.h - size) / 2,
        w: size,
        h: size,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        src,
      };
      commit({ ...current, elements: [...current.elements, el], updatedAt: Date.now() }, {
        selectedId: el.id,
        panel: "inspector",
        tool: "select",
        mobileSheet: false,
      });
    },

    addStroke: (stroke) => {
      const current = get().current;
      if (!current || stroke.points.length === 0) return;
      remember();
      const host = [...current.elements].reverse().find((el) => el.type === "draw");
      let elements: DesignElement[];
      if (host && host.type === "draw") {
        const local: Stroke = {
          ...stroke,
          points: stroke.points.map((point) => ({ x: point.x - host.x, y: point.y - host.y })),
        };
        elements = current.elements.map((el) =>
          el.id === host.id && el.type === "draw" ? { ...el, strokes: [...el.strokes, local] } : el,
        );
      } else {
        const draw: DrawEl = {
          id: uid(),
          type: "draw",
          name: "رسم",
          x: 0,
          y: 0,
          w: current.w,
          h: current.h,
          rotation: 0,
          opacity: 1,
          locked: true,
          hidden: false,
          strokes: [stroke],
        };
        elements = [...current.elements, draw];
      }
      commit({ ...current, elements, updatedAt: Date.now() });
    },

    duplicateElement: (id) => {
      const current = get().current;
      if (!current) return;
      const el = current.elements.find((item) => item.id === id);
      if (!el || el.type === "draw") return;
      remember();
      const copy = structuredClone(el);
      copy.id = uid();
      copy.x += 28;
      copy.y += 28;
      copy.name = `${el.name} نسخة`;
      commit({ ...current, elements: [...current.elements, copy], updatedAt: Date.now() }, { selectedId: copy.id });
    },

    removeElement: (id) => {
      const current = get().current;
      if (!current) return;
      remember();
      commit(
        { ...current, elements: current.elements.filter((el) => el.id !== id), updatedAt: Date.now() },
        { selectedId: get().selectedId === id ? null : get().selectedId, editingId: null },
      );
    },

    moveLayer: (id, dir) => {
      const current = get().current;
      if (!current) return;
      const index = current.elements.findIndex((el) => el.id === id);
      const nextIndex = index + dir;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.elements.length) return;
      remember();
      const elements = current.elements.slice();
      const [item] = elements.splice(index, 1);
      if (!item) return;
      elements.splice(nextIndex, 0, item);
      commit({ ...current, elements, updatedAt: Date.now() });
    },

    toggleLock: (id) => {
      const el = get().current?.elements.find((item) => item.id === id);
      if (!el) return;
      get().updateElement(id, { locked: !el.locked });
    },

    toggleHide: (id) => {
      const el = get().current?.elements.find((item) => item.id === id);
      if (!el) return;
      get().updateElement(id, { hidden: !el.hidden });
    },
  };
});
