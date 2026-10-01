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
