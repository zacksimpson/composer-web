import { useEffect } from "react";
import type { Folder, Note, NoteSortOrder } from "./lib/models";
import { isTypingTarget } from "./lib/keyboardUtils";
import { formatDate, getDisplayTitle } from "./lib/noteText";
import { BackButton } from "./BackButton";
import { PlusIcon } from "./icons";
import { ScrollPane } from "./ScrollPane";
import { NOTE_DRAG_TYPE } from "./SidebarPane";

const styles = {
  pane: { padding: "30px 52px 30px 24px" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  headerTitle: { fontSize: 32, fontWeight: 400, textAlign: "left" as const },
  addButton: { display: "flex" },
  // mobile header is centered with back and add in the corners
  headerMobile: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  headerMobileTitle: { textAlign: "center" as const, fontSize: "inherit" },
  backButtonMobile: { position: "absolute" as const, left: 0, top: 3 },
  addButtonMobile: { position: "absolute" as const, right: 0, top: 3 },
  row: {
    display: "block",
    padding: "11px 0",
    width: "100%",
    textAlign: "left" as const,
  },
  title: {
    fontSize: 21,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  meta: { fontSize: 15, marginTop: 2 },
  empty: { fontSize: 19, marginTop: 40, textAlign: "left" as const },
  emptyMobile: { fontSize: 19, marginTop: 40, textAlign: "center" as const },
};

function sortNotes(notes: Note[], sortOrder: NoteSortOrder): Note[] {
  const key = sortOrder === "created" ? "createdAt" : "updatedAt";
  return [...notes].sort((a, b) => b[key] - a[key]);
}

export function NoteListPane({
  title,
  folder,
  folders,
  notes,
  sortOrder,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  onOpenFolderOptions,
  onBack,
}: {
  title: string;
  // set when showing one folder, whose title opens its options
  folder: Folder | null;
  folders: Folder[];
  notes: Note[];
  sortOrder: NoteSortOrder;
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onOpenFolderOptions?: () => void;
  onBack?: () => void;
}) {
  const sorted = sortNotes(notes, sortOrder);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewNote();
        return;
      }
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      if (sorted.length === 0) return;
      e.preventDefault();
      const currentIndex = sorted.findIndex((n) => n.id === selectedNoteId);
      const nextIndex =
        currentIndex === -1
          ? 0
          : e.key === "ArrowDown"
            ? Math.min(currentIndex + 1, sorted.length - 1)
            : Math.max(currentIndex - 1, 0);
      onSelectNote(sorted[nextIndex].id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sorted, selectedNoteId, onSelectNote, onNewNote]);

  // only a folder title is a button
  const titleStyle = folder ? {} : { cursor: "default" };
  const onTitleClick = folder ? onOpenFolderOptions : undefined;

  return (
    <ScrollPane style={styles.pane}>
      {onBack ? (
        <div style={styles.headerMobile}>
          <BackButton onBack={onBack} style={styles.backButtonMobile} />
          <button type="button" style={{ ...styles.headerMobileTitle, ...titleStyle }} onClick={onTitleClick}>
            {title}
          </button>
          <button type="button" style={styles.addButtonMobile} aria-label="New note" onClick={onNewNote}>
            <PlusIcon size={22} />
          </button>
        </div>
      ) : (
        <div style={styles.headerRow}>
          <button type="button" style={{ ...styles.headerTitle, ...titleStyle }} onClick={onTitleClick}>
            {title}
          </button>
          <button type="button" style={styles.addButton} aria-label="New note" onClick={onNewNote}>
            <PlusIcon size={22} />
          </button>
        </div>
      )}

      {sorted.length === 0 && <div style={onBack ? styles.emptyMobile : styles.empty}>No notes</div>}

      {sorted.map((note) => {
        const selected = note.id === selectedNoteId;
        const folderName = folder ? null : folders.find((f) => f.id === note.folderId)?.name;
        const meta = [folderName, formatDate(sortOrder === "created" ? note.createdAt : note.updatedAt)]
          .filter(Boolean)
          .join(" · ");
        return (
          <button
            key={note.id}
            type="button"
            style={styles.row}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(NOTE_DRAG_TYPE, note.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onSelectNote(note.id)}
          >
            <div
              style={{
                ...styles.title,
                textDecoration: selected ? "underline" : "none",
                textUnderlineOffset: 3,
              }}
            >
              {getDisplayTitle(note.title, note.body)}
            </div>
            <div style={styles.meta}>{meta}</div>
          </button>
        );
      })}
    </ScrollPane>
  );
}
