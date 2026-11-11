import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { EditorDocument } from "@/types/editor";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (error) => errors.get(page)!.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.get(page)!.push(message.text());
  });
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Character", exact: true }).click();
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

async function project(page: Page): Promise<EditorDocument> {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("ryu-deco:project:v1")!),
  );
}
async function openDrawing(page: Page) {
  await page
    .getByRole("button", { name: "Draw a character", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Pixel drawing editor", exact: true }),
  ).toBeVisible();
}
async function stroke(
  page: Page,
  from: [number, number],
  to = from,
  size = 16,
) {
  const canvas = page.getByLabel("Pixel drawing canvas", { exact: true });
  await canvas.scrollIntoViewIfNeeded();
  const bounds = (await canvas.boundingBox())!;
  const location = ([x, y]: [number, number]) => ({
    x: bounds.x + ((x + 0.5) * bounds.width) / size,
    y: bounds.y + ((y + 0.5) * bounds.height) / size,
  });
  await page.mouse.move(location(from).x, location(from).y);
  await page.mouse.down();
  await page.mouse.move(location(to).x, location(to).y, { steps: 1 });
  await page.mouse.up();
}
async function waitSaved(page: Page) {
  await expect(page.getByText("Drawing saved", { exact: true })).toBeVisible();
}

test("pencil interpolates a fast stroke, eraser clears pixels, and undo restores an entire stroke", async ({
  page,
}) => {
  await openDrawing(page);
  await stroke(page, [1, 1], [12, 1]);
  await waitSaved(page);
  let frame = (await project(page)).assets[0].frames[0];
  expect(frame.filter(Boolean)).toHaveLength(12);
  expect(frame.slice(17, 29)).toEqual(Array(12).fill("#514553"));
  expect(frame[0]).toBeNull();
  await page.getByRole("button", { name: "Undo drawing", exact: true }).click();
  await waitSaved(page);
  expect(
    (await project(page)).assets[0].frames[0].every((pixel) => pixel === null),
  ).toBe(true);
  await page.getByRole("button", { name: "Redo drawing", exact: true }).click();
  await page.getByRole("button", { name: "Eraser", exact: true }).click();
  await stroke(page, [5, 1], [7, 1]);
  await waitSaved(page);
  frame = (await project(page)).assets[0].frames[0];
  expect(frame.filter(Boolean)).toHaveLength(9);
  expect(frame.slice(21, 24)).toEqual([null, null, null]);
  await page.getByRole("button", { name: "Undo drawing", exact: true }).click();
  await waitSaved(page);
  expect(
    (await project(page)).assets[0].frames[0].filter(Boolean),
  ).toHaveLength(12);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/drawing-studio.png",
    fullPage: true,
  });
});

test("custom artwork appears in the world and PNG, survives reload, and can be edited and deleted", async ({
  page,
}) => {
  await openDrawing(page);
  await page.getByLabel("Drawing name", { exact: true }).fill("My comet");
  await page.getByLabel("Brush color", { exact: true }).fill("#00ff00");
  await stroke(page, [8, 8], [10, 8]);
  await page
    .getByRole("button", { name: "Add drawing to world", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".selected-object h3")).toHaveText("My comet");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const file = await readFile((await (await downloadPromise).path())!);
  const greenPixels = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] === 0 && pixels[i + 1] === 255 && pixels[i + 2] === 0)
        count++;
    return count;
  }, file.toString("base64"));
  expect(greenPixels).toBeGreaterThan(10);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Character", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit My comet", exact: true })
    .click();
  await expect(page.getByLabel("Drawing name", { exact: true })).toHaveValue(
    "My comet",
  );
  await waitSaved(page);
  expect(
    (await project(page)).assets[0].frames[0].filter(Boolean),
  ).toHaveLength(3);
  await page
    .getByRole("button", { name: "Brush color #d7778e", exact: true })
    .click();
  await stroke(page, [8, 8]);
  await page.getByRole("button", { name: "Save & close", exact: true }).click();
  await page
    .getByRole("button", { name: "Place My comet", exact: true })
    .click();
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  expect(
    (await project(page)).objects.filter((object) => object.assetId),
  ).toHaveLength(2);
  await page
    .getByRole("button", { name: "Delete drawing My comet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit My comet", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit My comet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  expect(
    (await project(page)).objects.filter((object) => object.assetId),
  ).toHaveLength(2);
});

