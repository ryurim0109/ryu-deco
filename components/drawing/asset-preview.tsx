"use client";
import { useEffect, useRef } from "react";
import type { PixelAsset } from "@/types/editor";
import { drawAssetPixels } from "@/lib/pixel/assets";
import { assetFrameIndex } from "@/lib/animation/timeline";

export function AssetPreview({
  asset,
  size = 64,
  frameIndex,
  animate = false,
}: {
  asset: PixelAsset;
  size?: number;
  frameIndex?: number;
  animate?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let frameId = 0;
    let previous = performance.now();
    function draw(now: number) {
      if (animate) timeRef.current += (now - previous) / 1000;
      previous = now;
      ctx!.clearRect(0, 0, asset.size, asset.size);
      drawAssetPixels(
        ctx!,
        asset,
        frameIndex ?? assetFrameIndex(asset, timeRef.current),
        0,
        0,
        1,
      );
      if (animate && asset.frames.length > 1 && frameIndex === undefined)
        frameId = requestAnimationFrame(draw);
    }
    draw(previous);
    return () => cancelAnimationFrame(frameId);
  }, [asset, frameIndex, animate]);
  return (
    <canvas
      ref={ref}
      width={asset.size}
      height={asset.size}
      className="asset-preview"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
