"use client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEditor } from "@/store/editor";
import { MAX_CUSTOM_ASSETS } from "@/types/editor";
import { hasAssetPixels } from "@/lib/pixel/assets";
import { AssetPreview } from "./asset-preview";

export function AssetLibrary({
  onDraw,
}: {
  onDraw: (assetId?: string) => void;
}) {
  const { document: doc, placeAsset, removeAsset } = useEditor();
  return (
    <section className="asset-library" aria-label="Your drawings">
      <div className="section-intro">
        <h2>Your drawings</h2>
        <p>Draw a character, then place it in your world.</p>
      </div>
      <button
        className="secondary-button new-drawing-button"
        disabled={doc.assets.length >= MAX_CUSTOM_ASSETS}
        onClick={() => onDraw()}
      >
        <Pencil size={14} /> Draw a character
      </button>
      <div className="asset-library-list">
        {doc.assets.map((asset) => (
          <article className="asset-library-card" key={asset.id}>
            <button
              className="asset-edit-preview checkerboard"
              onClick={() => onDraw(asset.id)}
              aria-label={`Edit ${asset.name}`}
            >
              <AssetPreview asset={asset} size={60} />
            </button>
            <div className="asset-card-details">
              <strong>{asset.name}</strong>
              <span>
                {asset.size} × {asset.size} · {asset.frames.length}{" "}
                {asset.frames.length === 1 ? "frame" : "frames"}
              </span>
              <div className="asset-card-actions">
                <button
                  className="text-button"
                  disabled={!hasAssetPixels(asset) || doc.objects.length >= 24}
                  onClick={() => placeAsset(asset.id)}
                  aria-label={`Place ${asset.name}`}
                >
                  <Plus size={12} /> Place
                </button>
                <button
                  className="text-button"
                  onClick={() => removeAsset(asset.id)}
                  aria-label={`Delete drawing ${asset.name}`}
                  title="Delete this drawing and all its placed copies. You can undo this."
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="micro-copy">
        {doc.assets.length}/{MAX_CUSTOM_ASSETS} drawings · Saved in this browser
      </p>
    </section>
  );
}
