"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CircleHelp,
  Download,
  Github,
  Heart,
  LoaderCircle,
  SlidersHorizontal,
  WandSparkles,
  X,
} from "lucide-react";
import { useAutoSave } from "@/store/use-auto-save";
import { useEditor } from "@/store/editor";
import { EditorPanel } from "./editor-panel";
import { CustomizePanel } from "./customize-panel";
import { WorldPreview } from "@/components/preview/world-preview";
import { ExportPanel } from "@/components/export/export-panel";
import { SpritePreview } from "./sprite-preview";
import { DrawingEditor } from "@/components/drawing/drawing-editor";

export function EditorApp() {
  useAutoSave();
  const status = useEditor((s) => s.saveStatus);
  const [mobilePanel, setMobilePanel] = useState<"editor" | "customize">(
    "editor",
  );
  const [dialog, setDialog] = useState<"help" | "export" | "draw" | null>(null);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  function openDrawing(assetId?: string) {
    const id = assetId ?? useEditor.getState().createAsset();
    if (!id) return;
    setDrawingId(id);
    useEditor.getState().setPanel("character");
    setDialog("draw");
  }
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (dialog) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [dialog]);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest(
          "input, textarea, select, [contenteditable=true], dialog",
        )
      )
        return;
      const state = useEditor.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
        e.preventDefault();
        state.removeSelected();
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) &&
        state.selectedId
      ) {
        const object = state.document.objects.find(
          (o) => o.id === state.selectedId,
        );
        if (!object) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        state.updateObject(object.id, {
          x:
            object.x +
            (e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0),
          y:
            object.y +
            (e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0),
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="brand" aria-label="ryu-deco home">
          <span className="brand-mascot">
            <SpritePreview sprite="cat" size={39} />
          </span>
          <span className="brand-name">
            ryu<span>-</span>deco<span className="brand-sparkle">✦</span>
          </span>
          <span className="beta-badge">BETA</span>
        </Link>
        <div className="header-tagline">
          Decorate your GitHub, pixel by pixel.
        </div>
        <div className="header-actions">
          <span
            className={`save-status ${status === "error" ? "save-error" : ""}`}
            aria-live="polite"
          >
            {status === "saved" ? (
              <Check size={14} />
            ) : status === "error" ? (
              <span>!</span>
            ) : (
              <LoaderCircle size={13} className="spin" />
            )}
            <span>
              {status === "saved"
                ? "Saved on this device"
                : status === "error"
                  ? "Browser storage unavailable"
                  : status === "loading"
                    ? "Opening your world…"
                    : "Saving your world…"}
            </span>
          </span>
          <button
            className="help-button"
            onClick={() => setDialog("help")}
            aria-label="How it works"
          >
            <CircleHelp size={17} />
          </button>
          <button
            className="primary-button header-export"
            onClick={() => setDialog("export")}
          >
            <Download size={15} />
            <span>Export world</span>
          </button>
        </div>
      </header>
      <div className="app-subbar">
        <div className="subbar-label">
          <span className="live-dot" /> YOUR LITTLE CREATIVE SPACE
        </div>
        <span>
          <Heart size={11} /> A little personality goes a long way.
        </span>
      </div>
      <div className={`editor-layout mobile-${mobilePanel}`}>
        <EditorPanel onDraw={openDrawing} />
        <WorldPreview canvasRef={canvasRef} />
        <div className="mobile-panel-switch" aria-label="Mobile editor panels">
          <button
            className={mobilePanel === "editor" ? "active" : ""}
            aria-pressed={mobilePanel === "editor"}
            onClick={() => setMobilePanel("editor")}
          >
            <WandSparkles size={15} /> Editor
          </button>
          <button
            className={mobilePanel === "customize" ? "active" : ""}
            aria-pressed={mobilePanel === "customize"}
            onClick={() => setMobilePanel("customize")}
          >
            <SlidersHorizontal size={15} /> Customize & export
          </button>
        </div>
        <CustomizePanel canvasRef={canvasRef} />
      </div>
      <footer className="app-footer">
        <span>Handcrafted pixels. Endless little possibilities.</span>
        <span>
          Made with <Heart size={11} /> for your GitHub{" "}
          <span className="footer-flower">✳</span>
        </span>
      </footer>
      <dialog
        ref={dialogRef}
        aria-label={
          dialog === "draw"
            ? "Pixel drawing editor"
            : dialog === "export"
              ? "Export your world"
              : "How ryu-deco works"
        }
        onCancel={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDialog(null);
        }}
        className={`app-dialog ${dialog === "draw" ? "drawing-dialog" : ""}`}
      >
        <button
          className="icon-button dialog-close"
          aria-label="Close dialog"
          onClick={() => setDialog(null)}
        >
          <X size={20} />
        </button>
        {dialog === "draw" && drawingId ? (
          <DrawingEditor assetId={drawingId} onClose={() => setDialog(null)} />
        ) : dialog === "export" ? (
          <ExportPanel canvasRef={canvasRef} />
        ) : (
          <div className="help-content">
            <span className="dialog-pixel">✦</span>
            <div className="eyebrow">FROM A TINY WORLD TO YOUR README</div>
            <h2>A little guide to ryu-deco</h2>
            <ol>
              <li>
                <strong>Introduce yourself.</strong> Choose your developer type,
                write a little introduction, and add your stack.
              </li>
              <li>
                <strong>Make yourself at home.</strong> Pick a character and add
                decorations. Drag them around or fine-tune their position in the
                right panel.
              </li>
              <li>
                <strong>Take your world with you.</strong> Download a PNG or
                GIF, upload it to your repository, and paste the Markdown into
                its README.
              </li>
            </ol>
            <div className="help-note">
              <Github size={19} />
              <p>
                For your profile, add the image to the README in your{" "}
                <code>username/username</code> repository. Repository READMEs
                work too. GitHub’s default pinned repository cards cannot be
                redesigned with this image.
              </p>
            </div>
            <p className="muted-note">
              Changes save automatically in this browser. Use ⌘/Ctrl+Z to undo,
              arrow keys to move a selection, and Delete to remove it. Exports
              do not include selection outlines.
            </p>
          </div>
        )}
      </dialog>
    </div>
  );
}
