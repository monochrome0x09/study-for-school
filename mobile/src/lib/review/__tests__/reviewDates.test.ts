import { nextReviewDue, reviewDates, reviewLabel } from "../index";

describe("reviewDates", () => {
  test("시험일 7·3·1일 전을 오름차순으로 만든다", () => {
    expect(reviewDates("2026-10-15")).toEqual(["2026-10-08", "2026-10-12", "2026-10-14"]);
  });

  test("월·연 경계를 넘어도 맞다", () => {
    expect(reviewDates("2026-10-03")).toEqual(["2026-09-26", "2026-09-30", "2026-10-02"]);
    expect(reviewDates("2027-01-02")).toEqual(["2026-12-26", "2026-12-30", "2027-01-01"]);
  });

  test("윤년 2월을 지난다", () => {
    expect(reviewDates("2028-03-05")).toEqual(["2028-02-27", "2028-03-02", "2028-03-04"]);
  });

  test("시험일 형식이 틀리면 빈 배열", () => {
    expect(reviewDates("2026-10-1")).toEqual([]);
    expect(reviewDates("2026-02-31")).toEqual([]);
  });
});

describe("nextReviewDue", () => {
  const exam = "2026-10-15";

  test("기준일 이후 가장 가까운 복습일", () => {
    expect(nextReviewDue(exam, "2026-10-02")).toBe("2026-10-08");
    expect(nextReviewDue(exam, "2026-10-09")).toBe("2026-10-12");
    expect(nextReviewDue(exam, "2026-10-13")).toBe("2026-10-14");
  });

  test("복습일 당일이면 그 날짜를 돌려준다", () => {
    expect(nextReviewDue(exam, "2026-10-08")).toBe("2026-10-08");
    expect(nextReviewDue(exam, "2026-10-14")).toBe("2026-10-14");
  });

  test("모두 지났으면 null", () => {
    expect(nextReviewDue(exam, "2026-10-15")).toBeNull();
    expect(nextReviewDue(exam, "2026-11-01")).toBeNull();
  });

  test("날짜 형식이 틀리면 null", () => {
    expect(nextReviewDue("bad", "2026-10-02")).toBeNull();
    expect(nextReviewDue(exam, "bad")).toBeNull();
  });
});

describe("reviewLabel", () => {
  test("남은 날짜와 함께 보여준다", () => {
    expect(reviewLabel("2026-10-15", "2026-10-02")).toBe("다음 복습일 10/8 (6일 뒤)");
  });

  test("당일·모두 지남·형식 오류", () => {
    expect(reviewLabel("2026-10-15", "2026-10-12")).toBe("오늘이 복습일입니다 (10/12)");
    expect(reviewLabel("2026-10-15", "2026-10-15")).toBe("남은 복습일 없음");
    expect(reviewLabel("bad", "2026-10-02")).toBeNull();
  });
});
