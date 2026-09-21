// local data layer shaped like a firestore one, swap it to add firebase

import {
  DEFAULT_SETTINGS,
  type Folder,
  type NewNoteFormat,
  type Note,
  type Settings,
} from "./models";
import { isEmptyBody } from "./noteText";

/** uid used until real accounts exist */
export const LOCAL_UID = "local";

const NOTES_KEY = "composer-web:notes";
const FOLDERS_KEY = "composer-web:folders";
const SETTINGS_KEY = "composer-web:settings";

const FORMAT_PREFIX: Record<NewNoteFormat, string> = {
  h1: "# ",
  h2: "## ",
  h3: "### ",
  body: "",
};

const WELCOME_NOTE_BODY = [
  "# Welcome to Composer",
  "",
  "Composer supports Markdown formatting. Type the syntax and it formats as you go:",
  "",
  "**bold**: `**bold**`",
  "",
  "*italic*: `*italic*`",
  "",
  "# Heading 1: `# text`",
  "",
  "## Heading 2: `## text`",
  "",
  "### Heading 3: `### text`",
  "",
  "- List item: `- text`",
  "- Another item",
  "",
  "1. First item: `1. text`",
  "2. Second item",
  "",
  "`inline code`: wrap with backticks",
  "",
  "> Blockquote: `> text`",
  "",
  "---",
  "",
  "Divider line: type `---` on its own line",
].join("\n");

export function generateId(): string {
  return crypto.randomUUID();
}

// storage plumbing

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  listeners.get(key)?.forEach((fn) => fn());
}

function listen(key: string, fn: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);
  return () => {
    set.delete(fn);
  };
}

// another tab writing the same key
window.addEventListener("storage", (e) => {
  if (e.key) listeners.get(e.key)?.forEach((fn) => fn());
});

function readNotes(): Note[] {
  const stored = read<Note[]>(NOTES_KEY);
  if (stored) return stored;
  const now = Date.now();
  const welcome: Note = {
    id: generateId(),
    title: null,
    body: WELCOME_NOTE_BODY,
    folderId: null,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  };
  write(NOTES_KEY, [welcome]);
  return [welcome];
}

const readFolders = () => read<Folder[]>(FOLDERS_KEY) ?? [];

function readSettings(): Settings {
  return { ...DEFAULT_SETTINGS, updatedAt: 0, ...read<Partial<Settings>>(SETTINGS_KEY) };
}

// subscriptions

export function subscribeToNotes(_uid: string, cb: (notes: Note[]) => void) {
  const emit = () => cb(readNotes().filter((n) => !n.deleted));
  emit();
  return listen(NOTES_KEY, emit);
}

export function subscribeToFolders(_uid: string, cb: (folders: Folder[]) => void) {
  const emit = () =>
    cb(
      readFolders()
        .filter((f) => !f.deleted)
        .sort((a, b) => a.order - b.order)
    );
  emit();
  return listen(FOLDERS_KEY, emit);
}

export function subscribeToSettings(_uid: string, cb: (settings: Settings) => void) {
  const emit = () => cb(readSettings());
  emit();
  return listen(SETTINGS_KEY, emit);
}

export async function updateSettings(
  _uid: string,
  updates: Partial<Omit<Settings, "updatedAt">>
): Promise<void> {
  write(SETTINGS_KEY, { ...readSettings(), ...updates, updatedAt: Date.now() });
}

// folders

export async function addFolder(_uid: string, name: string): Promise<Folder> {
  const folders = readFolders();
  const now = Date.now();
  const folder: Folder = {
    id: generateId(),
    name,
    createdAt: now,
    order: folders.length,
    updatedAt: now,
    deleted: false,
  };
  write(FOLDERS_KEY, [...folders, folder]);
  return folder;
}

export async function renameFolder(_uid: string, id: string, name: string): Promise<void> {
  const now = Date.now();
  write(
    FOLDERS_KEY,
    readFolders().map((f) => (f.id === id ? { ...f, name, updatedAt: now } : f))
  );
}

/** saves folder order as one field on the settings doc */
export async function reorderFolders(uid: string, orderedIds: string[]): Promise<void> {
  await updateSettings(uid, { folderOrder: orderedIds });
}

/** soft-deletes the folder and moves its notes to the top level */
export async function deleteFolder(_uid: string, id: string): Promise<void> {
  const now = Date.now();
  write(
    NOTES_KEY,
    readNotes().map((n) => (n.folderId === id ? { ...n, folderId: null, updatedAt: now } : n))
  );
  write(
    FOLDERS_KEY,
    readFolders().map((f) => (f.id === id ? { ...f, deleted: true, updatedAt: now } : f))
  );
}

// notes

