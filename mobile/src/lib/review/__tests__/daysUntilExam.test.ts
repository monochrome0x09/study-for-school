import { daysUntilExam, isValidDate, todayLocal } from "../index";

describe("daysUntilExam", () => {
  test("시험일까지 남은 일수, 당일은 0, 지나면 음수", () => {
    expect(daysUntilExam("2026-10-15", "2026-10-01")).toBe(14);
    expect(daysUntilExam("2026-10-15", "2026-10-15")).toBe(0);
    expect(daysUntilExam("2026-10-15", "2026-10-16")).toBe(-1);
  });

  test("월 경계를 넘어도 맞다", () => {
    expect(daysUntilExam("2026-10-02", "2026-09-30")).toBe(2);
    expect(daysUntilExam("2027-01-01", "2026-12-31")).toBe(1);
  });

  test("형식이 틀리거나 없는 날짜면 NaN", () => {
    expect(daysUntilExam("2026-10-1", "2026-10-01")).toBeNaN();
    expect(daysUntilExam("2026-02-31", "2026-02-01")).toBeNaN();
  });
});

describe("todayLocal / isValidDate", () => {
  test("기기 시간대 기준 날짜 문자열을 만든다", () => {
    expect(todayLocal(new Date(2026, 9, 1, 23, 59))).toBe("2026-10-01");
    expect(todayLocal(new Date(2026, 0, 5, 0, 0))).toBe("2026-01-05");
  });

  test("날짜 검증", () => {
    expect(isValidDate("2026-10-15")).toBe(true);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("abc")).toBe(false);
  });
});
