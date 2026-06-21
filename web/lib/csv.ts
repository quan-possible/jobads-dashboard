// CSV export helpers. RFC-4180 compliant: \r\n line endings, fields with
// commas/quotes/newlines are double-quoted, embedded quotes are doubled.

function escapeField(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  // Wrap if the field contains a comma, double-quote, or newline character.
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Convert an array of records to a CSV string (RFC-4180).
 * @param rows     Flat record array — every value will be stringified.
 * @param columns  Optional column spec. When omitted, keys are taken from the
 *                 first row. Provide explicit columns to control order and
 *                 supply human-readable headers.
 */
export function toCSV(
  rows: Record<string, unknown>[],
  columns?: { key: string; header: string }[],
): string {
  if (rows.length === 0) return "";

  const cols =
    columns ??
    Object.keys(rows[0]).map((k) => ({ key: k, header: k }));

  const headerLine = cols.map((c) => escapeField(c.header)).join(",");
  const dataLines = rows.map((row) =>
    cols.map((c) => escapeField(row[c.key])).join(","),
  );

  return [headerLine, ...dataLines].join("\r\n") + "\r\n";
}

/**
 * Trigger a browser download of a CSV string.
 * No-op in SSR environments.
 */
export function downloadCSV(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
