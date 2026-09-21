// one reducer decides the next screen for every action

import type { AccountKey } from "./AccountPane";
import type { SettingKey } from "./SettingsPane";

export type DetailMode =
  | { kind: "none" }
  | { kind: "edit"; noteId: string; autoFocus: boolean }
  | { kind: "folder-options" };

// tablet pushes only detail, mobile shows one pane at a time
export type MobileStage = "sidebar" | "list" | "detail";

export type Screen =
  | { section: "notes"; detail: DetailMode }
  | { section: "folder"; detail: DetailMode }
  | { section: "settings"; activeSetting: SettingKey | null }
  | { section: "account"; activeAccountAction: AccountKey | null };

export interface AppNavState {
  selectedFolderId: string | null;
  mobileStage: MobileStage;
  screen: Screen;
}

export type AppNavAction =
  | { type: "SELECT_SECTION"; section: "notes" | "settings" | "account" }
  | { type: "SELECT_FOLDER"; folderId: string }
  | { type: "OPEN_NOTE"; noteId: string }
  | { type: "NOTE_CREATED"; noteId: string; folderId: string | null }
  | { type: "OPEN_FOLDER_OPTIONS" }
  | { type: "FOLDER_DELETED" }
  | { type: "OPEN_SETTING"; key: SettingKey }
  | { type: "OPEN_ACCOUNT_ACTION"; key: AccountKey }
  | { type: "GO_BACK_FROM_DETAIL" }
  | { type: "GO_TO_MOBILE_SIDEBAR" };

export const initialAppNavState: AppNavState = {
  selectedFolderId: null,
  mobileStage: "sidebar",
  screen: { section: "notes", detail: { kind: "none" } },
};

export function appNavReducer(state: AppNavState, action: AppNavAction): AppNavState {
  switch (action.type) {
    case "SELECT_SECTION": {
      const screen: Screen =
        action.section === "settings"
          ? { section: "settings", activeSetting: null }
          : action.section === "account"
            ? { section: "account", activeAccountAction: null }
            : { section: "notes", detail: { kind: "none" } };
      return { ...state, screen, mobileStage: "list" };
    }

    case "SELECT_FOLDER":
      return {
        ...state,
        selectedFolderId: action.folderId,
        screen: { section: "folder", detail: { kind: "none" } },
        mobileStage: "list",
      };

    case "OPEN_NOTE":
      if (state.screen.section !== "notes" && state.screen.section !== "folder") {
        return state;
      }
      return {
        ...state,
        screen: { ...state.screen, detail: { kind: "edit", noteId: action.noteId, autoFocus: false } },
        mobileStage: "detail",
      };

    case "NOTE_CREATED": {
      const detail: DetailMode = { kind: "edit", noteId: action.noteId, autoFocus: true };
      return action.folderId
        ? {
            ...state,
            selectedFolderId: action.folderId,
            screen: { section: "folder", detail },
            mobileStage: "detail",
          }
        : { ...state, screen: { section: "notes", detail }, mobileStage: "detail" };
    }

    case "OPEN_FOLDER_OPTIONS":
      if (state.screen.section !== "folder") {
        return state;
      }
      return {
        ...state,
        screen: { section: "folder", detail: { kind: "folder-options" } },
        mobileStage: "detail",
      };

    case "FOLDER_DELETED":
      return {
        ...state,
        selectedFolderId: null,
        screen: { section: "notes", detail: { kind: "none" } },
        mobileStage: "list",
      };

    case "OPEN_SETTING":
      if (state.screen.section !== "settings") {
        return state;
      }
      return { ...state, screen: { ...state.screen, activeSetting: action.key }, mobileStage: "detail" };

    case "OPEN_ACCOUNT_ACTION":
      if (state.screen.section !== "account") {
        return state;
      }
      return {
        ...state,
        screen: { section: "account", activeAccountAction: action.key },
        mobileStage: "detail",
      };

    case "GO_BACK_FROM_DETAIL": {
      const { screen } = state;
      if (screen.section === "notes" || screen.section === "folder") {
        return { ...state, screen: { ...screen, detail: { kind: "none" } }, mobileStage: "list" };
      }
      if (screen.section === "settings") {
        return { ...state, screen: { ...screen, activeSetting: null }, mobileStage: "list" };
      }
      return { ...state, screen: { ...screen, activeAccountAction: null }, mobileStage: "list" };
    }

    case "GO_TO_MOBILE_SIDEBAR":
      return { ...state, mobileStage: "sidebar" };

    default:
      return state;
  }
}

/** whether the detail pane has content in any section */
export function isShowingDetail(screen: Screen): boolean {
  if (screen.section === "notes" || screen.section === "folder") {
    return screen.detail.kind !== "none";
  }
  if (screen.section === "settings") {
    return screen.activeSetting !== null;
  }
  return screen.activeAccountAction !== null;
}
