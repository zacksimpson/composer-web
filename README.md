# Composer Web

A desktop companion for the Composer markdown notes tool for the Light Phone III. Laid out as a responsive web app with the same notes, folders and backup format as the phone tool.

## Features
* Live markdown editing: type `# `, `- `, `**bold**` and it formats as you go
* Notes organized in folders, drag a note onto a folder to move it
* Copy as markdown or plain text
* Backup and restore, compatible with backups from the phone tool
* Keyboard shortcuts for fast navigation

| Key | Action |
| --- | --- |
| `1` | New note |
| `2` | All notes |
| `3` | Settings |
| `n` | New note, from a note list |
| `↑` / `↓` | Previous / next note |
| `Delete` | Delete the open note |

Shortcuts are ignored while typing in a field or the editor.

## Storage

Notes are stored in your browser (`localStorage`). There is no account or sync yet, so clear site data and they're gone. Use **Settings → Backup & Restore** to keep a copy or move notes between devices.

## Running it

```bash
npm install
npm run dev
```

## Stack

- React + TypeScript + Vite
- [Milkdown](https://milkdown.dev) for the live markdown editor

## Adding Firebase later

The app is built so a Firebase backend drops in without touching any screen.

- All data goes through [`src/lib/store.ts`](src/lib/store.ts). Every function takes a `uid` first, and the `subscribeTo*` functions push whole collections to a callback, which is the same shape as Firestore `onSnapshot`. Only this file needs to be reimplemented.
- The data model already carries `updatedAt` and soft `deleted` flags on notes and folders, so sync doesn't need a migration.
- Folder order lives in one field on the settings document (`folderOrder`), so a drag reorder is a single write.
- [`src/App.tsx`](src/App.tsx) hands `AppShell` a constant `LOCAL_UID`. Real accounts go here: an auth gate that renders a sign in screen, then `AppShell` with the signed in user's uid.

Suggested Firestore layout, one document per row:

```
users/{uid}/notes/{noteId}
users/{uid}/folders/{folderId}
users/{uid}/settings/singleton
```

with rules that let each user read and write only their own subtree:

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
