"use client";
import { useEffect } from "react";
import { useEditor } from "@/store/editor";
import { parseDocument } from "@/lib/pixel/validation";
export const STORAGE_KEY = "ryu-deco:project:v1";

export function useAutoSave() {
  useEffect(() => {
    let writable = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved)
        useEditor.setState({ document: parseDocument(JSON.parse(saved)) });
    } catch {
      // A corrupt document never prevents editing. A fresh copy can be saved.
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        writable = false;
      }
    }
    useEditor.setState({
      hydrated: true,
      saveStatus: writable ? "saving" : "error",
    });
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let dirty = true;
    const save = () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(useEditor.getState().document),
        );
        dirty = false;
        useEditor.setState({ saveStatus: "saved" });
      } catch {
        useEditor.setState({ saveStatus: "error" });
      }
    };
    timeout = setTimeout(save, 250);
    const unsubscribe = useEditor.subscribe((state, previous) => {
      if (state.document === previous.document) return;
      dirty = true;
      clearTimeout(timeout);
      useEditor.setState({ saveStatus: "saving" });
      timeout = setTimeout(save, 300);
    });
    const flush = () => {
      clearTimeout(timeout);
      if (dirty) save();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(timeout);
      unsubscribe();
      window.removeEventListener("pagehide", flush);
    };
  }, []);
}
