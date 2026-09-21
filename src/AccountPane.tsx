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
  status: { fontSize: 16, marginBottom: 30 },
  row: {
    width: "100%",
    textAlign: "left" as const,
    padding: "13px 0",
    fontSize: 23,
  },
};

export type AccountKey = "sync" | "delete-data";

export function AccountPane({
  activeAccountAction,
  onSelectAccountAction,
  onBack,
}: {
  activeAccountAction: AccountKey | null;
  onSelectAccountAction: (key: AccountKey) => void;
  onBack?: () => void;
}) {
  return (
    <ScrollPane style={styles.pane}>
      {onBack ? (
        <div style={styles.headerMobile}>
          <BackButton onBack={onBack} style={styles.backButtonMobile} />
          Account
        </div>
      ) : (
        <div style={styles.headerTitle}>Account</div>
      )}

      <div style={styles.status}>Notes are stored in this browser</div>

      <button
        type="button"
        style={{ ...styles.row, textDecoration: activeAccountAction === "sync" ? "underline" : "none" }}
        onClick={() => onSelectAccountAction("sync")}
      >
        Sync
      </button>

      <button
        type="button"
        style={{
          ...styles.row,
          textDecoration: activeAccountAction === "delete-data" ? "underline" : "none",
        }}
        onClick={() => onSelectAccountAction("delete-data")}
      >
        Delete All Data
      </button>
    </ScrollPane>
  );
}
