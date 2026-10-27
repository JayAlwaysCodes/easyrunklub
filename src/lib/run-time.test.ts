import { describe, expect, it } from "vitest";

import { lagosDateTimeToDate, occurrenceDate, toLagosInputs } from "./run-time";

describe("lagosDateTimeToDate", () => {
  it("converts Lagos wall-clock time to the right instant (UTC+1)", () => {
    expect(lagosDateTimeToDate("2026-11-07", "06:00")?.toISOString()).toBe(
      "2026-11-07T05:00:00.000Z"
    );
  });

  it("handles midnight and the end of the day", () => {
    expect(lagosDateTimeToDate("2026-11-07", "00:00")?.toISOString()).toBe(
      "2026-11-06T23:00:00.000Z"
    );
    expect(lagosDateTimeToDate("2026-11-07", "23:59")?.toISOString()).toBe(
      "2026-11-07T22:59:00.000Z"
    );
  });

  it("rejects impossible dates instead of rolling them over", () => {
    expect(lagosDateTimeToDate("2026-02-31", "06:00")).toBeNull();
    expect(lagosDateTimeToDate("2026-13-01", "06:00")).toBeNull();
    expect(lagosDateTimeToDate("2026-00-10", "06:00")).toBeNull();
  });

  it("accepts 29 February only in leap years", () => {
    expect(lagosDateTimeToDate("2028-02-29", "06:00")).not.toBeNull();
    expect(lagosDateTimeToDate("2027-02-29", "06:00")).toBeNull();
  });

  it("rejects impossible or malformed times", () => {
    expect(lagosDateTimeToDate("2026-11-07", "24:00")).toBeNull();
    expect(lagosDateTimeToDate("2026-11-07", "12:60")).toBeNull();
    expect(lagosDateTimeToDate("2026-11-07", "6:00")).toBeNull();
    expect(lagosDateTimeToDate("2026-11-07", "")).toBeNull();
    expect(lagosDateTimeToDate("not-a-date", "06:00")).toBeNull();
  });
});

describe("toLagosInputs", () => {
  it("round-trips through lagosDateTimeToDate", () => {
    for (const [date, time] of [
      ["2026-11-07", "06:00"],
      ["2026-12-31", "23:59"],
      ["2027-01-01", "00:00"],
      ["2026-03-29", "12:30"],
    ]) {
      const instant = lagosDateTimeToDate(date, time) as Date;
      expect(toLagosInputs(instant)).toEqual({ date, time });
    }
  });

  it("uses the Lagos date, not the UTC date, near midnight", () => {
    // 23:30 UTC on 23 Oct is already 00:30 on 24 Oct in Lagos.
    expect(toLagosInputs(new Date("2026-10-23T23:30:00Z"))).toEqual({
      date: "2026-10-24",
      time: "00:30",
    });
  });
});

describe("occurrenceDate", () => {
  const first = lagosDateTimeToDate("2026-11-07", "06:00") as Date;

  it("returns the first date unchanged for n = 0", () => {
    for (const frequency of ["WEEKLY", "FORTNIGHTLY", "MONTHLY"] as const) {
      expect(occurrenceDate(first, frequency, 0).getTime()).toBe(first.getTime());
    }
  });

  it("weekly moves 7 days at a time and keeps 06:00 Lagos", () => {
    const third = occurrenceDate(first, "WEEKLY", 3);
    expect(toLagosInputs(third)).toEqual({ date: "2026-11-28", time: "06:00" });
  });

  it("fortnightly moves 14 days at a time", () => {
    const second = occurrenceDate(first, "FORTNIGHTLY", 2);
    expect(toLagosInputs(second)).toEqual({ date: "2026-12-05", time: "06:00" });
  });

  it("monthly keeps the same date and time", () => {
    const fourth = occurrenceDate(first, "MONTHLY", 4);
    expect(toLagosInputs(fourth)).toEqual({ date: "2027-03-07", time: "06:00" });
  });

  it("monthly rolls over the year", () => {
    expect(toLagosInputs(occurrenceDate(first, "MONTHLY", 2))).toEqual({
      date: "2027-01-07",
      time: "06:00",
    });
  });

  it("monthly on the 31st moves to the last day of shorter months, then recovers", () => {
    const jan31 = lagosDateTimeToDate("2027-01-31", "06:00") as Date;
    const dates = [0, 1, 2, 3, 4].map((n) => toLagosInputs(occurrenceDate(jan31, "MONTHLY", n)).date);
    expect(dates).toEqual(["2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30", "2027-05-31"]);
  });

  it("monthly on the 31st uses 29 February in a leap year", () => {
    const jan31 = lagosDateTimeToDate("2028-01-31", "06:00") as Date;
    expect(toLagosInputs(occurrenceDate(jan31, "MONTHLY", 1)).date).toBe("2028-02-29");
  });

  it("monthly at midnight Lagos time keeps the Lagos date", () => {
    const start = lagosDateTimeToDate("2026-11-15", "00:00") as Date;
    expect(toLagosInputs(occurrenceDate(start, "MONTHLY", 1))).toEqual({
      date: "2026-12-15",
      time: "00:00",
    });
  });

  it("generates strictly increasing dates", () => {
    for (const frequency of ["WEEKLY", "FORTNIGHTLY", "MONTHLY"] as const) {
      let previous = 0;
      for (let n = 0; n < 60; n++) {
        const time = occurrenceDate(first, frequency, n).getTime();
        expect(time).toBeGreaterThan(previous);
        previous = time;
      }
    }
  });
});