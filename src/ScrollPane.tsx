import {
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// thin track and draggable thumb in place of the native scrollbar
const MIN_THUMB = 24;
const TRACK_RIGHT = 18;

type Thumb = { height: number; top: number };

function computeThumb(el: HTMLDivElement): Thumb | null {
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight + 1) {
    return null;
  }
  const height = Math.max((clientHeight * clientHeight) / scrollHeight, MIN_THUMB);
  const maxTop = clientHeight - height;
  const top = maxTop * (scrollTop / (scrollHeight - clientHeight));
  return { height, top };
}

export function ScrollPane({
  style,
  outerStyle,
  dropZoneProps,
  children,
}: {
  style?: CSSProperties;
  outerStyle?: CSSProperties;
  dropZoneProps?: {
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const dragRef = useRef<{ startY: number; startScrollTop: number; maxTop: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const next = computeThumb(el);
    setThumb((prev) =>
      prev?.height === next?.height && prev?.top === next?.top ? prev : next
    );
  });

  // resize the thumb when content grows without a re-render
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const next = computeThumb(el);
      setThumb((prev) =>
        prev?.height === next?.height && prev?.top === next?.top ? prev : next
      );
    });
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    return () => observer.disconnect();
  });

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const next = computeThumb(el);
    setThumb((prev) =>
      prev?.height === next?.height && prev?.top === next?.top ? prev : next
    );
  }

  function onThumbPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !thumb) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startScrollTop: el.scrollTop,
      maxTop: el.clientHeight - thumb.height,
    };
  }

  function onThumbPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current;
    const drag = dragRef.current;
    if (!el || !drag || drag.maxTop <= 0) return;
    const scrollRange = el.scrollHeight - el.clientHeight;
    const deltaY = e.clientY - drag.startY;
    const deltaScroll = (deltaY / drag.maxTop) * scrollRange;
    el.scrollTop = drag.startScrollTop + deltaScroll;
  }

  function onThumbPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 0, ...outerStyle }}>
      <div
        ref={ref}
        className="scroll-hide"
        style={{ ...style, height: "100%", overflowY: "auto" }}
        onScroll={onScroll}
        {...dropZoneProps}
      >
        {children}
      </div>
      {thumb && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: TRACK_RIGHT,
            width: 1,
            background: "#fff",
            pointerEvents: "none",
          }}
        >
          <div
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={onThumbPointerUp}
            style={{
              position: "absolute",
              top: thumb.top,
              right: -6,
              width: 13,
              height: thumb.height,
              padding: "0 4px",
              background: "#fff",
              backgroundClip: "content-box",
              pointerEvents: "auto",
              cursor: "default",
              touchAction: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
