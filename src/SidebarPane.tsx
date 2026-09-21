import { type DragEvent, type KeyboardEvent, useState } from "react";
import type { Folder } from "./lib/models";
import { addFolder, moveNotes, reorderFolders } from "./lib/store";
import { useDragReorder } from "./lib/useDragReorder";
import { DonateDialog } from "./DonateDialog";
import { AccountIcon, HeartIcon, ListIcon, NewNoteIcon, PlusIcon, SettingsIcon } from "./icons";
import { ScrollPane } from "./ScrollPane";

export const NOTE_DRAG_TYPE = "application/x-composer-note";

const SIDE_PADDING = { paddingLeft: 20, paddingRight: 28 };
const NAV_GAP = 72;

const styles = {
  pane: {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
    padding: "30px 0",
  },
  navZone: { ...SIDE_PADDING, flexShrink: 0, marginBottom: NAV_GAP },
  navRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    width: "100%",
    textAlign: "left" as const,
  },
  navIcon: { width: 23, display: "flex", justifyContent: "center", flexShrink: 0 },
  navLabel: { fontSize: 19 },
  scrollZoneOuter: { flex: 1, minHeight: 0 },
  scrollZoneInner: SIDE_PADDING,
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15 },
  addButton: { display: "flex" },
  folderRow: {
    fontSize: 23,
    padding: "7px 0",
    width: "100%",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  emptyFolders: { fontSize: 15, lineHeight: 1.6 },
  newFolderInput: {
    fontSize: 23,
    width: "100%",
    borderBottom: "2px solid #fff",
    paddingBottom: 2,
  },
  accountZone: { ...SIDE_PADDING, flexShrink: 0, marginTop: NAV_GAP },
  donateRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    color: "#fff",
    textDecoration: "none",
  },
  donateLabel: { fontSize: 19 },
};

type Section = "notes" | "folder" | "settings" | "account";
// nav buttons pick fixed sections, folders go through onSelectFolder
type SelectableSection = Exclude<Section, "folder">;

function isNoteDrag(e: DragEvent) {
  return e.dataTransfer.types.includes(NOTE_DRAG_TYPE);
}

export function SidebarPane({
  folders,
  selectedFolderId,
  onSelectFolder,
  section,
  onSelectSection,
  onNewNote,
  uid,
}: {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  section: Section;
  onSelectSection: (section: SelectableSection) => void;
  onNewNote: () => void;
  uid: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [noteDropId, setNoteDropId] = useState<string | null>(null);
  const { getRowProps, getContainerProps } = useDragReorder(
    folders,
    (f) => f.id,
    (reordered) => reorderFolders(uid, reordered.map((f) => f.id))
  );

  async function submitNewFolder(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setAdding(false);
      setNewName("");
      return;
    }
    if (e.key !== "Enter") return;
    const name = newName.trim();
    if (name) {
      await addFolder(uid, name);
    }
    setAdding(false);
    setNewName("");
  }

  const navLabel = (active: boolean) => ({
    ...styles.navLabel,
    textDecoration: active ? "underline" : "none",
    textUnderlineOffset: 3,
  });

  return (
    <div style={styles.pane}>
      <div style={styles.navZone}>
        <button type="button" style={styles.navRow} onClick={onNewNote}>
          <span style={styles.navIcon}>
            <NewNoteIcon size={23} />
          </span>
          <span style={navLabel(false)}>New Note</span>
        </button>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("notes")}>
          <span style={styles.navIcon}>
            <ListIcon />
          </span>
          <span style={navLabel(section === "notes")}>All Notes</span>
        </button>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("settings")}>
          <span style={styles.navIcon}>
            <SettingsIcon />
          </span>
          <span style={navLabel(section === "settings")}>Settings</span>
        </button>
      </div>

      <ScrollPane
        style={styles.scrollZoneInner}
        outerStyle={styles.scrollZoneOuter}
        dropZoneProps={getContainerProps()}
      >
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Your folders</span>
          <button
            type="button"
            style={styles.addButton}
            aria-label="Add folder"
            onClick={() => setAdding(true)}
          >
            <PlusIcon size={13} />
          </button>
        </div>

        {folders.length === 0 && !adding && <div style={styles.emptyFolders}>No folders</div>}

        {folders.map((folder) => {
          const rowProps = getRowProps(folder.id);
          const active =
            (section === "folder" && folder.id === selectedFolderId) || noteDropId === folder.id;
          return (
            <button
              key={folder.id}
              type="button"
              {...rowProps}
              style={{
                ...styles.folderRow,
                ...rowProps.style,
                textDecoration: active ? "underline" : "none",
                textUnderlineOffset: 4,
              }}
              onClick={() => onSelectFolder(folder.id)}
              onDragOver={(e) => {
                if (!isNoteDrag(e)) return rowProps.onDragOver(e);
                e.preventDefault();
                e.stopPropagation();
                setNoteDropId(folder.id);
              }}
              onDragLeave={() => setNoteDropId((id) => (id === folder.id ? null : id))}
              onDrop={(e) => {
                if (!isNoteDrag(e)) return rowProps.onDrop(e);
                e.preventDefault();
                e.stopPropagation();
                setNoteDropId(null);
                const noteId = e.dataTransfer.getData(NOTE_DRAG_TYPE);
                if (noteId) moveNotes(uid, [noteId], folder.id);
              }}
            >
              {folder.name}
            </button>
          );
        })}

        {adding && (
          <input
            style={styles.newFolderInput}
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={submitNewFolder}
            onBlur={() => {
              setAdding(false);
              setNewName("");
            }}
          />
        )}
      </ScrollPane>

      <div style={styles.accountZone}>
        <button type="button" style={styles.navRow} onClick={() => onSelectSection("account")}>
          <span style={styles.navIcon}>
            <AccountIcon />
          </span>
          <span style={navLabel(section === "account")}>Account</span>
        </button>
        <button type="button" style={styles.donateRow} onClick={() => setShowDonateDialog(true)}>
          <span style={styles.navIcon}>
            <HeartIcon size={20} />
          </span>
          <span style={styles.donateLabel}>Donate</span>
        </button>
      </div>

      {showDonateDialog && <DonateDialog onClose={() => setShowDonateDialog(false)} />}
    </div>
  );
}
