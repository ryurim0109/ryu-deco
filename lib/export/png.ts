import { renderWorld, WORLD_HEIGHT, WORLD_WIDTH } from "@/lib/pixel/renderer";
import { sanitizeFilename, sanitizeFolder } from "@/lib/pixel/validation";
import type { EditorDocument } from "@/types/editor";

export async function waitForFonts() {
  await Promise.all([
    document.fonts.load('10px "Press Start 2P"'),
    document.fonts.load('600 23px "DM Sans"'),
    document.fonts.load('500 10px "DM Sans"'),
  ]);
  await document.fonts.ready;
}
export function createSceneCanvas(doc: EditorDocument, seconds = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error(
      "Your browser could not create a Canvas. Try another browser.",
    );
  renderWorld(ctx, doc, seconds);
  return resizeSceneCanvas(canvas, doc.export.scale);
}
function resizeSceneCanvas(canvas: HTMLCanvasElement, scale: 1 | 2) {
  if (scale === 1) return canvas;
  const output = document.createElement("canvas");
  output.width = canvas.width * scale;
  output.height = canvas.height * scale;
  const out = output.getContext("2d");
  if (!out) throw new Error("Could not create the output image.");
  out.imageSmoothingEnabled = false;
  out.drawImage(canvas, 0, 0, output.width, output.height);
  return output;
}
export async function exportPng(
  doc: EditorDocument,
  preview?: HTMLCanvasElement | null,
) {
  if (!preview) await waitForFonts();
  const canvas = preview
    ? resizeSceneCanvas(preview, doc.export.scale)
    : createSceneCanvas(doc);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error("PNG encoding failed. Please try again.")),
      "image/png",
    ),
  );
  downloadBlob(blob, `${sanitizeFilename(doc.export.filename)}.png`);
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
export function readmeMarkdown(
  doc: EditorDocument,
  format: "png" | "gif" = doc.export.format,
) {
  return `![My Pixel Dev Card](./${sanitizeFolder(doc.export.assetFolder)}/${sanitizeFilename(doc.export.filename)}.${format})`;
}
