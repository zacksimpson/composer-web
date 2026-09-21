import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { DetailMode } from "./appNav";
import type { Folder, Note } from "./lib/models";
import { isTypingTarget } from "./lib/keyboardUtils";
import { getDisplayTitle, stripMarkdown } from "./lib/noteText";
import { deleteNote, moveNotes, updateNote } from "./lib/store";
import { BackButton } from "./BackButton";
import { MenuIcon } from "./icons";
import { NoteEditor } from "./NoteEditor";
import { ScrollPane } from "./ScrollPane";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 26,
  },
  // title button and rename input share a box so swapping doesn't shift
  titleBox: {
    flex: 1,
    minWidth: 0,
    fontSize: 32,
    fontWeight: 400,
    textAlign: "left" as const,
    paddingBottom: 6,
    borderBottom: "2px solid transparent",
  },
  titleButton: {
    display: "block",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  titleInput: { borderBottomColor: "#fff", width: "100%" },
  // centers the icon on the title line
  menuButton: { display: "flex", flexShrink: 0, marginTop: 8 },
  title: { fontSize: 32, marginBottom: 26, fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  row: { width: "100%", textAlign: "left" as const, padding: "13px 0", fontSize: 23 },
  option: { width: "100%", textAlign: "left" as const, fontSize: 23, padding: "10px 0" },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
  },
  empty: { fontSize: 16, lineHeight: 1.6 },
  toastPane: { height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  toastText: { fontSize: 44 },
};

type View = "editor" | "menu" | "move" | "confirm-delete";

export function NoteDetailPane({
  uid,
  folders,
  detail,
  note,
  onClose,
  onBack,
}: {
  uid: string;
  folders: Folder[];
  detail: DetailMode;
  note: Note | null;
  onClose: () => void;
  onBack?: () => void;
}) {
  // here because deleting the note unmounts the note view and its toast
  const [showDeletedToast, setShowDeletedToast] = useState(false);

  useEffect(() => {
    if (!showDeletedToast) return;
    const t = setTimeout(() => {
      setShowDeletedToast(false);
      onClose();
    }, 1000);
    return () => clearTimeout(t);
  }, [showDeletedToast, onClose]);

  if (showDeletedToast) {
    return (
      <div style={styles.toastPane}>
        <div style={styles.toastText}>deleted</div>
      </div>
    );
  }

  if (detail.kind !== "edit" || !note) {
    return <div style={styles.pane} />;
  }

  return (
    <NoteView
      key={note.id}
      uid={uid}
      folders={folders}
      note={note}
      autoFocus={detail.autoFocus}
      onConfirmDelete={async () => {
        await deleteNote(uid, note.id);
        setShowDeletedToast(true);
      }}
      onBack={onBack}
    />
  );
}

function NoteView({
  uid,
  folders,
  note,
  autoFocus,
  onConfirmDelete,
  onBack,
}: {
  uid: string;
  folders: Folder[];
  note: Note;
  autoFocus: boolean;
  onConfirmDelete: () => void;
  onBack?: () => void;
}) {
  const [view, setView] = useState<View>("editor");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const displayTitle = getDisplayTitle(note.title, note.body);
  const cancelRenameRef = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setToast(null);
      setView("editor");
    }, 1000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (view !== "editor" || toast) return;
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setView("confirm-delete");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, toast]);

  function startRename() {
    cancelRenameRef.current = false;
    setRenameValue(note.title === null && displayTitle === "Untitled" ? "" : displayTitle);
    setRenaming(true);
    setView("editor");
  }

  function commitRename() {
    setRenaming(false);
    if (cancelRenameRef.current) return;
    const trimmed = renameValue.trim();
    if (trimmed === displayTitle) return;
    // an empty title goes back to following the first line
    const next = trimmed || null;
    if (next === note.title) return;
    updateNote(uid, note.id, { title: next });
  }

  function handleRenameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      cancelRenameRef.current = true;
      setRenaming(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("copied");
    } catch {
      setToast("couldn't copy");
    }
  }

  async function moveTo(folderId: string | null) {
    await moveNotes(uid, [note.id], folderId);
    setToast("moved");
  }

  if (toast) {
    return (
      <div style={styles.toastPane}>
        <div style={styles.toastText}>{toast}</div>
      </div>
    );
  }

  const backToEditor = (
    <div style={styles.backRow}>
      <BackButton onBack={() => setView("editor")} />
    </div>
  );

  if (view === "menu") {
    return (
      <ScrollPane style={styles.pane}>
        {backToEditor}
        <div style={styles.title}>{displayTitle}</div>
        <button type="button" style={styles.row} onClick={startRename}>
          Rename
        </button>
        <button type="button" style={styles.row} onClick={() => copy(note.body)}>
          Copy Markdown
        </button>
        <button type="button" style={styles.row} onClick={() => copy(stripMarkdown(note.body))}>
          Copy Plain Text
        </button>
        {note.folderId ? (
          <button type="button" style={styles.row} onClick={() => moveTo(null)}>
            Remove from Folder
          </button>
        ) : (
          <button type="button" style={styles.row} onClick={() => setView("move")}>
            Move to Folder
          </button>
        )}
        <button type="button" style={styles.row} onClick={() => setView("confirm-delete")}>
          Delete
        </button>
      </ScrollPane>
    );
  }

  if (view === "move") {
    return (
      <ScrollPane style={styles.pane}>
        <div style={styles.backRow}>
          <BackButton onBack={() => setView("menu")} />
        </div>
        <div style={styles.title}>Move to Folder</div>
        {folders.length === 0 && <div style={styles.empty}>No folders yet</div>}
        {folders.map((f) => (
          <button key={f.id} type="button" style={styles.option} onClick={() => moveTo(f.id)}>
            {f.name}
          </button>
        ))}
      </ScrollPane>
    );
  }

  if (view === "confirm-delete") {
    return (
      <ScrollPane style={styles.pane}>
        <div style={styles.backRow}>
          <BackButton onBack={() => setView("editor")} />
        </div>
        <div style={styles.title}>Delete Note</div>
        <div style={styles.body}>Are you sure you want to delete "{displayTitle}"?</div>
        <button type="button" style={styles.action} onClick={onConfirmDelete}>
          DELETE
        </button>
      </ScrollPane>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      {onBack && (
        <div style={styles.backRow}>
          <BackButton onBack={onBack} />
        </div>
      )}
      <div style={styles.headerRow}>
        {renaming ? (
          <input
            autoFocus
            style={{ ...styles.titleBox, ...styles.titleInput }}
            value={renameValue}
            placeholder="Untitled"
            onFocus={(e) => e.target.select()}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
          />
        ) : (
          <button
            type="button"
            style={{ ...styles.titleBox, ...styles.titleButton }}
            onClick={startRename}
          >
            {displayTitle}
          </button>
        )}
        <button
          type="button"
          style={styles.menuButton}
          aria-label="Note options"
          onClick={() => setView("menu")}
        >
          <MenuIcon />
        </button>
      </div>
      <NoteEditor
        body={note.body}
        autoFocus={autoFocus}
        onSave={(body) => updateNote(uid, note.id, { body })}
      />
    </ScrollPane>
  );
}
