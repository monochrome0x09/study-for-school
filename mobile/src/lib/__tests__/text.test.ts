import { splitToken, splitWords } from "../text";

describe("splitToken", () => {
  test("앞뒤 문장부호를 떼고 단어 안 ' 와 - 는 유지한다", () => {
    expect(splitToken('"well-known,')).toEqual({
      prefix: '"',
      core: "well-known",
      suffix: ",",
    });
    expect(splitToken("It's")).toEqual({ prefix: "", core: "It's", suffix: "" });
  });
});

test("splitWords는 공백·줄바꿈 기준으로 나누고 빈 조각을 버린다", () => {
  expect(splitWords("  a  b\nc ")).toEqual(["a", "b", "c"]);
  expect(splitWords("")).toEqual([]);
});

describe("splitToken: 줄표로 이어진 낱말", () => {
  test("공백 없이 줄표로 이어진 낱말은 첫 낱말만 core이고 나머지는 뒤 문장부호", () => {
    expect(splitToken("despair—a")).toEqual({ prefix: "", core: "despair", suffix: "—a" });
    expect(splitToken("scientists—ordinary")).toEqual({ prefix: "", core: "scientists", suffix: "—ordinary" });
    expect(splitToken("pro–con.")).toEqual({ prefix: "", core: "pro", suffix: "–con." });
  });

  test("하이픈 낱말과 홀로 있는 줄표는 그대로", () => {
    expect(splitToken("ever-changing")).toEqual({ prefix: "", core: "ever-changing", suffix: "" });
    expect(splitToken("—")).toEqual({ prefix: "—", core: "", suffix: "" });
    expect(splitToken("—ordinary")).toEqual({ prefix: "—", core: "ordinary", suffix: "" });
  });
});
