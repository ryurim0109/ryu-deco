import type { PixelAsset } from "@/types/editor";

export interface PixelPoint {
  x: number;
  y: number;
}

export function paintLine(
  asset: PixelAsset,
  frameIndex: number,
  from: PixelPoint,
  to: PixelPoint,
  color: string | null,
): PixelAsset {
  const frame = [...asset.frames[frameIndex]];
  let { x, y } = from;
  const dx = Math.abs(to.x - x);
  const dy = -Math.abs(to.y - y);
  const stepX = x < to.x ? 1 : -1;
  const stepY = y < to.y ? 1 : -1;
  let error = dx + dy;
  let changed = false;
  // Bresenham interpolation fills cells skipped by fast pointer movements.
  while (true) {
    const index = y * asset.size + x;
    if (frame[index] !== color) {
      frame[index] = color;
      changed = true;
    }
    if (x === to.x && y === to.y) break;
    const twiceError = 2 * error;
    if (twiceError >= dy) {
      error += dy;
      x += stepX;
    }
    if (twiceError <= dx) {
      error += dx;
      y += stepY;
    }
  }
  if (!changed) return asset;
  return {
    ...asset,
    frames: asset.frames.map((pixels, index) =>
      index === frameIndex ? frame : pixels,
    ),
  };
}