export async function addNote(
  _uid: string,
  input: { folderId: string | null; format: NewNoteFormat }
): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: generateId(),
    title: null,
    body: FORMAT_PREFIX[input.format],
    folderId: input.folderId,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  };
  write(NOTES_KEY, [note, ...readNotes()]);
  return note;
}

export async function updateNote(
  _uid: string,
  id: string,
  updates: Partial<Pick<Note, "title" | "body" | "folderId">>
): Promise<void> {
  const now = Date.now();
  write(
    NOTES_KEY,
    readNotes().map((n) => (n.id === id && !n.deleted ? { ...n, ...updates, updatedAt: now } : n))
  );
}

/** moves notes without touching their edited date */
export async function moveNotes(
  _uid: string,
  ids: string[],
  folderId: string | null
): Promise<void> {
  const idSet = new Set(ids);
  write(
    NOTES_KEY,
    readNotes().map((n) => (idSet.has(n.id) ? { ...n, folderId } : n))
  );
}

export async function deleteNote(_uid: string, id: string): Promise<void> {
  const now = Date.now();
  write(
    NOTES_KEY,
    readNotes().map((n) => (n.id === id ? { ...n, body: "", deleted: true, updatedAt: now } : n))
  );
}

/** deletes untitled notes that were never written in */
export async function pruneEmptyNotes(uid: string, exceptId?: string | null): Promise<void> {
  const empty = readNotes().filter(
    (n) => !n.deleted && n.id !== exceptId && n.title === null && isEmptyBody(n.body)
  );
  await Promise.all(empty.map((n) => deleteNote(uid, n.id)));
}

// backup, same file format as the phone app

export interface BackupData {
  folders: { id: string; name: string; order?: number }[];
  notes: {
    id: string;
    title?: string | null;
    body: string;
    folderId?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }[];
}

export function buildBackup(folders: Folder[], notes: Note[]): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "Composer",
      folders: folders.map(({ id, name, order }) => ({ id, name, order })),
      notes: notes.map(({ id, title, body, folderId, createdAt, updatedAt }) => ({
        id,
        title,
        body,
        folderId,
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(updatedAt).toISOString(),
      })),
    },
    null,
    2
  );
}

/** throws if the file isn't a composer backup */
export function parseBackupFile(json: string): BackupData {
  const raw = JSON.parse(json) as { folders?: unknown; notes?: unknown };
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.notes)) {
    throw new Error("That file isn't a valid Composer backup.");
  }
  return {
    folders: Array.isArray(raw.folders) ? (raw.folders as BackupData["folders"]) : [],
    notes: raw.notes as BackupData["notes"],
  };
}

/** adds folders and notes not already present, matched by id */
export async function importBackup(
  _uid: string,
  data: BackupData
): Promise<{ foldersAdded: number; notesAdded: number }> {
  const folders = readFolders();
  const notes = readNotes();
  const folderIds = new Set(folders.map((f) => f.id));
  const noteIds = new Set(notes.map((n) => n.id));
  const maxOrder = folders.reduce((max, f) => Math.max(max, f.order), -1);
  const now = Date.now();

  const newFolders: Folder[] = data.folders
    .filter((f) => f && typeof f.id === "string" && typeof f.name === "string" && !folderIds.has(f.id))
    .map((f, i) => ({
      id: f.id,
      name: f.name,
      createdAt: now,
      order: maxOrder + 1 + i,
      updatedAt: now,
      deleted: false,
    }));
  const validFolderIds = new Set([...folderIds, ...newFolders.map((f) => f.id)]);

  const stamp = (value: string | undefined) => {
    const parsed = value ? Date.parse(value) : Number.NaN;
    return Number.isNaN(parsed) ? now : parsed;
  };
  const newNotes: Note[] = data.notes
    .filter((n) => n && typeof n.id === "string" && typeof n.body === "string" && !noteIds.has(n.id))
    .map((n) => ({
      id: n.id,
      title: typeof n.title === "string" ? n.title : null,
      body: n.body,
      folderId: n.folderId && validFolderIds.has(n.folderId) ? n.folderId : null,
      createdAt: stamp(n.createdAt),
      updatedAt: stamp(n.updatedAt),
      deleted: false,
    }));

  if (newFolders.length > 0) write(FOLDERS_KEY, [...folders, ...newFolders]);
  if (newNotes.length > 0) write(NOTES_KEY, [...newNotes, ...notes]);
  return { foldersAdded: newFolders.length, notesAdded: newNotes.length };
}

/** wipes everything stored for a user */
export async function deleteAllUserData(_uid: string): Promise<void> {
  write(NOTES_KEY, []);
  write(FOLDERS_KEY, []);
  write(SETTINGS_KEY, { ...DEFAULT_SETTINGS, updatedAt: Date.now() });
}
