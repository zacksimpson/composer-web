import { type CSSProperties, type DragEvent, useState } from "react";

export interface DragRowProps {
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
  style: CSSProperties;
}

export interface DragContainerProps {
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

/** native drag and drop reordering for a flat list */
export function useDragReorder<T>(
  items: T[],
  getId: (item: T) => string,
  onReorder: (reordered: T[]) => void
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function moveToIndex(toIndex: number) {
    const fromIndex = items.findIndex((item) => getId(item) === draggingId);
    if (fromIndex === -1) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
    setDraggingId(null);
    setOverId(null);
  }

  function getRowProps(id: string): DragRowProps {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
      },
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (id !== draggingId) {
          setOverId(id);
        }
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOverId(null);
        if (!draggingId || draggingId === id) {
          return;
        }
        const toIndex = items.findIndex((item) => getId(item) === id);
        if (toIndex === -1) {
          return;
        }
        moveToIndex(toIndex);
      },
      onDragEnd: () => {
        setDraggingId(null);
        setOverId(null);
      },
      style: {
        opacity: draggingId === id ? 0.4 : 1,
        boxShadow: overId === id && draggingId !== id ? "0 -2px 0 0 #fff" : "none",
      },
    };
  }

  function getContainerProps(): DragContainerProps {
    return {
      onDragOver: (e: DragEvent) => {
        if (!draggingId) {
          return;
        }
        e.preventDefault();
      },
      onDrop: (e: DragEvent) => {
        if (!draggingId) {
          return;
        }
        e.preventDefault();
        moveToIndex(items.length);
      },
    };
  }

  return { getRowProps, getContainerProps };
}
