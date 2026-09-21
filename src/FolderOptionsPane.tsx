import { type KeyboardEvent, useState } from "react";
import type { Folder } from "./lib/models";
import { deleteFolder, renameFolder } from "./lib/store";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: { fontSize: 32, marginBottom: 26, fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  row: { width: "100%", textAlign: "left" as const, padding: "13px 0", fontSize: 23 },
  input: {
    fontSize: 32,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 10,
    marginBottom: 26,
  },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
  },
};

type View = "menu" | "rename" | "confirm-delete";

export function FolderOptionsPane({
  uid,
  folder,
  onBack,
  onDeleted,
}: {
  uid: string;
  folder: Folder;
  onBack?: () => void;
  onDeleted: () => void;
}) {
  const [view, setView] = useState<View>("menu");
  const [renameValue, setRenameValue] = useState(folder.name);
  const [busy, setBusy] = useState(false);

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      renameFolder(uid, folder.id, trimmed);
    }
    setView("menu");
  }

  function handleRenameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setRenameValue(folder.name);
      setView("menu");
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    await deleteFolder(uid, folder.id);
    setBusy(false);
    onDeleted();
  }

  if (view === "rename") {
    return (
      <ScrollPane style={styles.pane}>
        <div style={styles.backRow}>
          <BackButton onBack={() => setView("menu")} />
        </div>
        <input
          autoFocus
          style={styles.input}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleRenameKeyDown}
        />
      </ScrollPane>
    );
  }

  if (view === "confirm-delete") {
    return (
      <ScrollPane style={styles.pane}>
        <div style={styles.backRow}>
          <BackButton onBack={() => setView("menu")} />
        </div>
        <div style={styles.title}>Delete Folder</div>
        <div style={styles.body}>
          Are you sure you want to delete "{folder.name}"? Its notes will be kept and moved out of
          the folder.
        </div>
        <button type="button" style={styles.action} disabled={busy} onClick={handleDelete}>
          {busy ? "DELETING…" : "DELETE"}
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
      <div style={styles.title}>{folder.name}</div>

      <button
        type="button"
        style={styles.row}
        onClick={() => {
          setRenameValue(folder.name);
          setView("rename");
        }}
      >
        Rename
      </button>
      <button type="button" style={styles.row} onClick={() => setView("confirm-delete")}>
        Delete
      </button>
    </ScrollPane>
  );
}
