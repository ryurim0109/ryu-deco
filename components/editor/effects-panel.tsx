"use client";
import { useEditor } from "@/store/editor";
import type { EditorDocument } from "@/types/editor";

const effects: {
  id: keyof EditorDocument["effects"];
  name: string;
  description: string;
}[] = [
  {
    id: "snow",
    name: "Falling Snow",
    description: "Slow snowfall across your world.",
  },
  {
    id: "stars",
    name: "Twinkling Stars",
    description: "Stars fade in and out of the sky.",
  },
  {
    id: "floating",
    name: "Floating",
    description: "Characters gently bob up and down.",
  },
  {
    id: "walking",
    name: "Walking",
    description: "Characters wander from side to side.",
  },
];

export function EffectsPanel() {
  const { document: doc, commit } = useEditor();
  return (
    <div className="panel-content">
      <div className="section-intro">
        <h2>Bring your world to life</h2>
        <p>Combine effects and preview a repeating four-second loop.</p>
      </div>
      <div className="effects-list">
        {effects.map(({ id, name, description }) => (
          <label key={id} className="effect-option">
            <span>
              <strong>{name}</strong>
              <span>{description}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              aria-label={name}
              checked={doc.effects[id]}
              onChange={(e) =>
                commit((d) => {
                  d.effects[id] = e.target.checked;
                })
              }
            />
          </label>
        ))}
      </div>
      <p className="muted-note">
        Choose GIF in the export panel to save these effects. PNG captures the
        frame shown in the preview.
      </p>
    </div>
  );
}
