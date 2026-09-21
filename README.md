# Composer Web

A desktop companion for the Composer markdown notes tool for the Light Phone III. Laid out as a responsive web app with the same notes, folders and backup format as the phone tool.

## Features
* Live markdown editing: type `# `, `- `, `**bold**` and it formats as you go
* Notes organized in folders, drag a note onto a folder to move it
* Copy as markdown or plain text
* Backup and restore, compatible with backups from the phone tool
* Keyboard shortcuts for fast navigation

| Type | Result |
| --- | --- |
| `**text**` | **bold** |
| `*text*` | *italic* |
| `# text` | Heading 1 |
| `## text` | Heading 2 |
| `### text` | Heading 3 |
| `- text` | Bulleted list |
| `1. text` | Numbered list |
| `` `text` `` | `inline code` |
| `> text` | Blockquote |
| `---` | Divider line |

## Storage

Notes are stored in your browser (`localStorage`). There is no account or sync yet, so clear site data and they're gone. Use **Settings → Backup & Restore** to keep a copy or move notes between devices.

## Running it yourself

<details>
  <summary>Running locally</summary>

## Stack

- React + TypeScript + Vite
- [Milkdown](https://milkdown.dev) for the live markdown editor

## Steps
1. Install [Node.js](https://nodejs.org) (pick the LTS version), which comes bundled with npm. Everything below runs through your terminal using npm.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

</details>

<details>
  <summary>Adding Firebase later</summary>

The app is built so a Firebase backend drops in without touching any screen.

- All data goes through [src/lib/store.ts](src/lib/store.ts). Every function takes a `uid` first, and the `subscribeTo*` functions push whole collections to a callback, which is the same shape as Firestore `onSnapshot`. Only this file needs to be reimplemented.
- The data model already carries `updatedAt` and soft `deleted` flags on notes and folders, so sync doesn't need a migration.
- Folder order lives in one field on the settings document (`folderOrder`), so a drag reorder is a single write.
- [src/App.tsx](src/App.tsx) hands `AppShell` a constant `LOCAL_UID`. Real accounts go here: an auth gate that renders a sign in screen, then `AppShell` with the signed in user's uid.

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

</details>
