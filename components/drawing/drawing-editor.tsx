"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  Copy,
  Eraser,
  Grid2X2,
  Pause,
  Pencil,
  Play,
  Plus,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import {
  MAX_ASSET_FRAMES,
  type EditorDocument,
  type PixelAsset,
} from "@/types/editor";
import {
  drawAssetPixels,
  hasAssetPixels,
  resizeAsset,
} from "@/lib/pixel/assets";
import { paintLine, type PixelPoint } from "@/lib/pixel/drawing";
import { AssetPreview } from "./asset-preview";

const PALETTE = [
  "#514553",
  "#fff9ee",
  "#f3dfc9",
  "#d7778e",
  "#e9a1ae",
  "#f7db9d",
  "#648e83",
  "#96b5a1",
  "#7f9fbc",
  "#9c91bd",
  "#d99973",
  "#927566",
];

interface Stroke {
  beforeAsset: PixelAsset;
  beforeDocument: EditorDocument;
  frame: number;
  last: PixelPoint | null;
  pointerId: number;
  color: string | null;
  changed: boolean;
}

export function DrawingEditor({
  assetId,
  onClose,
}: {
  assetId: string;
  onClose: () => void;
}) {
  const id = useId();
  const asset = useEditor((s) =>
    s.document.assets.find((item) => item.id === assetId),
  )!;
  const status = useEditor((s) => s.saveStatus);
  const objectCount = useEditor((s) => s.document.objects.length);
  const [activeFrame, setActiveFrame] = useState(0);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const [color, setColor] = useState(PALETTE[0]);
  const [grid, setGrid] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [cursor, setCursor] = useState<PixelPoint>({ x: 0, y: 0 });
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<{
    past: PixelAsset[];
    future: PixelAsset[];
  }>({ past: [], future: [] });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<Stroke | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      setPlaying(false);
    return () => {
      const stroke = strokeRef.current;
      if (stroke?.changed)
        useEditor.getState().finishDrag(stroke.beforeDocument);
    };
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 512, 512);
    const step = 512 / asset.size;
    drawAssetPixels(ctx, asset, activeFrame, 0, 0, step);
    if (grid) {
      ctx.strokeStyle = "#8f7d8d33";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let index = 1; index < asset.size; index++) {
        const position = index * step + 0.5;
        ctx.moveTo(position, 0);
        ctx.lineTo(position, 512);
        ctx.moveTo(0, position);
        ctx.lineTo(512, position);
      }
      ctx.stroke();
    }
    if (focused) {
      ctx.strokeStyle = "#9d6175";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        cursor.x * step + 2,
        cursor.y * step + 2,
        step - 4,
        step - 4,
      );
    }
  }, [asset, activeFrame, grid, cursor, focused]);

  function remember(previous: PixelAsset) {
    setHistory((state) => ({
      past: [...state.past.slice(-49), previous],
      future: [],
    }));
  }

  function apply(next: PixelAsset) {
    remember(asset);
    useEditor.getState().updateAsset(next);
  }

  function restore(direction: "undo" | "redo") {
    const next = direction === "undo" ? history.past.at(-1) : history.future[0];
    if (!next) return;
    setHistory(
      direction === "undo"
        ? {
            past: history.past.slice(0, -1),
            future: [asset, ...history.future],
          }
        : {
            past: [...history.past, asset],
            future: history.future.slice(1),
          },
    );
    setActiveFrame(Math.min(activeFrame, next.frames.length - 1));
    setCursor({ x: 0, y: 0 });
    useEditor.getState().updateAsset(next);
  }

  function point(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): PixelPoint | null {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      ((event.clientX - bounds.left) / bounds.width) * asset.size,
    );
    const y = Math.floor(
      ((event.clientY - bounds.top) / bounds.height) * asset.size,
    );
    return x >= 0 && y >= 0 && x < asset.size && y < asset.size
      ? { x, y }
      : null;
  }

  function paint(nextPoint: PixelPoint) {
    const stroke = strokeRef.current;
    if (!stroke) return;
    const current = useEditor
      .getState()
      .document.assets.find((item) => item.id === assetId)!;
    const next = paintLine(
      current,
      stroke.frame,
      stroke.last ?? nextPoint,
      nextPoint,
      stroke.color,
    );
    if (next !== current) {
      stroke.changed = true;
      useEditor.getState().updateAsset(next, true);
    }
    stroke.last = nextPoint;
    setCursor(nextPoint);
  }

  function finishStroke() {
    const stroke = strokeRef.current;
    strokeRef.current = null;
    if (stroke?.changed) {
      remember(stroke.beforeAsset);
      useEditor.getState().finishDrag(stroke.beforeDocument);
    }
  }

  function addFrame(duplicate: boolean) {
    const frames = [...asset.frames];
    frames.splice(
      activeFrame + 1,
      0,
      duplicate
        ? [...frames[activeFrame]]
        : Array<string | null>(asset.size * asset.size).fill(null),
    );
    apply({ ...asset, frames });
    setActiveFrame(activeFrame + 1);
  }

  return (
    <div
      className="drawing-editor"
      onKeyDown={(event) => {
        if (
          event.defaultPrevented ||
          (event.target as HTMLElement).closest("input, select")
        )
          return;
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "z"
        ) {
          event.preventDefault();
          event.stopPropagation();
          restore(event.shiftKey ? "redo" : "undo");
        } else if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "y"
        ) {
          event.preventDefault();
          event.stopPropagation();
          restore("redo");
        } else if (event.key.toLowerCase() === "b") setTool("pencil");
        else if (event.key.toLowerCase() === "e") setTool("eraser");
      }}
    >
      <div className="drawing-header">
        <div>
          <h2>Pixel drawing studio</h2>
          <p>Draw your own character. Each square is one pixel.</p>
        </div>
        <span className="drawing-save-status" role="status">
          {status === "saved"
            ? "Drawing saved"
            : status === "error"
              ? "Storage unavailable"
              : "Saving drawing…"}
        </span>
      </div>
      <div className="drawing-layout">
        <section
          className="drawing-workspace"
          aria-label="Drawing tools and canvas"
        >
          <div className="drawing-toolbar">
            <div
              className="toolbar-group"
              role="group"
              aria-label="Drawing tools"
            >
              <button
                className={`icon-button ${tool === "pencil" ? "toggled" : ""}`}
                aria-label="Pencil"
                aria-pressed={tool === "pencil"}
                title="Pencil (B)"
                onClick={() => setTool("pencil")}
              >
                <Pencil size={17} />
              </button>
              <button
                className={`icon-button ${tool === "eraser" ? "toggled" : ""}`}
                aria-label="Eraser"
                aria-pressed={tool === "eraser"}
                title="Eraser (E)"
                onClick={() => setTool("eraser")}
              >
                <Eraser size={17} />
              </button>
              <span className="toolbar-divider" />
              <button
                className="icon-button"
                aria-label="Undo drawing"
                title="Undo drawing (⌘/Ctrl+Z)"
                disabled={!history.past.length}
                onClick={() => restore("undo")}
              >
                <Undo2 size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Redo drawing"
                title="Redo drawing (⌘/Ctrl+Shift+Z)"
                disabled={!history.future.length}
                onClick={() => restore("redo")}
              >
                <Redo2 size={16} />
              </button>
            </div>
            <div className="toolbar-group">
              <button
                className={`icon-button ${grid ? "toggled" : ""}`}
                aria-label="Toggle drawing grid"
                aria-pressed={grid}
                onClick={() => setGrid(!grid)}
              >
                <Grid2X2 size={16} />
              </button>
              <button
                className="icon-button"
                aria-label="Clear current frame"
                title="Clear current frame (you can undo)"
                disabled={!asset.frames[activeFrame].some(Boolean)}
                onClick={() =>
                  apply({
                    ...asset,
                    frames: asset.frames.map((frame, index) =>
                      index === activeFrame ? frame.map(() => null) : frame,
                    ),
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="drawing-canvas-shell checkerboard">
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              tabIndex={0}
              aria-label="Pixel drawing canvas"
              aria-describedby={`${id}-instructions`}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                finishStroke();
                setFocused(false);
              }}
              onKeyDown={(event) => {
                const moves: Record<string, PixelPoint> = {
                  ArrowLeft: { x: -1, y: 0 },
                  ArrowRight: { x: 1, y: 0 },
                  ArrowUp: { x: 0, y: -1 },
                  ArrowDown: { x: 0, y: 1 },
                };
                const move = moves[event.key];
                if (move) {
                  event.preventDefault();
                  event.stopPropagation();
                  setCursor({
                    x: Math.max(0, Math.min(asset.size - 1, cursor.x + move.x)),
                    y: Math.max(0, Math.min(asset.size - 1, cursor.y + move.y)),
                  });
                } else if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  const next = paintLine(
                    asset,
                    activeFrame,
                    cursor,
                    cursor,
                    tool === "eraser" ? null : color,
                  );
                  if (next !== asset) apply(next);
                }
              }}
              onPointerDown={(event) => {
                if (event.button !== 0 || strokeRef.current) return;
                const first = point(event);
                if (!first) return;
                event.currentTarget.focus({ preventScroll: true });
                strokeRef.current = {
                  beforeAsset: asset,
                  beforeDocument: useEditor.getState().document,
                  frame: activeFrame,
                  last: first,
                  pointerId: event.pointerId,
                  color: tool === "eraser" ? null : color,
                  changed: false,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
                paint(first);
              }}
              onPointerMove={(event) => {
                if (strokeRef.current?.pointerId !== event.pointerId) return;
                const next = point(event);
                if (next) paint(next);
                else strokeRef.current.last = null;
              }}
              onPointerUp={(event) => {
                if (strokeRef.current?.pointerId !== event.pointerId) return;
                finishStroke();
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={finishStroke}
              onLostPointerCapture={finishStroke}
            />
          </div>
          <p id={`${id}-instructions`} className="drawing-instructions">
            Drag to draw. Keyboard: arrows move the cursor, Space paints, B
            selects pencil, E selects eraser.
          </p>
          <div className="frame-heading">
            <h3>Animation frames</h3>
            <span>
              {asset.frames.length}/{MAX_ASSET_FRAMES}
            </span>
          </div>
          <div
            className="frame-list"
            role="group"
            aria-label="Animation frames"
          >
            {asset.frames.map((_, index) => (
              <button
                key={index}
                className={`frame-button ${activeFrame === index ? "selected" : ""}`}
                aria-label={`Select frame ${index + 1}`}
                aria-pressed={activeFrame === index}
                onClick={() => setActiveFrame(index)}
              >
                <span className="frame-thumbnail checkerboard">
                  <AssetPreview asset={asset} frameIndex={index} size={44} />
                </span>
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
          <div className="frame-actions">
            <button
              className="secondary-button"
              disabled={asset.frames.length >= MAX_ASSET_FRAMES}
              onClick={() => addFrame(false)}
            >
              <Plus size={13} /> Add frame
            </button>
            <button
              className="secondary-button"
              disabled={asset.frames.length >= MAX_ASSET_FRAMES}
              onClick={() => addFrame(true)}
            >
              <Copy size={13} /> Duplicate frame
            </button>
            <button
              className="icon-button"
              aria-label="Delete current frame"
              title="Delete current frame (you can undo)"
              disabled={asset.frames.length === 1}
              onClick={() => {
                apply({
                  ...asset,
                  frames: asset.frames.filter(
                    (_, index) => index !== activeFrame,
                  ),
                });
                setActiveFrame(Math.min(activeFrame, asset.frames.length - 2));
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </section>
        <aside className="drawing-settings" aria-label="Drawing settings">
          <label className="field-label" htmlFor={`${id}-name`}>
            Drawing name
          </label>
          <input
            id={`${id}-name`}
            value={asset.name}
            maxLength={30}
            onChange={(event) => apply({ ...asset, name: event.target.value })}
            onBlur={() => {
              if (!asset.name.trim())
                apply({ ...asset, name: "Untitled character" });
            }}
          />
          <label className="field-label" htmlFor={`${id}-size`}>
            Grid size
          </label>
          <div className="select-wrap">
            <select
              id={`${id}-size`}
              value={asset.size}
              onChange={(event) => {
                apply(
                  resizeAsset(asset, Number(event.target.value) as 16 | 32),
                );
                setCursor({ x: 0, y: 0 });
              }}
            >
              <option value={16}>16 × 16 pixels</option>
              <option value={32}>32 × 32 pixels</option>
            </select>
          </div>
          <p className="micro-copy">
            Changing size rescales your artwork. Undo restores it.
          </p>
          <label className="field-label" htmlFor={`${id}-color`}>
            Brush color
          </label>
          <div
            className="drawing-palette"
            role="group"
            aria-label="Drawing palette"
          >
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                className={`drawing-swatch ${color === swatch ? "selected" : ""}`}
                style={{ backgroundColor: swatch }}
                aria-label={`Brush color ${swatch}`}
                aria-pressed={color === swatch}
                onClick={() => {
                  setColor(swatch);
                  setTool("pencil");
                }}
              />
            ))}
          </div>
          <div className="brush-color-field">
            <input
              id={`${id}-color`}
              type="color"
              value={color}
              onChange={(event) => {
                setColor(event.target.value);
                setTool("pencil");
              }}
            />
            <code>{color}</code>
          </div>
          <div className="drawing-preview-heading">
            <h3>Animation preview</h3>
            <button
              className="icon-button"
              aria-label={
                playing ? "Pause drawing preview" : "Play drawing preview"
              }
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
          <div className="drawing-animation-preview checkerboard">
            <AssetPreview asset={asset} size={128} animate={playing} />
          </div>
          <label className="field-label" htmlFor={`${id}-cycles`}>
            Animation repeat
          </label>
          <div className="select-wrap">
            <select
              id={`${id}-cycles`}
              value={asset.cycles}
              onChange={(event) =>
                apply({
                  ...asset,
                  cycles: Number(event.target.value) as 1 | 2 | 4,
                })
              }
            >
              <option value={1}>1 cycle every 4 seconds</option>
              <option value={2}>2 cycles every 4 seconds</option>
              <option value={4}>4 cycles every 4 seconds</option>
            </select>
          </div>
          <p className="micro-copy">
            The checkerboard is transparent. Only painted pixels appear in your
            world.
          </p>
          <button
            className="primary-button place-drawing-button"
            disabled={!hasAssetPixels(asset) || objectCount >= 24}
            onClick={() => {
              useEditor.getState().placeAsset(assetId);
              onClose();
            }}
          >
            <Plus size={15} /> Add drawing to world
          </button>
          <button className="secondary-button drawing-done" onClick={onClose}>
            Save & close
          </button>
        </aside>
      </div>
    </div>
  );
}
