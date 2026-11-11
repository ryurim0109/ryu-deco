"use client";
import {
  UserRound,
  Cat,
  MountainSnow,
  Shapes,
  Sparkles,
  Plus,
} from "lucide-react";
import { useEditor } from "@/store/editor";
import { ProfilePanel } from "./profile-panel";
import { SpritePreview } from "./sprite-preview";
import { EffectsPanel } from "./effects-panel";
import { ThemePicker } from "@/components/preview/theme-picker";
import { AssetLibrary } from "@/components/drawing/asset-library";
import { SPRITE_LABELS, type PanelId, type SpriteId } from "@/types/editor";

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "character", label: "Character", icon: Cat },
  { id: "background", label: "Background", icon: MountainSnow },
  { id: "decorations", label: "Decorations", icon: Shapes },
  { id: "effects", label: "Effects", icon: Sparkles },
] as const;
export function EditorPanel({
  onDraw,
}: {
  onDraw: (assetId?: string) => void;
}) {
  const {
    panel,
    setPanel,
    document: doc,
    commit,
    addObject,
    select,
  } = useEditor();
  return (
    <aside className="editor-panel" aria-label="Editor panel">
      <div className="panel-eyebrow">THE CREATIVE CORNER</div>
      <nav className="editor-nav" aria-label="Editor sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPanel(id as PanelId)}
            className={`nav-tab ${panel === id ? "active" : ""}`}
            aria-current={panel === id ? "page" : undefined}
          >
            <Icon size={17} strokeWidth={1.7} />
            <span>{label}</span>
            {panel === id && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>
      <div className="panel-separator" />
      {panel === "profile" && <ProfilePanel />}
      {panel === "character" && (
        <div className="panel-content">
          <div className="section-intro">
            <h2>Meet your pixel self</h2>
            <p>A tiny companion for your big ideas.</p>
          </div>
          <div className="character-grid">
            {(["cat", "rabbit", "fox"] as const).map((sprite) => (
              <button
                className={`character-option ${doc.objects.find((o) => o.id === "character")?.sprite === sprite ? "selected" : ""}`}
                key={sprite}
                onClick={() => {
                  commit((d) => {
                    const character = d.objects.find(
                      (o) => o.id === "character",
                    );
                    if (character) character.sprite = sprite;
                    else
                      d.objects.push({
                        id: "character",
                        sprite,
                        x: 570,
                        y: 202,
                        scale: 1.5,
                      });
                  });
                  select("character");
                }}
              >
                <SpritePreview sprite={sprite} accent={doc.accent} />
                <span>{SPRITE_LABELS[sprite]}</span>
              </button>
            ))}
          </div>
          <AssetLibrary onDraw={onDraw} />
          <div className="little-note">
            <Sparkles size={16} />
            <p>
              Select your companion in the world to adjust its position, size,
              and scarf color.
            </p>
          </div>
        </div>
      )}
      {panel === "background" && (
        <div className="panel-content">
          <div className="section-intro">
            <h2>Choose a background</h2>
            <p>Each theme has its own landscape and objects.</p>
          </div>
          <ThemePicker />
        </div>
      )}
      {panel === "decorations" && (
        <div className="panel-content">
          <div className="section-intro">
            <h2>The little things</h2>
            <p>Click to add a bit of personality.</p>
          </div>
          <div className="decoration-grid">
            {(
              [
                "tree",
                "snowman",
                "cat",
                "rabbit",
                "house",
                "moon",
                "stars",
                "flowers",
              ] as SpriteId[]
            ).map((sprite) => (
              <button
                key={sprite}
                className="decoration-option"
                disabled={doc.objects.length >= 24}
                onClick={() => addObject(sprite)}
              >
                <SpritePreview sprite={sprite} accent={doc.accent} size={58} />
                <span>{SPRITE_LABELS[sprite]}</span>
                <Plus size={12} className="decoration-plus" />
              </button>
            ))}
          </div>
          <p className="muted-note">
            Drag decorations in your world to move them. Up to 24 little things
            can live here. ({doc.objects.length}/24)
          </p>
        </div>
      )}
      {panel === "effects" && <EffectsPanel />}
      <div className="sidebar-footer">
        <span className="pixel-flower">✳</span>
        <span>Made for your kind of developer.</span>
      </div>
    </aside>
  );
}
