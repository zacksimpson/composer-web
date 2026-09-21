import { type ChangeEvent, useRef, useState } from "react";
import type { Folder, NewNoteFormat, Note, NoteSortOrder, Settings } from "./lib/models";
import { buildBackup, importBackup, parseBackupFile, updateSettings } from "./lib/store";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import type { SettingKey } from "./SettingsPane";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: {
    fontSize: 32,
    marginBottom: 26,
    fontWeight: 400,
  },
  option: {
    width: "100%",
    textAlign: "left" as const,
    fontSize: 23,
    padding: "10px 0",
  },
  body: {
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: 30,
  },
  action: {
    display: "block",
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
    marginBottom: 30,
  },
  status: {
    fontSize: 16,
    marginTop: 24,
  },
};

const NEW_NOTE_FORMATS: { value: NewNoteFormat; label: string }[] = [
  { value: "body", label: "Body" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

const SORT_ORDERS: { value: NoteSortOrder; label: string }[] = [
  { value: "edited", label: "Date Edited" },
  { value: "created", label: "Date Created" },
];

export function SettingsDetailPane({
  uid,
  folders,
  notes,
  settings,
  activeSetting,
  onBack,
}: {
  uid: string;
  folders: Folder[];
  notes: Note[];
  settings: Settings;
  activeSetting: SettingKey | null;
  onBack?: () => void;
}) {
  if (activeSetting === null) {
    return <div style={styles.pane} />;
  }

  const backRow = onBack && (
    <div style={styles.backRow}>
      <BackButton onBack={onBack} />
    </div>
  );

  if (activeSetting === "new-note-format") {
    return (
      <ScrollPane style={styles.pane}>
        {backRow}
        <div style={styles.title}>New Note Format</div>
        {NEW_NOTE_FORMATS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            style={{
              ...styles.option,
              textDecoration: opt.value === settings.newNoteFormat ? "underline" : "none",
              textUnderlineOffset: 4,
            }}
            onClick={() => updateSettings(uid, { newNoteFormat: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </ScrollPane>
    );
  }

  if (activeSetting === "sort-order") {
    return (
      <ScrollPane style={styles.pane}>
        {backRow}
        <div style={styles.title}>Sort Notes By</div>
        {SORT_ORDERS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            style={{
              ...styles.option,
              textDecoration: opt.value === settings.sortOrder ? "underline" : "none",
              textUnderlineOffset: 4,
            }}
            onClick={() => updateSettings(uid, { sortOrder: opt.value })}
          >
            {opt.label}
          </button>
        ))}
      </ScrollPane>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      {backRow}
      <div style={styles.title}>Backup & Restore</div>
      <BackupSection uid={uid} folders={folders} notes={notes} />
    </ScrollPane>
  );
}

function BackupSection({
  uid,
  folders,
  notes,
}: {
  uid: string;
  folders: Folder[];
  notes: Note[];
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const blob = new Blob([buildBackup(folders, notes)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `composer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${notes.length} note${notes.length === 1 ? "" : "s"}.`);
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const data = parseBackupFile(await file.text());
      const result = await importBackup(uid, data);
      setStatus(
        result.notesAdded > 0 || result.foldersAdded > 0
          ? `Imported ${result.notesAdded} note${result.notesAdded === 1 ? "" : "s"} and ${result.foldersAdded} folder${result.foldersAdded === 1 ? "" : "s"}.`
          : "Nothing new to import."
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={styles.body}>
        Export downloads all of your notes and folders as a file. Importing a backup, including
        one from the phone tool, adds anything that isn't already here. Nothing will be removed or
        overwritten.
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button type="button" style={styles.action} onClick={handleExport}>
        EXPORT BACKUP
      </button>
      <button
        type="button"
        style={styles.action}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "IMPORTING…" : "IMPORT BACKUP"}
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </>
  );
}
