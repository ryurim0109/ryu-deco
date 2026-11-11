"use client";

import { create } from "zustand";
import {
  createDefaultDocument,
  type EditorDocument,
  type PanelId,
  type SpriteId,
  type WorldObject,
  type PixelAsset,
  MAX_CUSTOM_ASSETS,
} from "@/types/editor";
import {
  constrainObject,
  createPixelAsset,
  hasAssetPixels,
} from "@/lib/pixel/assets";

interface EditorState {
  document: EditorDocument;
  selectedId: string | null;
  panel: PanelId;
  past: EditorDocument[];
  future: EditorDocument[];
  hydrated: boolean;
  saveStatus: "loading" | "saving" | "saved" | "error";
  commit: (update: (document: EditorDocument) => void) => void;
  select: (id: string | null) => void;
  setPanel: (panel: PanelId) => void;
  updateObject: (
    id: string,
    patch: Partial<WorldObject>,
    transient?: boolean,
  ) => void;
  finishDrag: (before: EditorDocument) => void;
  addObject: (sprite: SpriteId) => void;
  createAsset: () => string | null;
  updateAsset: (asset: PixelAsset, transient?: boolean) => void;
  removeAsset: (id: string) => void;
  placeAsset: (id: string) => void;
  removeSelected: () => void;
  reorder: (direction: -1 | 1) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}
export const useEditor = create<EditorState>((set, get) => ({
  document: createDefaultDocument(),
  selectedId: "character",
  panel: "profile",
  past: [],
  future: [],
  hydrated: false,
  saveStatus: "loading",
  commit: (update) =>
    set((state) => {
      const next = structuredClone(state.document);
      update(next);
      return {
        document: next,
        past: [...state.past.slice(-29), state.document],
        future: [],
      };
    }),
  select: (selectedId) => set({ selectedId }),
  setPanel: (panel) => set({ panel }),
  updateObject: (id, patch, transient = false) => {
    const update = (doc: EditorDocument) => {
      const object = doc.objects.find((o) => o.id === id);
      if (object) {
        Object.assign(object, patch);
        constrainObject(object, doc.assets);
      }
    };
    if (transient)
      set((s) => {
        const document = structuredClone(s.document);
        update(document);
        return { document };
      });
    else get().commit(update);
  },
  finishDrag: (before) =>
    set((s) => ({ past: [...s.past.slice(-29), before], future: [] })),
  addObject: (sprite) => {
    if (get().document.objects.length >= 24) return;
    const id = crypto.randomUUID();
    get().commit((doc) => {
      doc.objects.push({
        id,
        sprite,
        x: 520 + Math.floor(Math.random() * 180),
        y: 204,
        scale: 1,
      });
    });
    set({ selectedId: id });
  },
  removeSelected: () => {
    const id = get().selectedId;
    if (!id) return;
    get().commit((d) => {
      d.objects = d.objects.filter((o) => o.id !== id);
    });
    set({ selectedId: null });
  },
  createAsset: () => {
    if (get().document.assets.length >= MAX_CUSTOM_ASSETS) return null;
    const asset = createPixelAsset();
    get().commit((doc) => {
      doc.assets.push(asset);
    });
    return asset.id;
  },
  updateAsset: (asset, transient = false) => {
    const update = (doc: EditorDocument) => {
      doc.assets = doc.assets.map((item) =>
        item.id === asset.id ? asset : item,
      );
      for (const object of doc.objects)
        if (object.assetId === asset.id) constrainObject(object, doc.assets);
    };
    if (transient)
      set((state) => {
        const document = {
          ...state.document,
          objects: state.document.objects.map((object) => ({ ...object })),
        };
        update(document);
        return { document };
      });
    else get().commit(update);
  },
  removeAsset: (id) =>
    get().commit((doc) => {
      doc.assets = doc.assets.filter((asset) => asset.id !== id);
      doc.objects = doc.objects.filter((object) => object.assetId !== id);
    }),
  placeAsset: (assetId) => {
    const asset = get().document.assets.find((item) => item.id === assetId);
    if (!asset || !hasAssetPixels(asset) || get().document.objects.length >= 24)
      return;
    const id = crypto.randomUUID();
    get().commit((doc) => {
      doc.objects.push({
        id,
        sprite: "cat",
        assetId,
        x: 580,
        y: 204,
        scale: asset.size === 32 ? 0.75 : 1.5,
      });
    });
    set({ selectedId: id });
  },
  reorder: (direction) =>
    get().commit((d) => {
      const i = d.objects.findIndex((o) => o.id === get().selectedId);
      const next = i + direction;
      if (i >= 0 && next >= 0 && next < d.objects.length)
        [d.objects[i], d.objects[next]] = [d.objects[next], d.objects[i]];
    }),
  undo: () =>
    set((s) => {
      const previous = s.past.at(-1);
      return previous
        ? {
            document: previous,
            past: s.past.slice(0, -1),
            future: [s.document, ...s.future],
            selectedId: null,
          }
        : {};
    }),
  redo: () =>
    set((s) => {
      const next = s.future[0];
      return next
        ? {
            document: next,
            past: [...s.past, s.document],
            future: s.future.slice(1),
            selectedId: null,
          }
        : {};
    }),
  reset: () => {
    get().commit((d) => Object.assign(d, createDefaultDocument()));
    set({ selectedId: "character" });
  },
}));
