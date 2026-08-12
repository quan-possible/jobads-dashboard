import React from "react";

// The signature pixel-tile mark — a mosaic of small squares painted from the
// four gradient stops, biased navy(left) -> orange(right). Decorative, aria-hidden.
// NOTE: implements the INTENDED four-stop mosaic (the product build has a clamp
// bug that renders every tile navy — see readme.md).
const STOPS = ["#041c2c", "#345961", "#c39e80", "#cf7730"];

function pick(r, c, cols) {
  const bias = cols > 1 ? c / (cols - 1) : 0;
  const h = ((r * 73856093) ^ (c * 19349663)) >>> 0;
  const jitter = (h % 1000) / 1000 - 0.5;
  const t = Math.min(STOPS.length - 0.001, Math.max(0, bias * (STOPS.length - 0.001) + jitter * 1.1));
  return STOPS[Math.floor(t)];
}

export function PixelTiles({ rows = 3, cols = 8, size = 9, gap = 2, className = "" }) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <span key={r + "-" + c} style={{ width: size, height: size, background: pick(r, c, cols), borderRadius: 1 }} />
      );
    }
  }
  return (
    <span aria-hidden className={className} style={{ display: "grid", gridTemplateColumns: "repeat(" + cols + ", " + size + "px)", gridAutoRows: size + "px", gap: gap, lineHeight: 0 }}>
      {cells}
    </span>
  );
}
