import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";

const styles = {
  pane: { padding: "30px 24px" },
  headerTitle: { fontSize: 32, fontWeight: 400, marginBottom: 26 },
  headerMobile: {
    textAlign: "center" as const,
    fontSize: 23,
    marginBottom: 26,
    position: "relative" as const,
  },
  backButtonMobile: { position: "absolute" as const, left: 0, top: 3 },
  row: {
    width: "100%",
    textAlign: "left" as const,
    padding: "13px 0",
  },
  rowValue: { fontSize: 23 },
};

export type SettingKey = "new-note-format" | "sort-order" | "backup";

const ROWS: { key: SettingKey; label: string }[] = [
  { key: "new-note-format", label: "New Note Format" },
  { key: "sort-order", label: "Sort Notes By" },
  { key: "backup", label: "Backup & Restore" },
];

export function SettingsPane({
  activeSetting,
  onSelectSetting,
  onBack,
}: {
  activeSetting: SettingKey | null;
  onSelectSetting: (key: SettingKey) => void;
  onBack?: () => void;
}) {
  return (
    <ScrollPane style={styles.pane}>
      {onBack ? (
        <div style={styles.headerMobile}>
          <BackButton onBack={onBack} style={styles.backButtonMobile} />
          Settings
        </div>
      ) : (
        <div style={styles.headerTitle}>Settings</div>
      )}

      {ROWS.map((row) => (
        <button
          key={row.key}
          type="button"
          style={{ ...styles.row, textDecoration: activeSetting === row.key ? "underline" : "none" }}
          onClick={() => onSelectSetting(row.key)}
        >
          <div style={styles.rowValue}>{row.label}</div>
        </button>
      ))}
    </ScrollPane>
  );
}
