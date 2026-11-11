"use client";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { useEditor } from "@/store/editor";
import { drawBackground, drawSprite } from "@/lib/pixel/renderer";
import { THEMES, type ThemeId } from "@/types/editor";

export function ThemeThumbnail({ theme }: { theme: ThemeId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const doc = { ...useEditor.getState().document, theme };
    ctx.save();
    ctx.scale(0.4, 0.4);
    drawBackground(ctx, doc, 0);
    drawSprite(ctx, "cat", 556, 203, 1.25);
    const decoration =
      theme === "spring-garden"
        ? "flowers"
        : theme === "cozy-room"
          ? "rabbit"
          : "tree";
    drawSprite(ctx, decoration, 705, 202, 1.2);
    ctx.restore();
  }, [theme]);
  return <canvas width={320} height={96} ref={ref} aria-hidden="true" />;
}

export function ThemePicker() {
  const themeId = useEditor((s) => s.document.theme);
  const commit = useEditor((s) => s.commit);
  return (
    <div className="theme-grid" role="group" aria-label="Background themes">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`theme-card ${themeId === theme.id ? "selected" : ""}`}
          aria-label={theme.name}
          aria-pressed={themeId === theme.id}
          onClick={() => {
            if (themeId !== theme.id)
              commit((d) => {
                d.theme = theme.id;
              });
          }}
        >
          <div className="theme-image">
            <ThemeThumbnail theme={theme.id} />
            {themeId === theme.id && (
              <span className="theme-check">
                <Check size={12} />
              </span>
            )}
          </div>
          <h3>{theme.name}</h3>
          <p>{theme.caption}</p>
        </button>
      ))}
    </div>
  );
}
