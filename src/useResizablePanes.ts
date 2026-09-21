import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "composer-web:paneWidths";

// below these the nav labels wrap and the nav icons shrink
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 320;
const LIST_MIN = 220;
const LIST_MAX = 480;
const DEFAULTS = { sidebar: 320, list: 480 };

type Divider = "sidebar" | "list";

function loadWidths() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "");
    const sidebar = typeof parsed.sidebar === "number" ? parsed.sidebar : DEFAULTS.sidebar;
    const list = typeof parsed.list === "number" ? parsed.list : DEFAULTS.list;
    return {
      // clamped again on load so a stale saved width can't stick
      sidebar: Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, sidebar)),
      list: Math.min(LIST_MAX, Math.max(LIST_MIN, list)),
    };
  } catch {
    return DEFAULTS;
  }
}

export function useResizablePanes() {
  const [widths, setWidths] = useState(loadWidths);
  const dragRef = useRef<{ divider: Divider; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = e.clientX - drag.startX;
      if (drag.divider === "sidebar") {
        const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, drag.startWidth + delta));
        setWidths((w) => ({ ...w, sidebar: next }));
      } else {
        const next = Math.min(LIST_MAX, Math.max(LIST_MIN, drag.startWidth + delta));
        setWidths((w) => ({ ...w, list: next }));
      }
    }
    function onUp() {
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag(divider: Divider) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { divider, startX: e.clientX, startWidth: widths[divider] };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    };
  }

  return { widths, startDrag };
}
