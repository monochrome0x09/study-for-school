import {
  DEFAULT_SETTINGS,
  ddayLabel,
  parseSettings,
  validateSettings,
} from "../index";

describe("parseSettings", () => {
  test("없거나 깨졌으면 기본값", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("{oops")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("123")).toEqual(DEFAULT_SETTINGS);
  });

  test("저장된 값을 읽고 잘못된 항목만 기본값으로 되돌린다", () => {
    expect(
      parseSettings(JSON.stringify({ textbook: "A", scope: "3과", examDate: "2026-11-01" })),
    ).toEqual({ textbook: "A", scope: "3과", examDate: "2026-11-01" });
    expect(parseSettings(JSON.stringify({ textbook: "A", examDate: "nope" }))).toEqual({
      textbook: "A",
      scope: DEFAULT_SETTINGS.scope,
      examDate: DEFAULT_SETTINGS.examDate,
    });
  });
});

describe("validateSettings / ddayLabel", () => {
  test("시험일 검증", () => {
    expect(validateSettings(DEFAULT_SETTINGS)).toEqual([]);
    expect(validateSettings({ ...DEFAULT_SETTINGS, examDate: "2026-02-30" })).toHaveLength(1);
  });

  test("D-day 문구", () => {
    expect(ddayLabel(14)).toBe("D-14");
    expect(ddayLabel(0)).toBe("D-Day");
    expect(ddayLabel(-2)).toBe("D+2");
    expect(ddayLabel(Number.NaN)).toBeNull();
  });
});
