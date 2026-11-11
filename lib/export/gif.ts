import type { EditorDocument } from "@/types/editor";
import { LOOP_SECONDS, sceneIsAnimated } from "@/lib/animation/timeline";
import { renderWorld, WORLD_HEIGHT, WORLD_WIDTH } from "@/lib/pixel/renderer";
import { waitForFonts } from "./png";

export const GIF_FPS = 10;
export const GIF_COLORS = 128;

export async function encodeGif(
  doc: EditorDocument,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<Blob> {
  signal.throwIfAborted();
  await waitForFonts();
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_WIDTH * doc.export.scale;
  canvas.height = WORLD_HEIGHT * doc.export.scale;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser could not create the GIF canvas.");
  ctx.imageSmoothingEnabled = false;
  ctx.scale(doc.export.scale, doc.export.scale);

  // One global palette keeps static parts of the card stable across frames.
  renderWorld(ctx, doc, 0);
  const scenePixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  // Reserve colors from every custom frame, including artwork absent at t=0.
  const placedIds = new Set(doc.objects.map((object) => object.assetId));
  const artColors = doc.assets
    .filter((asset) => placedIds.has(asset.id))
    .flatMap((asset) =>
      asset.frames.flat().filter((color): color is string => color !== null),
    );
  const artPixels = new Uint8Array(artColors.length * 4);
  artColors.forEach((color, index) => {
    artPixels[index * 4] = parseInt(color.slice(1, 3), 16);
    artPixels[index * 4 + 1] = parseInt(color.slice(3, 5), 16);
    artPixels[index * 4 + 2] = parseInt(color.slice(5, 7), 16);
    artPixels[index * 4 + 3] = 255;
  });
  const artPalette = artColors.length
    ? quantize(artPixels, GIF_COLORS / 2)
    : [];
  const palette = [
    ...artPalette,
    ...quantize(scenePixels, GIF_COLORS - artPalette.length),
  ];
  const encoder = GIFEncoder();
  const animated = sceneIsAnimated(doc);
  const frames = animated ? LOOP_SECONDS * GIF_FPS : 1;
  for (let frame = 0; frame < frames; frame++) {
    signal.throwIfAborted();
    renderWorld(ctx, doc, frame / GIF_FPS);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    encoder.writeFrame(
      applyPalette(data, palette),
      canvas.width,
      canvas.height,
      {
        palette: frame === 0 ? palette : undefined,
        delay: 1000 / GIF_FPS,
        repeat: 0,
      },
    );
    onProgress(Math.round(((frame + 1) / frames) * 100));
    // Yield after each frame so progress, editing, and cancellation stay usable.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  signal.throwIfAborted();
  encoder.finish();
  return new Blob([Uint8Array.from(encoder.bytes())], { type: "image/gif" });
}
