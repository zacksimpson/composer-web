import { useEffect } from "react";

const styles = {
  backdrop: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  box: {
    border: "1px solid #fff",
    background: "#000",
    padding: "30px 37px",
    maxWidth: 420,
    width: "100%",
  },
  message: { fontSize: 16, lineHeight: 1.6, marginBottom: 30 },
  actions: { display: "flex", gap: 30 },
  donateAction: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
    color: "#fff",
    textDecoration: "none",
  },
  cancelAction: {
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "0.15em",
  },
};

export function DonateDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <div style={styles.message}>
          Composer for the web is developed in my spare time. If you have found this website
          useful for you, consider donating to support its development :)
        </div>
        <div style={styles.actions}>
          <a
            href="https://buymeacoffee.com/zacksimpson"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.donateAction}
            onClick={onClose}
          >
            DONATE
          </a>
          <button type="button" style={styles.cancelAction} onClick={onClose}>
            NOT NOW
          </button>
        </div>
      </div>
    </div>
  );
}
