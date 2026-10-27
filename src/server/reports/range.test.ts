import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lagosDateString, resolveRange } from "./range";

describe("lagosDateString", () => {
  it("formats as YYYY-MM-DD in Lagos time", () => {
    expect(lagosDateString(new Date("2026-10-23T10:00:00Z"))).toBe("2026-10-23");
  });

  it("rolls to the next day after 23:00 UTC", () => {
    expect(lagosDateString(new Date("2026-10-23T22:59:00Z"))).toBe("2026-10-23");
    expect(lagosDateString(new Date("2026-10-23T23:00:00Z"))).toBe("2026-10-24");
  });
});

describe("resolveRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T14:00:00Z")); // 3pm Lagos
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to the 1st of this month through today", () => {
    const range = resolveRange();
    expect(range.fromStr).toBe("2026-10-01");
    expect(range.toStr).toBe("2026-10-23");
    expect(range.today).toBe("2026-10-23");
  });

  it("covers the whole 'to' day (end is the start of the next day, in Lagos)", () => {
    const range = resolveRange("2026-10-01", "2026-10-31");
    expect(range.start.toISOString()).toBe("2026-09-30T23:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-31T23:00:00.000Z");
  });

  it("includes a payment made at 23:30 Lagos time on the last day", () => {
    const range = resolveRange("2026-10-01", "2026-10-31");
    const lateNight = new Date("2026-10-31T22:30:00Z"); // 23:30 Lagos
    expect(lateNight >= range.start && lateNight < range.end).toBe(true);
    const nextMorning = new Date("2026-10-31T23:30:00Z"); // 00:30 on 1 Nov Lagos
    expect(nextMorning < range.end).toBe(false);
  });

  it("swaps a reversed range", () => {
    const range = resolveRange("2026-10-20", "2026-10-05");
    expect(range.fromStr).toBe("2026-10-05");
    expect(range.toStr).toBe("2026-10-20");
  });

  it("falls back to defaults for garbage or impossible dates", () => {
    expect(resolveRange("nonsense", "2026-02-31").fromStr).toBe("2026-10-01");
    expect(resolveRange("nonsense", "2026-02-31").toStr).toBe("2026-10-23");
    expect(resolveRange("2026-13-01", undefined).fromStr).toBe("2026-10-01");
  });

  it("keeps a valid 'from' when only 'to' is bad", () => {
    const range = resolveRange("2026-09-10", "garbage");
    expect(range.fromStr).toBe("2026-09-10");
    expect(range.toStr).toBe("2026-10-23");
  });

  it("works for a single day", () => {
    const range = resolveRange("2026-10-10", "2026-10-10");
    expect(range.end.getTime() - range.start.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});