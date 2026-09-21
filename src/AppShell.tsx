import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { Folder, Note, Settings } from "./lib/models";
import { isTypingTarget } from "./lib/keyboardUtils";
import { applyOrder } from "./lib/ordering";
import {
  addNote,
  pruneEmptyNotes,
  subscribeToFolders,
  subscribeToNotes,
  subscribeToSettings,
} from "./lib/store";
import { appNavReducer, initialAppNavState, isShowingDetail } from "./appNav";
import { AccountDetailPane } from "./AccountDetailPane";
import { AccountPane } from "./AccountPane";
import { FolderOptionsPane } from "./FolderOptionsPane";
import { NoteDetailPane } from "./NoteDetailPane";
import { NoteListPane } from "./NoteListPane";
import { PaneResizer } from "./PaneResizer";
import { SettingsDetailPane } from "./SettingsDetailPane";
import { SettingsPane } from "./SettingsPane";
import { SidebarPane } from "./SidebarPane";
import { useLayoutTier } from "./useLayoutTier";
import { useResizablePanes } from "./useResizablePanes";

export function AppShell({ uid }: { uid: string }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [nav, dispatch] = useReducer(appNavReducer, initialAppNavState);
  const tier = useLayoutTier();
  const { widths, startDrag } = useResizablePanes();

  const { selectedFolderId, mobileStage, screen } = nav;

  useEffect(() => {
    pruneEmptyNotes(uid);
    const unsubFolders = subscribeToFolders(uid, setFolders);
    const unsubNotes = subscribeToNotes(uid, setNotes);
    const unsubSettings = subscribeToSettings(uid, setSettings);
    return () => {
      unsubFolders();
      unsubNotes();
      unsubSettings();
    };
  }, [uid]);

  const newNoteFormat = settings?.newNoteFormat ?? "body";
  const handleNewNote = useCallback(async () => {
    const folderId = screen.section === "folder" ? selectedFolderId : null;
    const note = await addNote(uid, { folderId, format: newNoteFormat });
    dispatch({ type: "NOTE_CREATED", noteId: note.id, folderId });
  }, [uid, screen.section, selectedFolderId, newNoteFormat]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "1") {
        e.preventDefault();
        handleNewNote();
      } else if (e.key === "2") {
        e.preventDefault();
        dispatch({ type: "SELECT_SECTION", section: "notes" });
      } else if (e.key === "3") {
        e.preventDefault();
        dispatch({ type: "SELECT_SECTION", section: "settings" });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNewNote]);

  // a folder deleted somewhere else (another tab) can't stay selected
  useEffect(() => {
    if (screen.section === "folder" && !folders.some((f) => f.id === selectedFolderId)) {
      dispatch({ type: "FOLDER_DELETED" });
    }
  }, [screen.section, selectedFolderId, folders]);

  const detail =
    screen.section === "notes" || screen.section === "folder" ? screen.detail : { kind: "none" as const };
  const selectedNoteId = detail.kind === "edit" ? detail.noteId : null;

  // drop a never-written note on leaving it, safe under strict mode
  const previousNoteId = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousNoteId.current;
    previousNoteId.current = selectedNoteId;
    if (previous && previous !== selectedNoteId) {
      pruneEmptyNotes(uid, selectedNoteId);
    }
  }, [uid, selectedNoteId]);

  if (!settings) {
    return null;
  }

  // folders missing from folderOrder fall back to their own order
  const orderedFolders = applyOrder(folders, (f) => f.id, settings.folderOrder, (a, b) => a.order - b.order);

  const showingDetail = isShowingDetail(screen);

  // the list's back arrow is mobile only
  const middleBack = tier === "mobile" ? () => dispatch({ type: "GO_TO_MOBILE_SIDEBAR" }) : undefined;
  // the detail pane pushes in as its own screen at tablet and mobile
  const detailBack = tier !== "desktop" ? () => dispatch({ type: "GO_BACK_FROM_DETAIL" }) : undefined;

  const activeSetting = screen.section === "settings" ? screen.activeSetting : null;
  const activeAccountAction = screen.section === "account" ? screen.activeAccountAction : null;
  const currentFolder =
    screen.section === "folder" ? (orderedFolders.find((f) => f.id === selectedFolderId) ?? null) : null;

  const sidebarPane = (
    <SidebarPane
      folders={orderedFolders}
      selectedFolderId={selectedFolderId}
      section={screen.section}
      onSelectSection={(section) => dispatch({ type: "SELECT_SECTION", section })}
      onSelectFolder={(id) => dispatch({ type: "SELECT_FOLDER", folderId: id })}
      onNewNote={handleNewNote}
      uid={uid}
    />
  );

  const noteListPane = (
    <NoteListPane
      title={currentFolder ? currentFolder.name : "All Notes"}
      folder={currentFolder}
      folders={orderedFolders}
      notes={currentFolder ? notes.filter((n) => n.folderId === currentFolder.id) : notes}
      sortOrder={settings.sortOrder}
      selectedNoteId={selectedNoteId}
      onSelectNote={(noteId) => dispatch({ type: "OPEN_NOTE", noteId })}
      onNewNote={handleNewNote}
      onOpenFolderOptions={() => dispatch({ type: "OPEN_FOLDER_OPTIONS" })}
      onBack={middleBack}
    />
  );

  const middlePane =
    screen.section === "settings" ? (
      <SettingsPane
        activeSetting={activeSetting}
        onSelectSetting={(key) => dispatch({ type: "OPEN_SETTING", key })}
        onBack={middleBack}
      />
    ) : screen.section === "account" ? (
      <AccountPane
        activeAccountAction={activeAccountAction}
        onSelectAccountAction={(key) => dispatch({ type: "OPEN_ACCOUNT_ACTION", key })}
        onBack={middleBack}
      />
    ) : (
      noteListPane
    );

  const detailPane =
    screen.section === "settings" ? (
      <SettingsDetailPane
        uid={uid}
        folders={orderedFolders}
        notes={notes}
        settings={settings}
        activeSetting={activeSetting}
        onBack={detailBack}
      />
    ) : screen.section === "account" ? (
      <AccountDetailPane uid={uid} activeAccountAction={activeAccountAction} onBack={detailBack} />
    ) : screen.section === "folder" && detail.kind === "folder-options" && currentFolder ? (
      <FolderOptionsPane
        key={currentFolder.id}
        uid={uid}
        folder={currentFolder}
        onBack={detailBack}
        onDeleted={() => dispatch({ type: "FOLDER_DELETED" })}
      />
    ) : (
      <NoteDetailPane
        uid={uid}
        folders={orderedFolders}
        detail={detail}
        note={selectedNoteId ? (notes.find((n) => n.id === selectedNoteId) ?? null) : null}
        onClose={() => dispatch({ type: "GO_BACK_FROM_DETAIL" })}
        onBack={detailBack}
      />
    );

  if (tier === "mobile") {
    return (
      <div style={{ minHeight: "100vh" }}>
        {mobileStage === "sidebar" && sidebarPane}
        {mobileStage === "list" && middlePane}
        {mobileStage === "detail" && detailPane}
      </div>
    );
  }

  const outerPadding = { paddingTop: 56, paddingBottom: 56, paddingLeft: 60, paddingRight: 60 };

  if (tier === "tablet") {
    if (showingDetail) {
      return <div style={{ height: "100vh", ...outerPadding }}>{detailPane}</div>;
    }
    return (
      <div style={{ height: "100vh", ...outerPadding }}>
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${widths.sidebar}px 1fr`,
              height: "100%",
            }}
          >
            {sidebarPane}
            {middlePane}
          </div>
          <PaneResizer left={widths.sidebar} onMouseDown={startDrag("sidebar")} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", ...outerPadding }}>
      {/* capped so ultrawide screens don't stretch the detail pane */}
      <div style={{ maxWidth: 1920, height: "100%", margin: "0 auto" }}>
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${widths.sidebar}px ${widths.list}px 1fr`,
              height: "100%",
            }}
          >
            {sidebarPane}
            {middlePane}
            {detailPane}
          </div>
          <PaneResizer left={widths.sidebar} onMouseDown={startDrag("sidebar")} />
          <PaneResizer left={widths.sidebar + widths.list} onMouseDown={startDrag("list")} />
        </div>
      </div>
    </div>
  );
}
