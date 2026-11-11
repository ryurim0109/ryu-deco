"use client";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileImage,
  Folder,
  Github,
  LoaderCircle,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import { downloadBlob, exportPng, readmeMarkdown } from "@/lib/export/png";
import { encodeGif } from "@/lib/export/gif";
import { sceneIsAnimated } from "@/lib/animation/timeline";
import { sanitizeFilename, sanitizeFolder } from "@/lib/pixel/validation";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied)
      throw new Error(
        "Copy is unavailable. Select the Markdown below and copy it manually.",
      );
  }
}
export function ExportPanel({
  canvasRef,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const id = useId();
  const { document: doc, commit, hydrated } = useEditor();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lastCopied, setLastCopied] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const markdown = readmeMarkdown(doc);
  const copied = markdown === lastCopied;
  async function download() {
    if (abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const snapshot = structuredClone(doc);
    setBusy(true);
    setMessage("");
    setFailed(false);
    setProgress(0);
    try {
      if (snapshot.export.format === "gif") {
        const blob = await encodeGif(snapshot, setProgress, controller.signal);
        controller.signal.throwIfAborted();
        downloadBlob(blob, `${sanitizeFilename(snapshot.export.filename)}.gif`);
        setMessage(`GIF downloaded · ${Math.round(blob.size / 1024)} KB`);
      } else {
        await exportPng(snapshot, canvasRef.current);
        setMessage("PNG downloaded.");
      }
    } catch (e) {
      setFailed(!controller.signal.aborted);
      setMessage(
        controller.signal.aborted
          ? "GIF export cancelled."
          : e instanceof Error
            ? e.message
            : "Could not export your image. Please try again.",
      );
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }
  return (
    <div className="export-panel">
      <div className="export-heading">
        <span className="export-heading-icon">
          <Download size={15} />
        </span>
        <h2>Take your world with you</h2>
      </div>
      <p className="export-description">Made for your GitHub. Ready to go.</p>
      <label className="field-label" htmlFor={`${id}-format`}>
        File format
      </label>
      <div className="select-wrap">
        <select
          id={`${id}-format`}
          value={doc.export.format}
          disabled={busy}
          onChange={(e) =>
            commit((d) => {
              d.export.format = e.target.value as "png" | "gif";
            })
          }
        >
          <option value="png">PNG · Current frame</option>
          <option value="gif">GIF · Animated loop</option>
        </select>
      </div>
      <label className="field-label" htmlFor={`${id}-size`}>
        Image size
      </label>
      <div className="select-wrap">
        <select
          id={`${id}-size`}
          value={doc.export.scale}
          disabled={busy}
          onChange={(e) =>
            commit((d) => {
              d.export.scale = Number(e.target.value) as 1 | 2;
            })
          }
        >
          <option value={1}>800 × 240 px · Original</option>
          <option value={2}>1600 × 480 px · 2× pixels</option>
        </select>
      </div>
      <div className="export-format">
        <span>
          <FileImage size={15} /> {doc.export.format.toUpperCase()} image
        </span>
        <span>
          {doc.export.format === "gif"
            ? "4 SEC · 10 FPS · 128 COLORS"
            : "CRISP PIXELS ✓"}
        </span>
      </div>
      <button
        className="primary-button download-button"
        onClick={download}
        disabled={busy || !hydrated}
      >
        {busy ? (
          <LoaderCircle size={16} className="spin" />
        ) : (
          <Download size={16} />
        )}
        {busy
          ? "Creating your world…"
          : `Download ${doc.export.format.toUpperCase()}`}
      </button>
      {busy && doc.export.format === "gif" && (
        <div className="gif-progress">
          <label htmlFor={`${id}-progress`}>Encoding GIF · {progress}%</label>
          <progress id={`${id}-progress`} value={progress} max={100} />
          <button
            className="text-button"
            onClick={() => abortRef.current?.abort()}
          >
            Cancel GIF export
          </button>
        </div>
      )}
      {doc.export.format === "gif" && !sceneIsAnimated(doc) && (
        <p className="micro-copy export-tip">
          Enable an effect or place an animated drawing to export motion. A
          still scene exports as one frame.
        </p>
      )}
      <button
        className="text-button file-settings-button"
        aria-expanded={advanced}
        onClick={() => setAdvanced(!advanced)}
      >
        File & README settings{" "}
        <ChevronDown size={13} className={advanced ? "rotated" : ""} />
      </button>
      {advanced && (
        <div className="file-settings">
          <label className="field-label" htmlFor={`${id}-filename`}>
            File name
          </label>
          <input
            id={`${id}-filename`}
            value={doc.export.filename}
            maxLength={60}
            onChange={(e) =>
              commit((d) => {
                d.export.filename = e.target.value;
              })
            }
            onBlur={() => {
              const value = sanitizeFilename(doc.export.filename);
              if (value !== doc.export.filename)
                commit((d) => {
                  d.export.filename = value;
                });
            }}
          />
          <label className="field-label" htmlFor={`${id}-folder`}>
            Repository folder
          </label>
          <input
            id={`${id}-folder`}
            value={doc.export.assetFolder}
            maxLength={100}
            onChange={(e) =>
              commit((d) => {
                d.export.assetFolder = e.target.value;
              })
            }
            onBlur={() => {
              const value = sanitizeFolder(doc.export.assetFolder);
              if (value !== doc.export.assetFolder)
                commit((d) => {
                  d.export.assetFolder = value;
                });
            }}
          />
          <p className="micro-copy">
            Relative to the README file. Letters, numbers, dashes, and
            underscores work best.
          </p>
        </div>
      )}
      <div className="readme-section">
        <div className="readme-title">
          <Github size={15} />
          <h3>A new home on GitHub</h3>
        </div>
        <ol>
          <li>
            Upload your {doc.export.format.toUpperCase()} to{" "}
            <code>{sanitizeFolder(doc.export.assetFolder)}/</code> in your
            public <code>username/username</code> repository.
          </li>
          <li>Paste this into its root README.md.</li>
        </ol>
        <div className="markdown-block">
          <code>{markdown}</code>
        </div>
        <button
          className="copy-button"
          onClick={async () => {
            try {
              await copyText(markdown);
              setLastCopied(markdown);
              setMessage(
                "Markdown copied. Your GitHub is about to get cozier.",
              );
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Could not copy the code.",
              );
            }
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy Markdown"}
        </button>
        <p className="upload-note">
          <Folder size={12} /> Upload the image first. The path points to your
          own repository.
        </p>
      </div>
      <p className="export-message" role={failed ? "alert" : "status"}>
        {message}
      </p>
    </div>
  );
}
