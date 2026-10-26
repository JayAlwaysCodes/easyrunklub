type Cell = string | number | null | undefined;

// Spreadsheet apps treat cells starting with = + - @ as formulas, which
// would let a member put a malicious formula in their name. A leading
// apostrophe makes them plain text.
function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);

  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(rows: Cell[][]): string {
  // The BOM makes Excel read the file as UTF-8 (so names with accents survive).
  return "\uFEFF" + rows.map((row) => row.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}