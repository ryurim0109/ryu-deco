"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from "lucide-react";
import { useEditor } from "@/store/editor";
import { DEVELOPER_TYPES } from "@/types/editor";

export function ProfilePanel() {
  const { document: doc, commit } = useEditor();
  const [tech, setTech] = useState("");
  const [message, setMessage] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  function addTech() {
    const value = tech.trim();
    if (!value) return;
    if (doc.profile.techStack.length >= 10) {
      setMessage("A tiny world fits up to 10 technologies.");
      return;
    }
    if (
      doc.profile.techStack.some((t) => t.toLowerCase() === value.toLowerCase())
    ) {
      setMessage("That technology is already in your stack.");
      return;
    }
    commit((d) => {
      d.profile.techStack.push(value);
    });
    setTech("");
    setMessage("");
  }
  function moveTech(from: number, to: number) {
    if (to < 0 || to >= doc.profile.techStack.length || from === to) return;
    commit((d) => {
      const [item] = d.profile.techStack.splice(from, 1);
      d.profile.techStack.splice(to, 0, item);
    });
  }
  return (
    <div className="panel-content profile-panel">
      <div className="section-intro">
        <h2>A little about you</h2>
        <p>Big personality. Tiny pixels.</p>
      </div>
      <label className="field-label" htmlFor="profile-name">
        Your name <span>or your internet alter ego</span>
      </label>
      <input
        id="profile-name"
        maxLength={30}
        value={doc.profile.name}
        onChange={(e) =>
          commit((d) => {
            d.profile.name = e.target.value;
          })
        }
        placeholder="YOUR NAME"
        autoComplete="off"
      />
      <label className="field-label" htmlFor="developer-type">
        Developer type
      </label>
      <div className="select-wrap">
        <select
          id="developer-type"
          value={doc.profile.developerType}
          onChange={(e) =>
            commit((d) => {
              d.profile.developerType = e.target
                .value as typeof d.profile.developerType;
            })
          }
        >
          {DEVELOPER_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </div>
      <label className="field-label" htmlFor="custom-title">
        Your little introduction
      </label>
      <textarea
        id="custom-title"
        maxLength={120}
        rows={4}
        value={doc.profile.title}
        onChange={(e) =>
          commit((d) => {
            d.profile.title = e.target.value;
          })
        }
        placeholder="I'm a developer who loves tiny worlds."
      />
      <div className="field-note">
        <span>Make it sound like you.</span>
        <span>{doc.profile.title.length}/120</span>
      </div>
      <div className="stack-label">
        <label className="field-label" htmlFor="new-tech">
          Tech stack
        </label>
        <span>{doc.profile.techStack.length}/10</span>
      </div>
      <p className="micro-copy">Drag to reorder, or use the arrows.</p>
      <div className="tech-list">
        {doc.profile.techStack.map((item, index) => (
          <div
            key={item}
            className={`tech-item ${dragged === index ? "is-dragged" : ""}`}
            draggable
            onDragStart={(e) => {
              setDragged(index);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(index));
            }}
            onDragEnd={() => setDragged(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragged !== null) moveTech(dragged, index);
              setDragged(null);
            }}
          >
            <GripVertical size={13} className="grip" />
            <span className={`tech-dot tech-dot-${index % 4}`} />
            <span className="tech-name">{item}</span>
            <div className="tech-actions">
              <button
                className="icon-button tiny"
                aria-label={`Move ${item} up`}
                disabled={index === 0}
                onClick={() => moveTech(index, index - 1)}
              >
                <ArrowUp size={12} />
              </button>
              <button
                className="icon-button tiny"
                aria-label={`Move ${item} down`}
                disabled={index === doc.profile.techStack.length - 1}
                onClick={() => moveTech(index, index + 1)}
              >
                <ArrowDown size={12} />
              </button>
              <button
                className="icon-button tiny"
                aria-label={`Remove ${item}`}
                onClick={() =>
                  commit((d) => {
                    d.profile.techStack.splice(index, 1);
                  })
                }
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <form
        className="add-tech"
        onSubmit={(e) => {
          e.preventDefault();
          addTech();
        }}
      >
        <input
          id="new-tech"
          value={tech}
          maxLength={20}
          onChange={(e) => {
            setTech(e.target.value);
            setMessage("");
          }}
          placeholder="Add a technology…"
        />
        <button
          className="icon-button add-button"
          type="submit"
          aria-label="Add technology"
        >
          <Plus size={17} />
        </button>
      </form>
      <p className="inline-message" role="status">
        {message}
      </p>
    </div>
  );
}
