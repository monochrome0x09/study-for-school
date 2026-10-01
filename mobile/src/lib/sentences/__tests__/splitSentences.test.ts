import { splitSentences } from "../index";

describe("splitSentences", () => {
  test("마침표·물음표·느낌표 뒤에서 문장을 나눈다", () => {
    expect(
      splitSentences("The cat sat down. Where is the dog? Look at that!"),
    ).toEqual(["The cat sat down.", "Where is the dog?", "Look at that!"]);
  });

  test("약어(Mr., e.g. 등) 뒤의 마침표에서는 나누지 않는다", () => {
    expect(
      splitSentences("Mr. Kim met Dr. Lee in the U.S. last year. Then they left."),
    ).toEqual(["Mr. Kim met Dr. Lee in the U.S. last year.", "Then they left."]);
    expect(splitSentences("Fruits, e.g. apples, are good. Eat them.")).toEqual([
      "Fruits, e.g. apples, are good.",
      "Eat them.",
    ]);
  });

  test("약어로 끝나는 문장은 구분하지 못하고 나누지 않는다(교정 화면에서 고침)", () => {
    expect(splitSentences("He lives in the U.S. Then he left.")).toEqual([
      "He lives in the U.S. Then he left.",
    ]);
  });

  test("소수점과 이니셜은 문장 끝으로 보지 않는다", () => {
    expect(splitSentences("It costs 3.5 dollars. J. Smith agreed.")).toEqual([
      "It costs 3.5 dollars.",
      "J. Smith agreed.",
    ]);
  });

  test("닫는 따옴표·괄호가 붙어도 문장을 나눈다", () => {
    expect(
      splitSentences('She said, "I am tired." Then she slept (quietly). Done.'),
    ).toEqual([
      'She said, "I am tired."',
      "Then she slept (quietly).",
      "Done.",
    ]);
  });

  test("여는 따옴표로 시작하는 문장도 나눈다", () => {
    expect(splitSentences("“Go home.” “No, I won’t.”")).toEqual([
      "“Go home.”",
      "“No, I won’t.”",
    ]);
  });

  test("소문자로 이어지면 나누지 않는다", () => {
    expect(splitSentences("Is it true? maybe so. Yes.")).toEqual([
      "Is it true? maybe so.",
      "Yes.",
    ]);
  });

  test("줄바꿈과 연속 공백을 정리한다", () => {
    expect(
      splitSentences("The first line is  long\nand wraps.\n\nSecond one.\r\n"),
    ).toEqual(["The first line is long and wraps.", "Second one."]);
  });

  test("빈 입력은 빈 배열", () => {
    expect(splitSentences("  \n ")).toEqual([]);
  });

  test("마지막 문장에 종결 부호가 없어도 유지한다", () => {
    expect(splitSentences("One. Two without end")).toEqual([
      "One.",
      "Two without end",
    ]);
  });

  test("추가 약어를 지정할 수 있다", () => {
    expect(splitSentences("See Fig. Two shows it.")).toEqual([
      "See Fig.",
      "Two shows it.",
    ]);
    expect(
      splitSentences("See Fig. Two shows it.", { abbreviations: ["Fig."] }),
    ).toEqual(["See Fig. Two shows it."]);
  });
});
