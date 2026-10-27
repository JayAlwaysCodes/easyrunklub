import { describe, expect, it } from "vitest";

import { toCsv } from "./csv";

describe("toCsv", () => {
  it("starts with a BOM and ends each row with CRLF", () => {
    const csv = toCsv([["a", "b"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toBe("\uFEFFa,b\r\n");
  });

  it("joins several rows with CRLF", () => {
    expect(toCsv([["a"], ["b"]])).toBe("\uFEFFa\r\nb\r\n");
  });

  it("quotes cells containing commas, quotes or line breaks", () => {
    expect(toCsv([["Doe, Jane"]])).toContain('"Doe, Jane"');
    expect(toCsv([['say "hi"']])).toContain('"say ""hi"""');
    expect(toCsv([["line1\nline2"]])).toContain('"line1\nline2"');
  });

  it("turns null and undefined into empty cells", () => {
    expect(toCsv([["a", null, undefined, "d"]])).toBe("\uFEFFa,,,d\r\n");
  });

  it("writes numbers as they are, including negatives", () => {
    expect(toCsv([[5000, -250, 12.5]])).toBe("\uFEFF5000,-250,12.5\r\n");
  });

  it("defuses spreadsheet formulas in text cells", () => {
    expect(toCsv([["=SUM(A1:A9)"]])).toBe("\uFEFF'=SUM(A1:A9)\r\n");
    expect(toCsv([["+234803"]])).toBe("\uFEFF'+234803\r\n");
    expect(toCsv([["-1+1"]])).toBe("\uFEFF'-1+1\r\n");
    expect(toCsv([["@cmd"]])).toBe("\uFEFF'@cmd\r\n");
  });

  it("defuses a formula that also needs quoting", () => {
    expect(toCsv([['=HYPERLINK("x","y")']])).toBe(
      "\uFEFF\"'=HYPERLINK(\"\"x\"\",\"\"y\"\")\"\r\n"
    );
  });

  it("leaves ordinary text alone", () => {
    expect(toCsv([["Chidi Okafor", "ERK-000007"]])).toBe("\uFEFFChidi Okafor,ERK-000007\r\n");
  });
});