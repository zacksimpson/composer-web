export function PaneResizer({
  left,
  onMouseDown,
}: {
  left: number;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: left - 4,
        width: 8,
        cursor: "col-resize",
      }}
    />
  );
}
