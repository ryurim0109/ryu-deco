"use client";
import { useEffect, useRef } from "react";
import { drawSprite } from "@/lib/pixel/renderer";
import type { SpriteId } from "@/types/editor";
export function SpritePreview({
  sprite,
  accent = "#d7778e",
  size = 64,
}: {
  sprite: SpriteId;
  accent?: string;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 80, 80);
      drawSprite(ctx, sprite, 40, 72, 1, accent);
    }
  }, [sprite, accent]);
  return (
    <canvas
      ref={ref}
      width={80}
      height={80}
      style={{ width: size, height: size }}
      aria-hidden="true"
      className="sprite-preview"
    />
  );
}
