import { SPRITES } from "./sprites";
import {
  SPRITE_LABELS,
  type PixelAsset,
  type WorldObject,
} from "@/types/editor";

export function createPixelAsset(): PixelAsset {
  return {
    id: crypto.randomUUID(),
    name: "Untitled character",
    size: 16,
    frames: [Array<string | null>(16 * 16).fill(null)],
    cycles: 2,
  };
}

export function objectDimensions(
  object: WorldObject,
  assets: PixelAsset[] = [],
) {
  const asset = assets.find((item) => item.id === object.assetId);
  const rows = SPRITES[object.sprite];
  const pixelSize = object.scale * 3;
  return {
    width:
      (asset?.size ?? Math.max(...rows.map((row) => row.length))) * pixelSize,
    height: (asset?.size ?? rows.length) * pixelSize,
  };
}

export function objectPositionLimits(
  object: WorldObject,
  assets: PixelAsset[] = [],
) {
  const { width, height } = objectDimensions(object, assets);
  return {
    minX: Math.ceil(width / 2) + 1,
    maxX: Math.floor(799 - width / 2),
    minY: Math.ceil(height) + 1,
    maxY: 239,
  };
}

export function constrainObject(object: WorldObject, assets: PixelAsset[]) {
  const limits = objectPositionLimits(object, assets);
  object.x = Math.round(Math.max(limits.minX, Math.min(limits.maxX, object.x)));
  object.y = Math.round(Math.max(limits.minY, Math.min(limits.maxY, object.y)));
}

export function objectLabel(object: WorldObject, assets: PixelAsset[]) {
  const asset = assets.find((item) => item.id === object.assetId);
  return asset
    ? asset.name || "Untitled character"
    : SPRITE_LABELS[object.sprite];
}

export function drawAssetPixels(
  ctx: CanvasRenderingContext2D,
  asset: PixelAsset,
  frameIndex: number,
  left: number,
  top: number,
  pixelSize: number,
) {
  asset.frames[frameIndex].forEach((color, index) => {
    if (!color) return;
    const x = left + (index % asset.size) * pixelSize;
    const y = top + Math.floor(index / asset.size) * pixelSize;
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(x + pixelSize) - Math.round(x),
      Math.round(y + pixelSize) - Math.round(y),
    );
  });
}

export function hasAssetPixels(asset: PixelAsset) {
  return asset.frames.some((frame) => frame.some(Boolean));
}

export function resizeAsset(asset: PixelAsset, size: 16 | 32): PixelAsset {
  // Nearest-neighbor resizing preserves hard pixel edges in both directions.
  const frames = asset.frames.map((frame) =>
    Array.from({ length: size * size }, (_, index) => {
      const x = Math.floor(((index % size) * asset.size) / size);
      const y = Math.floor((Math.floor(index / size) * asset.size) / size);
      return frame[y * asset.size + x];
    }),
  );
  return { ...asset, size, frames };
}
