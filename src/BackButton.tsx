import { BackChevronIcon } from "./icons";

export function BackButton({ onBack, style }: { onBack: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" aria-label="Back" onClick={onBack} style={{ display: "flex", ...style }}>
      <BackChevronIcon />
    </button>
  );
}
