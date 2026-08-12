import React from "react";

// Tiny inline sparkline — pure SVG, no chart lib. Decorative trend cue.
// NOTE: min-max normalised, so a near-flat series is amplified to fill the height.
export function Sparkline({ data, width = 132, height = 34, stroke = "var(--orange)", fill = true }) {
  if (!data || data.length < 2) return <div style={{ height }} aria-hidden />;
  const min = Math.min.apply(null, data);
  const max = Math.max.apply(null, data);
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * stepX, pad + (height - pad * 2) * (1 - (v - min) / span)]);
  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  const area = line + " L" + last[0].toFixed(1) + " " + height + " L" + pts[0][0].toFixed(1) + " " + height + " Z";
  return (
    <svg viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none" aria-hidden
      style={{ width: "100%", maxWidth: width, height: height, display: "block", overflow: "visible" }}>
      {fill && <path d={area} fill={stroke} opacity={0.1} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={stroke} />
    </svg>
  );
}
