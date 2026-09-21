import { useState } from "react";
import { deleteAllUserData } from "./lib/store";
import { BackButton } from "./BackButton";
import { ScrollPane } from "./ScrollPane";
import type { AccountKey } from "./AccountPane";

const styles = {
  pane: { padding: "30px 37px", maxWidth: 720 },
  backRow: { marginBottom: 20 },
  title: { fontSize: 32, marginBottom: 26, fontWeight: 400 },
  body: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  action: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    textAlign: "left" as const,
  },
  status: { fontSize: 16, marginTop: 24 },
};

export function AccountDetailPane({
  uid,
  activeAccountAction,
  onBack,
}: {
  uid: string;
  activeAccountAction: AccountKey | null;
  onBack?: () => void;
}) {
  if (activeAccountAction === null) {
    return <div style={styles.pane} />;
  }

  const backRow = onBack && (
    <div style={styles.backRow}>
      <BackButton onBack={onBack} />
    </div>
  );

  if (activeAccountAction === "sync") {
    return (
      <ScrollPane style={styles.pane}>
        {backRow}
        <div style={styles.title}>Sync</div>
        <div style={styles.body}>
          Signing in and syncing across devices isn't available yet. For now your notes live in
          this browser only, so clearing this site's data will remove them.
        </div>
        <div style={styles.body}>
          To keep a copy or move notes to another device, use Settings &rarr; Backup & Restore.
        </div>
      </ScrollPane>
    );
  }

  return (
    <ScrollPane style={styles.pane}>
      {backRow}
      <div style={styles.title}>Delete All Data</div>
      <DeleteDataSection uid={uid} />
    </ScrollPane>
  );
}

function DeleteDataSection({ uid }: { uid: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    await deleteAllUserData(uid);
    setStatus("All notes and folders were deleted.");
    setBusy(false);
  }

  return (
    <>
      <div style={styles.body}>
        This permanently deletes every note and folder stored in this browser. This can't be
        undone.
      </div>
      <button type="button" style={styles.action} disabled={busy} onClick={handleDelete}>
        {busy ? "DELETING…" : "DELETE"}
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </>
  );
}
