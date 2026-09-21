// updatedAt and deleted let sync be added without a migration

export interface Note {
  id: string;
  title: string | null; // null = derive from the first line of the body
  body: string; // raw markdown
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  order: number;
  updatedAt: number;
  deleted: boolean;
}

export type NewNoteFormat = "h1" | "h2" | "h3" | "body";
export type NoteSortOrder = "edited" | "created";

export interface Settings {
  newNoteFormat: NewNoteFormat;
  sortOrder: NoteSortOrder;
  // drag-reorder position of folders, missing ones fall back to `order`
  folderOrder?: string[];
  updatedAt: number;
}

export const DEFAULT_SETTINGS: Omit<Settings, "updatedAt"> = {
  newNoteFormat: "body",
  sortOrder: "edited",
};
