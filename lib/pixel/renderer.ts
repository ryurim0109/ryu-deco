import type {
  EditorDocument,
  PixelAsset,
  SpriteId,
  WorldObject,
} from "@/types/editor";
import { SPRITES, spritePalette } from "./sprites";
import {
  animatedPosition,
  assetFrameIndex,
  loopProgress,
} from "@/lib/animation/timeline";
import { drawAssetPixels, objectDimensions } from "./assets";

export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 240;
type Context = CanvasRenderingContext2D;
function rect(
  ctx: Context,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function objectBounds(
  object: WorldObject,
  effects?: EditorDocument["effects"],
  seconds = 0,
  assets: PixelAsset[] = [],
) {
  const { width, height } = objectDimensions(object, assets);
  const position = effects
    ? animatedPosition(object, effects, seconds, assets)
    : object;
  return {
    x: position.x - width / 2,
    y: position.y - height,
    width,
    height,
  };
}
export function drawSprite(
  ctx: Context,
  sprite: SpriteId,
  x: number,
  y: number,
  scale = 1,
  accent = "#d7778e",
) {
  const rows = SPRITES[sprite];
  const palette = spritePalette(accent, sprite);
  const size = scale * 3;
  const left = x - (Math.max(...rows.map((r) => r.length)) * size) / 2;
  const top = y - rows.length * size;
  rows.forEach((row, py) =>
    [...row].forEach((pixel, px) => {
      if (palette[pixel]) {
        ctx.fillStyle = palette[pixel];
        const x1 = Math.round(left + px * size),
          y1 = Math.round(top + py * size);
        ctx.fillRect(
          x1,
          y1,
          Math.round(left + (px + 1) * size) - x1,
          Math.round(top + (py + 1) * size) - y1,
        );
      }
    }),
  );
}
function pine(
  ctx: Context,
  x: number,
  y: number,
  size: number,
  color: string,
  snowy = false,
) {
  for (let n = 0; n < 5; n++) {
    const width = (n + 1) * size * 4;
    rect(ctx, color, x - width / 2, y - size * (14 - n * 2), width, size * 4);
    if (snowy && n % 2 === 0)
      rect(ctx, "#d9dce8", x - width / 2, y - size * (14 - n * 2), width, size);
  }
  rect(ctx, color, x - size, y - size * 4, size * 2, size * 5);
}
function star(ctx: Context, x: number, y: number, color: string, size = 2) {
  rect(ctx, color, x - size, y, size * 3, size);
  rect(ctx, color, x, y - size, size, size * 3);
}
export function drawBackground(
  ctx: Context,
  doc: EditorDocument,
  seconds: number,
) {
  const progress = loopProgress(seconds);
  const theme = doc.theme;
  if (theme === "cozy-room") {
    rect(ctx, "#bba59c", 0, 0, 800, 240);
    for (let x = 0; x < 800; x += 32) rect(ctx, "#c6b0a6", x, 0, 2, 190);
    rect(ctx, "#826f73", 522, 20, 198, 142);
    rect(ctx, "#e3c9ad", 528, 26, 186, 130);
    rect(ctx, "#7881a3", 534, 32, 174, 118);
    rect(ctx, "#e3c9ad", 616, 30, 6, 124);
    rect(ctx, "#e3c9ad", 530, 87, 180, 6);
    ctx.globalAlpha = doc.effects.stars
      ? 0.65 + Math.sin(progress * Math.PI * 2) * 0.35
      : 1;
    star(ctx, 568, 51, "#ede1b8");
    star(ctx, 680, 74, "#ede1b8");
    ctx.globalAlpha = 1;
    rect(ctx, "#877473", 0, 190, 800, 50);
    rect(ctx, "#c1a292", 0, 194, 800, 46);
    for (let y = 195; y < 240; y += 14) rect(ctx, "#ae9084", 0, y, 800, 2);
    rect(ctx, "#8b746c", 443, 175, 92, 8);
    rect(ctx, "#8b746c", 451, 183, 8, 32);
    rect(ctx, "#8b746c", 518, 183, 8, 32);
    rect(ctx, "#5a5366", 465, 136, 50, 33);
    rect(ctx, "#c4cdb8", 470, 141, 40, 23);
    rect(ctx, "#746b76", 485, 169, 10, 8);
  } else {
    const spring = theme === "spring-garden",
      dark = theme === "starry-sky";
    rect(
      ctx,
      spring ? "#b0b7b1" : dark ? "#53577d" : "#9298b8",
      0,
      0,
      800,
      240,
    );
    for (let i = 0; i < 6; i++)
      rect(
        ctx,
        spring
          ? `rgb(${176 + i * 5},${183 + i * 4},${177 + i * 5})`
          : dark
            ? `rgb(${83 + i * 4},${87 + i * 4},${125 + i * 4})`
            : `rgb(${146 + i * 4},${152 + i * 4},${184 + i * 3})`,
        0,
        70 + i * 23,
        800,
        24,
      );
    for (let i = 0; i < 27; i++) {
      const x = (i * 113 + 29) % 800,
        y = (i * 31 + 13) % 144;
      ctx.globalAlpha = doc.effects.stars
        ? 0.35 + (Math.sin(progress * Math.PI * 2 + i) + 1) * 0.325
        : 0.7;
      if (i % 5 === 0) star(ctx, x, y, spring ? "#fbefdc" : "#f8ecd2", 2);
      else rect(ctx, "#f4ecdf", x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    if (dark) drawSprite(ctx, "moon", 691, 76, 1.3);
    if (spring) {
      for (const x of [459, 730, 790]) {
        rect(ctx, "#a88d87", x - 5, 124, 10, 81);
        for (let i = 0; i < 4; i++)
          rect(
            ctx,
            ["#dbaab7", "#e4b9c3", "#edc8cd", "#f0d2d3"][i],
            x - 38 + (i % 2) * 6,
            93 + i * 12,
            76 - (i % 2) * 12,
            22,
          );
      }
    } else {
      for (let i = 0; i < 15; i++)
        pine(
          ctx,
          i * 67 - 5,
          198,
          2 + (i % 3) * 0.45,
          dark ? "#686c91" : "#a6aec6",
        );
      for (const x of [17, 420, 773, 812])
        pine(ctx, x, 208, 3.4, dark ? "#777e9b" : "#c4cadb", true);
      // Distant cabin: deliberately behind the editable characters and objects.
      rect(ctx, "#bdafbd", 622, 165, 39, 32);
      rect(ctx, "#e4dfe5", 614, 159, 55, 7);
      rect(ctx, "#e4dfe5", 621, 152, 41, 7);
      rect(ctx, "#f4dfb0", 631, 174, 9, 10);
    }
    rect(
      ctx,
      spring ? "#c6c8ad" : dark ? "#b9c3d7" : "#e3e6ef",
      0,
      200,
      800,
      40,
    );
    for (let i = 0; i < 20; i++)
      rect(
        ctx,
        spring ? "#d5d7bc" : "#f0f0f5",
        i * 42,
        193 + ((i * 7) % 12),
        44,
        25,
      );
    rect(ctx, spring ? "#e0dfc5" : "#f1f0f5", 0, 218, 800, 22);
    for (let i = 0; i < 23; i++)
      rect(
        ctx,
        spring ? "#adb799" : "#d7dce7",
        (i * 83 + 21) % 800,
        220 + ((i * 7) % 16),
        6,
        2,
      );
    if (spring)
      for (const x of [20, 441, 755]) drawSprite(ctx, "flowers", x, 225, 0.55);
  }
}
function wrap(ctx: Context, text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    // Word-aware wrapping with a character fallback for CJK and long tokens.
    for (const word of paragraph.split(/(\s+)/)) {
      if (line && ctx.measureText(line + word).width > width) {
        lines.push(line.trimEnd());
        line = "";
      }
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > width) {
          lines.push(line.trimEnd());
          line = "";
        }
        line += char;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
function drawProfile(ctx: Context, doc: EditorDocument) {
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fffaf4";
  ctx.font = '10px "Press Start 2P", monospace';
  const name = doc.profile.name || "YOUR NAME";
  let nameSize = 10;
  while (ctx.measureText(name).width > 410 && nameSize > 7) {
    nameSize--;
    ctx.font = `${nameSize}px "Press Start 2P", monospace`;
  }
  ctx.fillText(name, 34, 28);
  ctx.font = '500 10px "DM Sans", sans-serif';
  const badgeWidth = ctx.measureText(doc.profile.developerType).width + 18;
  rect(ctx, "#ffffff24", 34, 48, badgeWidth, 19);
  ctx.fillStyle = "#fffaf4";
  ctx.fillText(doc.profile.developerType, 43, 52);
  let fontSize = 23;
  const titleText = doc.profile.title.trim().replace(/\n{2,}/g, "\n");
  let title: string[] = [];
  for (; fontSize >= 10; fontSize--) {
    ctx.font = `600 ${fontSize}px "DM Sans", sans-serif`;
    title = wrap(
      ctx,
      fontSize >= 18 ? titleText : titleText.replace(/\s+/g, " "),
      410,
    );
    if (title.length * (fontSize + 4) <= 76) break;
  }
  title.forEach((line, i) =>
    ctx.fillText(line, 34, 79 + i * (fontSize + 4), 410),
  );
  let stackSize = 10;
  let positions: { text: string; x: number; y: number; w: number }[] = [];
  while (stackSize >= 7) {
    ctx.font = `500 ${stackSize}px "DM Sans", sans-serif`;
    let x = 34,
      y = 167;
    positions = doc.profile.techStack.map((text) => {
      const w = Math.min(
        stackSize === 7 ? 96 : 410,
        ctx.measureText(text).width + 16,
      );
      if (x + w > 444) {
        x = 34;
        y += 20;
      }
      const p = { text, x, y, w };
      x += w + 6;
      return p;
    });
    if (positions.every((p) => p.y <= 207)) break;
    stackSize--;
  }
  positions.forEach((p) => {
    rect(ctx, "#ffffffd9", p.x, p.y, p.w, 16);
    ctx.fillStyle = "#5d5b72";
    ctx.fillText(p.text, p.x + 8, p.y + 2, p.w - 16);
  });
}
export function renderWorld(ctx: Context, doc: EditorDocument, seconds = 0) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawBackground(ctx, doc, seconds);
  for (const object of doc.objects) {
    const p = animatedPosition(object, doc.effects, seconds, doc.assets);
    const asset = doc.assets.find((item) => item.id === object.assetId);
    if (asset) {
      const bounds = objectBounds(object, doc.effects, seconds, doc.assets);
      drawAssetPixels(
        ctx,
        asset,
        assetFrameIndex(asset, seconds),
        bounds.x,
        bounds.y,
        object.scale * 3,
      );
    } else {
      drawSprite(ctx, object.sprite, p.x, p.y, object.scale, doc.accent);
    }
  }
  drawProfile(ctx, doc);
  if (doc.theme === "snowy-night" || doc.effects.snow) {
    const progress = doc.effects.snow ? loopProgress(seconds) : 0;
    for (let i = 0; i < 42; i++) {
      const x =
        (i * 97 + 18 + Math.sin(progress * Math.PI * 2 + i) * 5 + 800) % 800;
      const y = (i * 47 + progress * 240) % 240;
      // Keep the text readable even when snow is enabled.
      ctx.globalAlpha = x < 444 ? 0.25 : 0.75;
      rect(ctx, "#ffffff", x, y, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
