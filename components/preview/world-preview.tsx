"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Undo2,
  Redo2,
  RotateCcw,
  MousePointer2,
  Scan,
  Grid2X2,
  Sparkles,
  Play,
  Pause,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import { renderWorld, objectBounds } from "@/lib/pixel/renderer";
import { waitForFonts } from "@/lib/export/png";
import { type EditorDocument } from "@/types/editor";
import { ThemePicker } from "./theme-picker";
import { LOOP_SECONDS, sceneIsAnimated } from "@/lib/animation/timeline";
import { objectLabel } from "@/lib/pixel/assets";

export function WorldPreview({
  canvasRef,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const {
    document: doc,
    selectedId,
    select,
    updateObject,
    finishDrag,
    past,
    future,
    undo,
    redo,
    reset,
  } = useEditor();
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    originalX: number;
    originalY: number;
    before: EditorDocument;
    moved: boolean;
  } | null>(null);
  const timeRef = useRef(0);
  const selectionRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(true);
  const hasEffects = sceneIsAnimated(doc);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      setPlaying(false);
    const onVisibilityChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  const [grid, setGrid] = useState(true);
  const [guides, setGuides] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let active = true;
    waitForFonts()
      .then(() => {
        if (active) setFontsReady(true);
      })
      .catch(() => {
        /* system font fallback */
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    function draw(seconds: number) {
      renderWorld(ctx!, doc, seconds);
      const selected = doc.objects.find((object) => object.id === selectedId);
      if (selected && selectionRef.current) {
        const bounds = objectBounds(selected, doc.effects, seconds, doc.assets);
        selectionRef.current.style.left = `${bounds.x / 8}%`;
        selectionRef.current.style.top = `${bounds.y / 2.4}%`;
      }
    }
    draw(timeRef.current);
    if (!playing || !hasEffects || dragging || !visible) return;
    let frameId = 0;
    let previous = performance.now();
    function frame(now: number) {
      timeRef.current =
        (timeRef.current + (now - previous) / 1000) % LOOP_SECONDS;
      previous = now;
      draw(timeRef.current);
      frameId = requestAnimationFrame(frame);
    }
    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, [
    doc,
    fontsReady,
    canvasRef,
    playing,
    hasEffects,
    dragging,
    visible,
    selectedId,
    guides,
  ]);
  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - b.left) / b.width) * 800,
      y: ((e.clientY - b.top) / b.height) * 240,
    };
  }, []);
  const selected = doc.objects.find((o) => o.id === selectedId);
  const bounds = selected
    ? objectBounds(selected, undefined, 0, doc.assets)
    : null;
  function endDrag(e: React.PointerEvent<HTMLCanvasElement>) {
    if (drag.current?.moved) finishDrag(drag.current.before);
    drag.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  return (
    <main className="world-main">
      <div className="world-heading">
        <div>
          <div className="eyebrow">
            <span className="mini-pixel-star">✦</span> A LITTLE WORLD, ALL YOURS
          </div>
          <h1>
            Your tiny corner of the internet<span>.</span>
          </h1>
          <p>
            A few pixels. A little personality. A world that feels like you.
          </p>
        </div>
      </div>
      <section className="world-workspace" aria-label="Pixel world workspace">
        <div className="workspace-toolbar">
          <div className="toolbar-group">
            <span className="scene-dot" />
            <span className="scene-name">My little world</span>
            <span className="scene-dimensions">800 × 240</span>
          </div>
          <div className="toolbar-group toolbar-actions">
            <button
              className="icon-button"
              aria-label={
                playing && hasEffects ? "Pause preview" : "Play preview"
              }
              title={
                hasEffects
                  ? "Play or pause animation"
                  : "Enable an effect to animate your world"
              }
              disabled={!hasEffects}
              onClick={() => setPlaying(!playing)}
            >
              {playing && hasEffects ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button
              className="icon-button"
              aria-label="Undo"
              title="Undo (⌘/Ctrl+Z)"
              disabled={!past.length}
              onClick={undo}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Redo"
              title="Redo (⌘/Ctrl+Shift+Z)"
              disabled={!future.length}
              onClick={redo}
            >
              <Redo2 size={16} />
            </button>
            <span className="toolbar-divider" />
            <button
              className="icon-button"
              aria-label="Reset world"
              title="Reset world (you can undo)"
              onClick={reset}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
        <div className={`world-stage ${grid ? "show-grid" : ""}`}>
          <div className="canvas-ruler top-ruler">
            <span>0</span>
            <span>200</span>
            <span>400</span>
            <span>600</span>
            <span>800</span>
          </div>
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={240}
              aria-label="Your pixel developer card. Select and drag objects to arrange your world."
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                const p = getPoint(e);
                const hit = [...doc.objects].reverse().find((o) => {
                  const b = objectBounds(
                    o,
                    doc.effects,
                    timeRef.current,
                    doc.assets,
                  );
                  return (
                    p.x >= b.x &&
                    p.x <= b.x + b.width &&
                    p.y >= b.y &&
                    p.y <= b.y + b.height
                  );
                });
                select(hit?.id ?? null);
                if (hit) {
                  setDragging(true);
                  drag.current = {
                    id: hit.id,
                    x: p.x,
                    y: p.y,
                    originalX: hit.x,
                    originalY: hit.y,
                    before: doc,
                    moved: false,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={(e) => {
                const current = drag.current;
                if (!current) return;
                const p = getPoint(e);
                if (Math.abs(p.x - current.x) + Math.abs(p.y - current.y) < 2)
                  return;
                current.moved = true;
                updateObject(
                  current.id,
                  {
                    x: Math.round(current.originalX + p.x - current.x),
                    y: Math.round(current.originalY + p.y - current.y),
                  },
                  true,
                );
              }}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
            />
            {guides && bounds && (
              <div
                ref={selectionRef}
                className="selection-box"
                style={{
                  left: `${bounds.x / 8}%`,
                  top: `${bounds.y / 2.4}%`,
                  width: `${bounds.width / 8}%`,
                  height: `${bounds.height / 2.4}%`,
                }}
              >
                <span />
                <span />
                <span />
                <span />
                <div className="selection-label">
                  {objectLabel(selected!, doc.assets)}
                </div>
              </div>
            )}
            <div className="canvas-corner tl" />
            <div className="canvas-corner tr" />
            <div className="canvas-corner bl" />
            <div className="canvas-corner br" />
          </div>
          <div className="stage-caption">
            {hasEffects
              ? "4-second loop · PNG captures the current frame"
              : "Enable effects or add an animated drawing to preview motion"}
          </div>
        </div>
        <div className="workspace-bottom">
          <span>
            <MousePointer2 size={13} /> Click to select · Drag to move
          </span>
          <div className="toolbar-group">
            <button
              aria-label="Toggle workspace grid"
              aria-pressed={grid}
              className={`icon-button ${grid ? "toggled" : ""}`}
              onClick={() => setGrid(!grid)}
              title="Toggle workspace grid"
            >
              <Grid2X2 size={14} />
            </button>
            <button
              aria-label="Toggle selection guides"
              aria-pressed={guides}
              className={`icon-button ${guides ? "toggled" : ""}`}
              onClick={() => setGuides(!guides)}
              title="Toggle selection guides"
            >
              <Scan size={15} />
            </button>
            <span className="fit-label">FIT</span>
          </div>
        </div>
      </section>
      <section className="themes-section">
        <div className="section-heading">
          <div>
            <h2>
              Pick your little universe <Sparkles size={15} />
            </h2>
            <p>Every developer deserves a change of scenery.</p>
          </div>
        </div>
        <ThemePicker />
      </section>
    </main>
  );
}
