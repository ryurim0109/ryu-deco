import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (e) => errors.get(page)!.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.get(page)!.push(m.text());
  });
  await page.goto(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

test("profile editing and stack sorting update the Canvas and survive a reload", async ({
  page,
}) => {
  const canvas = page.locator(".canvas-container > canvas");
  const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page
    .getByLabel("Developer type", { exact: true })
    .selectOption("Backend Developer");
  await page
    .getByLabel("Your little introduction")
    .fill("I'm a backend-first full-stack developer");
  await page.getByLabel("Your name", { exact: false }).fill("RYURIM");
  await page.getByLabel("Tech stack", { exact: true }).fill("NestJS");
  await page
    .getByRole("button", { name: "Add technology", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move NestJS up", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove React", exact: true }).click();
  await expect(page.locator(".tech-name")).toHaveText([
    "TypeScript",
    "Next.js",
    "Python",
    "NestJS",
    "Docker",
  ]);
  const after = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  expect(after).not.toBe(before);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Developer type", { exact: true })).toHaveValue(
    "Backend Developer",
  );
  await expect(page.getByLabel("Your little introduction")).toHaveValue(
    "I'm a backend-first full-stack developer",
  );
  await expect(page.locator(".tech-name")).toHaveText([
    "TypeScript",
    "Next.js",
    "Python",
    "NestJS",
    "Docker",
  ]);
});

test("PNG contains exactly the preview pixels, without editor selection outlines", async ({
  page,
}) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("pixel-dev-card.png");
  const file = await readFile((await download.path())!);
  expect(file.readUInt32BE(16)).toBe(800);
  expect(file.readUInt32BE(20)).toBe(240);
  const result = await page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const output = document.createElement("canvas");
    output.width = 800;
    output.height = 240;
    const ctx = output.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const actual = ctx.getImageData(0, 0, 800, 240).data;
    const expected = document
      .querySelector<HTMLCanvasElement>(".canvas-container > canvas")!
      .getContext("2d")!
      .getImageData(0, 0, 800, 240).data;
    return {
      matches: actual.every((value, i) => value === expected[i]),
      colors: new Set(
        Array.from(
          { length: actual.length / 4 },
          (_, i) =>
            `${actual[i * 4]},${actual[i * 4 + 1]},${actual[i * 4 + 2]}`,
        ),
      ).size,
    };
  }, file.toString("base64"));
  expect(result.matches).toBe(true);
  expect(result.colors).toBeGreaterThan(30);
  await page.getByLabel("Image size").selectOption("2");
  const largerPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const larger = await readFile((await (await largerPromise).path())!);
  expect(larger.readUInt32BE(16)).toBe(1600);
  expect(larger.readUInt32BE(20)).toBe(480);
});

test("decorations can be added, dragged, customized, layered, deleted, and restored", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Decorations", exact: true }).click();
  await page.getByRole("button", { name: "Tiny House", exact: true }).click();
  await expect(page.locator(".selected-object h3")).toHaveText("Tiny House");
  await page.getByLabel("Position X").fill("650");
  await page.getByLabel("Position Y").fill("205");
  await page
    .getByRole("button", { name: "Toggle selection guides", exact: true })
    .click();
  const bounds = await page.locator(".canvas-container > canvas").boundingBox();
  const startX = bounds!.x + (650 / 800) * bounds!.width,
    startY = bounds!.y + (190 / 240) * bounds!.height;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 30, startY - 8, { steps: 6 });
  await page.mouse.up();
  expect(Number(await page.getByLabel("Position X").inputValue())).toBeLessThan(
    650,
  );
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete selected element", exact: true })
    .click();
  await expect(
    page.getByText("Pick a little thing", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".object-list")).toContainText("Tiny House");
});

test("README copy uses the actual export name and the user's relative asset folder", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "File & README settings", exact: true })
    .click();
  await page.getByLabel("File name", { exact: true }).fill("my-cozy-card");
  await page
    .getByLabel("Repository folder", { exact: true })
    .fill("assets/profile");
  await page
    .getByRole("button", { name: "Copy Markdown", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "![My Pixel Dev Card](./assets/profile/my-cozy-card.png)",
  );
});

test("invalid saved data recovers safely and mobile panels have no horizontal overflow", async ({
  page,
}) => {
  await page.evaluate(() =>
    localStorage.setItem(
      "ryu-deco:project:v1",
      '{"version":1,"profile":{"title":22,"techStack":[null,4,"React"]},"objects":[{"id":"bad","sprite":"not-a-sprite"}]}',
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByLabel("Your little introduction")).toHaveValue(
    "I'm a full-stack developer\nwho loves tiny worlds.",
  );
  await expect(page.locator(".tech-name")).toHaveText(["React"]);
  await page
    .getByRole("button", { name: "Customize & export", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-editor.png",
    fullPage: true,
  });
});

test("desktop editor renders without runtime errors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("link", { name: "ryu-deco home", exact: true }),
  ).toHaveAttribute("href", `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`);
  await expect(
    page.getByRole("heading", { name: "Your tiny corner of the internet." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-editor.png",
    fullPage: true,
  });
});

