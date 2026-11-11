import {
  createDefaultDocument,
  DEVELOPER_TYPES,
  THEMES,
  SPRITE_LABELS,
  type EditorDocument,
  type WorldObject,
  type PixelAsset,
  MAX_CUSTOM_ASSETS,
  MAX_ASSET_FRAMES,
} from "@/types/editor";
import { constrainObject } from "./assets";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const string = (value: unknown, fallback: string, max: number) =>
  typeof value === "string" ? value.slice(0, max) : fallback;
const bound = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;

function parseAssets(input: unknown): PixelAsset[] {
  if (!Array.isArray(input)) return [];
  const ids = new Set<string>();
  return input.slice(0, MAX_CUSTOM_ASSETS).flatMap((value): PixelAsset[] => {
    if (
      !record(value) ||
      typeof value.id !== "string" ||
      !value.id ||
      (value.size !== 16 && value.size !== 32) ||
      !Array.isArray(value.frames)
    )
      return [];
    const id = value.id.slice(0, 80);
    if (ids.has(id)) return [];
    const size = value.size;
    const frames = value.frames
      .slice(0, MAX_ASSET_FRAMES)
      .flatMap((frame): (string | null)[][] => {
        if (!Array.isArray(frame) || frame.length !== size * size) return [];
        return [
          frame.map((color) =>
            typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)
              ? color
              : null,
          ),
        ];
      });
    if (!frames.length) return [];
    ids.add(id);
    return [
      {
        id,
        name:
          string(value.name, "Untitled character", 30).trim() ||
          "Untitled character",
        size,
        frames,
        cycles: value.cycles === 1 || value.cycles === 4 ? value.cycles : 2,
      },
    ];
  });
}
export function parseDocument(input: unknown): EditorDocument {
  const doc = createDefaultDocument();
  if (!record(input) || input.version !== 1)
    throw new Error("This saved project has an unsupported format.");
  if (record(input.profile)) {
    const p = input.profile;
    doc.profile.name = string(p.name, doc.profile.name, 30);
    doc.profile.title = string(p.title, doc.profile.title, 120);
    if (DEVELOPER_TYPES.includes(p.developerType as never))
      doc.profile.developerType =
        p.developerType as EditorDocument["profile"]["developerType"];
    if (Array.isArray(p.techStack))
      doc.profile.techStack = [
        ...new Set(
          p.techStack
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.trim().slice(0, 20))
            .filter(Boolean),
        ),
      ].slice(0, 10);
  }
  if (THEMES.some((t) => t.id === input.theme))
    doc.theme = input.theme as EditorDocument["theme"];
  if (typeof input.accent === "string" && /^#[0-9a-f]{6}$/i.test(input.accent))
    doc.accent = input.accent;
  doc.assets = parseAssets(input.assets);
  if (Array.isArray(input.objects)) {
    const ids = new Set<string>();
    doc.objects = input.objects.slice(0, 24).flatMap((o): WorldObject[] => {
      if (
        !record(o) ||
        typeof o.id !== "string" ||
        !o.id ||
        typeof o.sprite !== "string" ||
        !Object.hasOwn(SPRITE_LABELS, o.sprite)
      )
        return [];
      const id = o.id.slice(0, 80);
      if (ids.has(id)) return [];
      if (
        o.assetId !== undefined &&
        !doc.assets.some((asset) => asset.id === o.assetId)
      )
        return [];
      ids.add(id);
      const object: WorldObject = {
        id,
        sprite: o.sprite as WorldObject["sprite"],
        x: bound(o.x, 600, 0, 800),
        y: bound(o.y, 200, 0, 240),
        scale: bound(o.scale, 1, 0.75, 2),
      };
      if (typeof o.assetId === "string") object.assetId = o.assetId;
      constrainObject(object, doc.assets);
      return [object];
    });
  }
  if (record(input.effects))
    for (const key of Object.keys(
      doc.effects,
    ) as (keyof EditorDocument["effects"])[])
      if (typeof input.effects[key] === "boolean")
        doc.effects[key] = input.effects[key];
  if (record(input.export)) {
    doc.export.scale = input.export.scale === 2 ? 2 : 1;
    doc.export.format = input.export.format === "gif" ? "gif" : "png";
    doc.export.filename = sanitizeFilename(
      string(input.export.filename, doc.export.filename, 60),
    );
    doc.export.assetFolder = sanitizeFolder(
      string(input.export.assetFolder, "assets", 100),
    );
  }
  return doc;
}
export const sanitizeFilename = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "pixel-dev-card";
export const sanitizeFolder = (value: string) =>
  value
    .split("/")
    .filter((p) => p && p !== "." && p !== "..")
    .map((p) => p.replace(/[^a-zA-Z0-9_.-]/g, "-"))
    .join("/") || "assets";
