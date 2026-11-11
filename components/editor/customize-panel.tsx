"use client";
import type { RefObject } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  MousePointer2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import { objectLabel, objectPositionLimits } from "@/lib/pixel/assets";
import { AssetPreview } from "@/components/drawing/asset-preview";
import { SpritePreview } from "./sprite-preview";
import { ExportPanel } from "@/components/export/export-panel";

const colors = [
  "#d7778e",
  "#9c91bd",
  "#8ba695",
  "#c89a71",
  "#7f9fbc",
  "#b67a76",
];
export function CustomizePanel({
  canvasRef,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const {
    document: doc,
    selectedId,
    updateObject,
    removeSelected,
    reorder,
    commit,
    select,
  } = useEditor();
  const selected = doc.objects.find((o) => o.id === selectedId);
  const asset = doc.assets.find((item) => item.id === selected?.assetId);
  const limits = selected ? objectPositionLimits(selected, doc.assets) : null;
  const index = doc.objects.findIndex((o) => o.id === selectedId);
  return (
    <aside className="customize-panel" aria-label="Customize and export">
      <div className="customize-title">
        <SlidersHorizontal size={16} />
        <h2>Make it yours</h2>
      </div>
      <div className="inspector">
        {selected ? (
          <>
            <div className="selected-object">
              <div className="selected-sprite">
                {asset ? (
                  <AssetPreview asset={asset} size={54} />
                ) : (
                  <SpritePreview
                    sprite={selected.sprite}
                    accent={doc.accent}
                    size={54}
                  />
                )}
              </div>
              <div>
                <span className="small-label">SELECTED ELEMENT</span>
                <h3>{objectLabel(selected, doc.assets)}</h3>
                <span className="selected-hint">
                  A tiny touch of personality
                </span>
              </div>
            </div>
            <div className="position-fields">
              <label className="field-label" htmlFor="position-x">
                Position X
                <input
                  id="position-x"
                  type="number"
                  min={limits!.minX}
                  max={limits!.maxX}
                  value={selected.x}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber;
                    if (Number.isFinite(v))
                      updateObject(selected.id, {
                        x: v,
                      });
                  }}
                />
              </label>
              <label className="field-label" htmlFor="position-y">
                Position Y
                <input
                  id="position-y"
                  type="number"
                  min={limits!.minY}
                  max={limits!.maxY}
                  value={selected.y}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber;
                    if (Number.isFinite(v))
                      updateObject(selected.id, {
                        y: v,
                      });
                  }}
                />
              </label>
            </div>
            <div className="slider-label">
              <label className="field-label" htmlFor="object-scale">
                Size
              </label>
              <span>{selected.scale.toFixed(2).replace(/0$/, "")}×</span>
            </div>
            <input
              id="object-scale"
              type="range"
              min={0.75}
              max={2}
              step={0.25}
              value={selected.scale}
              onChange={(e) =>
                updateObject(selected.id, { scale: Number(e.target.value) })
              }
            />
            <div className="layer-buttons">
              <button
                className="secondary-button"
                disabled={index === 0}
                onClick={() => reorder(-1)}
                title="Move back one layer"
              >
                <ArrowDownToLine size={13} /> Back
              </button>
              <button
                className="secondary-button"
                disabled={index === doc.objects.length - 1}
                onClick={() => reorder(1)}
                title="Move forward one layer"
              >
                <ArrowUpToLine size={13} /> Front
              </button>
              <button
                className="icon-button delete-button"
                aria-label="Delete selected element"
                title="Delete element (Delete)"
                onClick={removeSelected}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-selection">
            <MousePointer2 size={22} />
            <h3>Pick a little thing</h3>
            <p>
              Select a character or decoration in your world to customize it.
            </p>
            <div className="object-list">
              {doc.objects.map((object) => (
                <button
                  className="text-button"
                  key={object.id}
                  onClick={() => select(object.id)}
                >
                  {objectLabel(object, doc.assets)}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="field-label" htmlFor="accent-color">
          A pop of color <span>scarves & little details</span>
        </label>
        <div className="color-swatches">
          {colors.map((color) => (
            <button
              key={color}
              className={`color-swatch ${doc.accent === color ? "selected" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() =>
                commit((d) => {
                  d.accent = color;
                })
              }
              aria-label={`Set accent to ${color}`}
              aria-pressed={doc.accent === color}
            />
          ))}
          <label className="custom-color" title="Choose a custom accent">
            <span>+</span>
            <input
              id="accent-color"
              type="color"
              value={doc.accent}
              onChange={(e) =>
                commit((d) => {
                  d.accent = e.target.value;
                })
              }
              aria-label="Custom accent color"
            />
          </label>
        </div>
      </div>
      <div className="right-panel-separator" />
      <ExportPanel canvasRef={canvasRef} />
      <div className="privacy-note">
        <span className="status-dot" /> Your world stays in this browser.
      </div>
    </aside>
  );
}