test("all four backgrounds render distinct scenes and the chosen theme survives reload", async ({
  page,
}) => {
  const canvas = page.locator(".canvas-container > canvas");
  const images = new Set<string>();
  for (const name of [
    "Snowy Night",
    "Spring Garden",
    "Cozy Room",
    "Starry Sky",
  ]) {
    const button = page
      .locator(".themes-section")
      .getByRole("button", { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    images.add(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()));
  }
  expect(images.size).toBe(4);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".themes-section")
      .getByRole("button", { name: "Starry Sky", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("effects animate, pause, resume, and preserve their settings", async ({
  page,
}) => {
  const canvas = page.locator(".canvas-container > canvas");
  await page.getByRole("button", { name: "Effects", exact: true }).click();
  for (const name of [
    "Falling Snow",
    "Twinkling Stars",
    "Floating",
    "Walking",
  ]) {
    await page.getByRole("switch", { name, exact: true }).check();
  }
  const moving = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await expect
    .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .not.toBe(moving);
  await page
    .getByRole("button", { name: "Pause preview", exact: true })
    .click();
  const paused = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(
    paused,
  );
  await page.getByRole("button", { name: "Play preview", exact: true }).click();
  await expect
    .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .not.toBe(paused);
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Effects", exact: true }).click();
  for (const name of [
    "Falling Snow",
    "Twinkling Stars",
    "Floating",
    "Walking",
  ]) {
    await expect(page.getByRole("switch", { name, exact: true })).toBeChecked();
  }
});

test("downloaded GIF decodes as forty moving frames and its Markdown uses the GIF path", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Effects", exact: true }).click();
  await page.getByRole("switch", { name: "Falling Snow", exact: true }).check();
  await page.getByRole("switch", { name: "Walking", exact: true }).check();
  await page.getByLabel("File format", { exact: true }).selectOption("gif");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("pixel-dev-card.gif");
  const file = await readFile((await download.path())!);
  expect(file.subarray(0, 6).toString()).toBe("GIF89a");
  expect(file.readUInt16LE(6)).toBe(800);
  expect(file.readUInt16LE(8)).toBe(240);
  expect(2 ** ((file[10] & 7) + 1)).toBeLessThanOrEqual(128);
  expect(file.includes(Buffer.from("NETSCAPE2.0"))).toBe(true);
  const decoded = await page.evaluate(async (base64) => {
    const { ImageDecoder } = globalThis as unknown as {
      ImageDecoder: new (init: { data: Uint8Array; type: string }) => {
        completed: Promise<void>;
        tracks: {
          ready: Promise<void>;
          selectedTrack: { frameCount: number; repetitionCount: number };
        };
        decode(options: { frameIndex: number }): Promise<{ image: VideoFrame }>;
        close(): void;
      };
    };
    const decoder = new ImageDecoder({
      data: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
      type: "image/gif",
    });
    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    const first = (await decoder.decode({ frameIndex: 0 })).image;
    const next = (await decoder.decode({ frameIndex: 10 })).image;
    const canvas = document.createElement("canvas");
    canvas.width = first.displayWidth;
    canvas.height = first.displayHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(first, 0, 0);
    const start = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    ctx.drawImage(next, 0, 0);
    const later = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const result = {
      frames: track.frameCount,
      loops: track.repetitionCount,
      duration: first.duration,
      changed: start.some((value, i) => value !== later[i]),
    };
    first.close();
    next.close();
    decoder.close();
    return result;
  }, file.toString("base64"));
  expect(decoded.frames).toBe(40);
  expect(decoded.duration).toBe(100_000);
  expect(decoded.loops).toBe(Infinity);
  expect(decoded.changed).toBe(true);
  await page
    .getByRole("button", { name: "Copy Markdown", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "![My Pixel Dev Card](./assets/pixel-dev-card.gif)",
  );
});

test("GIF encoding errors are visible and export can be retried", async ({
  page,
}) => {
  await page.getByLabel("File format", { exact: true }).selectOption("gif");
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (args[1]?.willReadFrequently) return null;
      return original.apply(this, args);
    } as typeof original;
    (window as unknown as { restoreCanvas: () => void }).restoreCanvas = () => {
      HTMLCanvasElement.prototype.getContext = original;
    };
  });
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  await expect(page.locator(".export-panel").getByRole("alert")).toHaveText(
    "Your browser could not create the GIF canvas.",
  );
  await page.evaluate(() =>
    (window as unknown as { restoreCanvas: () => void }).restoreCanvas(),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "pixel-dev-card.gif",
  );
});

test("GIF export can be cancelled and retried at double resolution", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Effects", exact: true }).click();
  await page.getByRole("switch", { name: "Falling Snow", exact: true }).check();
  await page.getByLabel("File format", { exact: true }).selectOption("gif");
  await page.getByLabel("Image size", { exact: true }).selectOption("2");
  let downloads = 0;
  page.on("download", () => downloads++);
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  await expect(page.getByRole("progressbar")).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel GIF export", exact: true })
    .click();
  await expect(
    page.getByText("GIF export cancelled.", { exact: true }),
  ).toBeVisible();
  expect(downloads).toBe(0);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  const file = await readFile((await (await downloadPromise).path())!);
  expect(file.readUInt16LE(6)).toBe(1600);
  expect(file.readUInt16LE(8)).toBe(480);
  expect(downloads).toBe(1);
});
