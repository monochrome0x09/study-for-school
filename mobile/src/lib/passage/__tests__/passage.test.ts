import { passageSeed, passageTitle, validatePassageInput } from "../index";

describe("validatePassageInput", () => {
  test("학평은 연도·월·문항 번호(18~45)가 필요하다", () => {
    expect(
      validatePassageInput({
        track: "학평",
        body: "Some text.",
        source_year: 2025,
        source_month: 9,
        source_number: 23,
      }),
    ).toEqual([]);
    expect(validatePassageInput({ track: "학평", body: "x" })).toHaveLength(3);
    expect(
      validatePassageInput({
        track: "학평",
        body: "x",
        source_year: 2025,
        source_month: 9,
        source_number: 10,
      }),
    ).toHaveLength(1);
  });

  test("교과서는 단원이 필요하다", () => {
    expect(validatePassageInput({ track: "교과서", body: "x" })).toHaveLength(1);
    expect(
      validatePassageInput({ track: "교과서", body: "x", source_unit: "1과" }),
    ).toEqual([]);
  });

  test("본문이 비어 있으면 오류", () => {
    expect(
      validatePassageInput({ track: "교과서", body: "  \n", source_unit: "1과" }),
    ).toEqual(["본문을 입력하십시오."]);
  });
});

describe("passageTitle / passageSeed", () => {
  test("트랙별 이름", () => {
    expect(
      passageTitle({
        track: "학평",
        source_book: null,
        source_unit: null,
        source_year: 2025,
        source_month: 9,
        source_number: 23,
      }),
    ).toBe("학평 2025년 9월 23번");
    expect(
      passageTitle({
        track: "교과서",
        source_book: "영어 2",
        source_unit: "1과",
        source_year: null,
        source_month: null,
        source_number: null,
      }),
    ).toBe("영어 2 1과");
  });

  test("메타가 비면 id로 대신하고 시드는 id마다 고정이다", () => {
    expect(
      passageTitle({
        id: 7,
        track: "교과서",
        source_book: null,
        source_unit: null,
        source_year: null,
        source_month: null,
        source_number: null,
      }),
    ).toBe("지문 7");
    expect(passageSeed(7)).toBe(passageSeed(7));
    expect(passageSeed(7)).not.toBe(passageSeed(8));
  });
});