test("animated 32-pixel drawings export all frame colors to GIF without scene effects", async ({
  page,
}) => {
  await openDrawing(page);
  await page.getByLabel("Grid size", { exact: true }).selectOption("32");
  await page.getByLabel("Brush color", { exact: true }).fill("#ff0000");
  await stroke(page, [8, 8], [12, 8], 32);
  await page
    .getByRole("button", { name: "Duplicate frame", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Clear current frame", exact: true })
    .click();
  await page.getByLabel("Brush color", { exact: true }).fill("#00ff00");
  await stroke(page, [8, 8], [12, 8], 32);
  await waitSaved(page);
  const asset = (await project(page)).assets[0];
  expect(asset.size).toBe(32);
  expect(asset.frames).toHaveLength(2);
  expect(asset.frames[0][8 * 32 + 8]).toBe("#ff0000");
  expect(asset.frames[1][8 * 32 + 8]).toBe("#00ff00");
  const preview = page.locator(".drawing-animation-preview canvas");
  const first = await preview.evaluate((canvas: HTMLCanvasElement) =>
    canvas.toDataURL(),
  );
  await expect
    .poll(() =>
      preview.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    )
    .not.toBe(first);
  await page
    .getByRole("button", { name: "Add drawing to world", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause preview", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("File format", { exact: true }).selectOption("gif");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  const file = await readFile((await (await downloadPromise).path())!);
  const decoded = await page.evaluate(async (base64) => {
    const { ImageDecoder } = globalThis as unknown as {
      ImageDecoder: new (init: { data: Uint8Array; type: string }) => {
        tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } };
        decode(options: { frameIndex: number }): Promise<{ image: VideoFrame }>;
        close(): void;
      };
    };
    const decoder = new ImageDecoder({
      data: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
      type: "image/gif",
    });
    await decoder.tracks.ready;
    const counts: { red: number; green: number }[] = [];
    for (const index of [0, 10]) {
      const { image } = await decoder.decode({ frameIndex: index });
      const canvas = document.createElement("canvas");
      canvas.width = image.displayWidth;
      canvas.height = image.displayHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0,
        green = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 220 && pixels[i + 1] < 30 && pixels[i + 2] < 30) red++;
        if (pixels[i] < 30 && pixels[i + 1] > 220 && pixels[i + 2] < 30)
          green++;
      }
      counts.push({ red, green });
      image.close();
    }
    const frames = decoder.tracks.selectedTrack.frameCount;
    decoder.close();
    return { counts, frames };
  }, file.toString("base64"));
  expect(decoded.frames).toBe(40);
  expect(decoded.counts[0].red).toBeGreaterThan(10);
  expect(decoded.counts[0].green).toBe(0);
  expect(decoded.counts[1].green).toBeGreaterThan(10);
  expect(decoded.counts[1].red).toBe(0);
});

test("resizing, frame deletion, keyboard drawing, and mobile layout remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDrawing(page);
  const canvas = page.getByLabel("Pixel drawing canvas", { exact: true });
  await canvas.focus();
  await canvas.press("ArrowRight");
  await canvas.press("Space");
  await page.getByLabel("Grid size", { exact: true }).selectOption("32");
  await waitSaved(page);
  expect(
    (await project(page)).assets[0].frames[0].filter(Boolean),
  ).toHaveLength(4);
  await page.getByRole("button", { name: "Undo drawing", exact: true }).click();
  await expect(page.getByLabel("Grid size", { exact: true })).toHaveValue("16");
  await page.getByRole("button", { name: "Add frame", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete current frame", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Select frame 2", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo drawing", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select frame 2", exact: true }),
  ).toBeVisible();
  const overflow = await page
    .getByRole("dialog")
    .evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth + 1);
  expect(overflow).toBe(false);
  await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/drawing-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save & close", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
