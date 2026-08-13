import { ImageResponse } from "next/og";

export const alt = "ACLMR Labour Market · Marché du travail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pixel-tile colours from the brand gradient
const STOPS = ["#041c2c", "#345961", "#c39e80", "#cf7730"];

function pickTile(r: number, c: number, cols: number): string {
  const bias = cols > 1 ? c / (cols - 1) : 0;
  const h = (((r * 73856093) ^ (c * 19349663)) >>> 0) % 1000;
  const jitter = h / 1000 - 0.5;
  const t = Math.min(0.999, Math.max(0, bias * (STOPS.length - 0.001) + jitter * 1.1));
  return STOPS[Math.floor(t)];
}

export default function Image() {
  const TILE = 18;
  const GAP = 4;
  const COLS = 16;
  const ROWS = 4;

  // Build a flat array of [r, c] pairs for the tile grid
  const tiles: { r: number; c: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      tiles.push({ r, c });
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fbf8f5",
        }}
      >
        {/* Top gradient ribbon */}
        <div
          style={{
            width: "100%",
            height: 10,
            background: "linear-gradient(90deg, #041c2c 0%, #345961 37%, #c39e80 77%, #cf7730 100%)",
            flexShrink: 0,
          }}
        />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
          }}
        >
          {/* Left: text */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "60px 80px",
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#cf7730",
                marginBottom: 20,
                fontFamily: "sans-serif",
              }}
            >
              ACLMR
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                textTransform: "uppercase",
                lineHeight: 1.0,
                color: "#041c2c",
                letterSpacing: "-0.01em",
                marginBottom: 28,
                fontFamily: "sans-serif",
                maxWidth: 680,
              }}
            >
              ACLMR
            </div>

            {/* Subtitle */}
            <div
              style={{
                fontSize: 24,
                color: "#5d6b74",
                lineHeight: 1.45,
                fontFamily: "sans-serif",
                maxWidth: 560,
              }}
            >
              Labour Market · Marché du travail
            </div>

            {/* Domain strip */}
            <div
              style={{
                marginTop: 40,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 3,
                  background: "#cf7730",
                }}
              />
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#8a949b",
                  fontFamily: "sans-serif",
                }}
              >
                aclmr.ca
              </div>
            </div>
          </div>

          {/* Right: pixel-tile accent panel */}
          <div
            style={{
              width: 200,
              background: "#041c2c",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: 30,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: `${GAP}px`,
                width: COLS * TILE + (COLS - 1) * GAP,
              }}
            >
              {tiles.map(({ r, c }) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: TILE,
                    height: TILE,
                    background: pickTile(r, c, COLS),
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: "linear-gradient(90deg, #041c2c 0%, #345961 37%, #c39e80 77%, #cf7730 100%)",
            flexShrink: 0,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
