import type { EditorDocument, PixelAsset, WorldObject } from "@/types/editor";
import { objectPositionLimits } from "@/lib/pixel/assets";
export const LOOP_SECONDS = 4;
export function loopProgress(seconds: number) {
  return (
    (((seconds % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) / LOOP_SECONDS
  );
}
export function animatedPosition(
  object: WorldObject,
  effects: EditorDocument["effects"],
  seconds: number,
  assets: PixelAsset[] = [],
) {
  const character =
    Boolean(object.assetId) ||
    object.sprite === "cat" ||
    object.sprite === "rabbit" ||
    object.sprite === "fox";
  const angle = loopProgress(seconds) * Math.PI * 2;
  const limits = objectPositionLimits(object, assets);
  const x =
    object.x + (character && effects.walking ? Math.sin(angle) * 20 : 0);
  const y =
    object.y - (character && effects.floating ? (Math.sin(angle) + 1) * 3 : 0);
  return {
    x: Math.max(limits.minX, Math.min(limits.maxX, x)),
    y: Math.max(limits.minY, Math.min(limits.maxY, y)),
  };
}

export function assetFrameIndex(asset: PixelAsset, seconds: number) {
  return (
    Math.floor(loopProgress(seconds) * asset.cycles * asset.frames.length) %
    asset.frames.length
  );
}

export function sceneIsAnimated(doc: EditorDocument) {
  return (
    Object.values(doc.effects).some(Boolean) ||
    doc.objects.some((object) =>
      doc.assets.some(
        (asset) => asset.id === object.assetId && asset.frames.length > 1,
      ),
    )
  );
}
