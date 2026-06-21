// The signature pixel-tile mark — a mosaic of small squares painted from the
// four gradient stops. Decorative; hidden from assistive tech. The horizontal
// position biases colour so the navy→teal→sand→orange gradient reads in pixels.

const STOPS = ["#041c2c", "#345961", "#c39e80", "#cf7730"];

function pick(r: number, c: number, cols: number): string {
  const bias = cols > 1 ? c / (cols - 1) : 0;
  // deterministic pseudo-random texture
  const h = ((r * 73856093) ^ (c * 19349663)) >>> 0;
  const jitter = (h % 1000) / 1000 - 0.5;
  const t = Math.min(0.999, Math.max(0, bias * (STOPS.length - 0.001) + jitter * 1.1));
  return STOPS[Math.floor(t)];
}

export function PixelTiles({
  rows = 3,
  cols = 8,
  size = 9,
  gap = 2,
  className = "",
}: {
  rows?: number;
  cols?: number;
  size?: number;
  gap?: number;
  className?: string;
}) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <span
          key={`${r}-${c}`}
          style={{ width: size, height: size, background: pick(r, c, cols), borderRadius: 1 }}
        />,
      );
    }
  }
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridAutoRows: `${size}px`,
        gap,
        lineHeight: 0,
      }}
    >
      {cells}
    </span>
  );
}
