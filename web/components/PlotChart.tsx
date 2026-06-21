"use client";

import { useEffect, useRef, useState } from "react";

// Responsive Observable Plot host. The parent passes a `render(width)` that
// returns a Plot node; we measure the container and re-render on resize.

export function PlotChart({
  render,
  height,
  className = "",
  ariaLabel,
}: {
  render: (width: number) => (SVGSVGElement | HTMLElement) & { remove: () => void };
  height: number;
  className?: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || width === 0) return;
    const chart = render(width);
    el.replaceChildren(chart);
    return () => {
      chart.remove();
    };
  }, [render, width]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: height, width: "100%" }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
