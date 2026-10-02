import { importPassageTitle, parseImportBundle, summarizeImportPassage } from "../index";

const bundle = (passages: unknown[]) => JSON.stringify({ version: 1, passages });

describe("parseImportBundle", () => {
  test("문장·해석·메모·단어가 있는 학평 지문을 읽는다", () => {
    const r = parseImportBundle(
      bundle([
        {
          track: "학평",
          source_year: 2025,
          source_month: 9,
          source_number: 19,
          sentences: [
            { en: "First one.", ko: "첫째.", note: "메모" },
            { en: " Second one. " },
          ],
          vocab: [{ word: "one", meaning: "하나", sentence: 1 }, { word: "two", meaning: "둘" }],
        },
      ]),
    );
    expect(r.errors).toEqual([]);
    const p = r.passages[0];
    expect(p.input).toMatchObject({ track: "학평", source_year: 2025, source_month: 9, source_number: 19 });
    expect(p.input.body).toBe("First one. Second one.");
    expect(p.sentences).toEqual([
      { en: "First one.", ko: "첫째.", note: "메모" },
      { en: "Second one.", ko: null, note: null },
    ]);
    expect(p.vocab).toEqual([{ word: "one", meaning: "하나", sentence: 1 }, { word: "two", meaning: "둘" }]);
    expect(summarizeImportPassage(p)).toBe("2문장 · 해석 1 · 메모 1 · 단어 2");
    expect(importPassageTitle(p)).toBe("학평 2025년 9월 19번");
  });

  test("text만 있으면 앱의 문장 나누기로 나눈다", () => {
    const r = parseImportBundle(
      bundle([{ track: "교과서", source_unit: "1과", text: "Dr. Kim ran. She won!" }]),
    );
    expect(r.errors).toEqual([]);
    expect(r.passages[0].sentences.map((s) => s.en)).toEqual(["Dr. Kim ran.", "She won!"]);
  });

  test("교과서 지문의 이름은 책과 단원", () => {
    const r = parseImportBundle(
      bundle([{ track: "교과서", source_book: "영어2", source_unit: "1과 본문", text: "A b." }]),
    );
    expect(importPassageTitle(r.passages[0])).toBe("영어2 1과 본문");
  });

  test.each([
    ["빈 입력", "  ", "붙여넣은 내용이 없습니다"],
    ["JSON이 아님", "{abc", "JSON 형식이 아닙니다"],
    ["version 없음", JSON.stringify({ passages: [] }), "version"],
    ["다른 version", JSON.stringify({ version: 2, passages: [{}] }), "version"],
    ["passages 비어 있음", bundle([]), "passages가 비어"],
  ])("묶음 수준 오류: %s", (_n, text, msg) => {
    const r = parseImportBundle(text);
    expect(r.passages).toEqual([]);
    expect(r.errors.join("\n")).toContain(msg);
  });

  test.each([
    ["track 없음", { text: "A b." }, "track"],
    ["문장도 text도 없음", { track: "교과서", source_unit: "1과" }, "sentences 또는 text"],
    ["문장이 빈 배열", { track: "교과서", source_unit: "1과", sentences: [] }, "문장이 하나도 없습니다"],
    ["en이 빈 문장", { track: "교과서", source_unit: "1과", sentences: [{ en: " " }] }, "sentences[0].en"],
    ["ko가 문자열이 아님", { track: "교과서", source_unit: "1과", sentences: [{ en: "A.", ko: 3 }] }, "ko·note"],
    ["교과서에 단원 없음", { track: "교과서", text: "A b." }, "단원"],
    ["학평 연도 없음", { track: "학평", source_month: 9, source_number: 19, text: "A b." }, "연도"],
    ["학평 번호 범위 밖", { track: "학평", source_year: 2025, source_month: 9, source_number: 5, text: "A b." }, "문항 번호"],
    ["연도가 문자열", { track: "학평", source_year: "2025", source_month: 9, source_number: 19, text: "A b." }, "source_year는 정수"],
    ["단어에 뜻 없음", { track: "교과서", source_unit: "1과", text: "A b.", vocab: [{ word: "a" }] }, "vocab[0]"],
    ["단어의 문장 번호 초과", { track: "교과서", source_unit: "1과", text: "A b.", vocab: [{ word: "a", meaning: "가", sentence: 1 }] }, "문장 번호 범위"],
  ])("지문 오류: %s", (_n, passage, msg) => {
    const r = parseImportBundle(bundle([passage]));
    expect(r.passages).toEqual([]);
    expect(r.errors.join("\n")).toContain(msg);
  });

  test("하나라도 틀리면 올바른 지문도 가져오지 않고 위치를 알려준다", () => {
    const r = parseImportBundle(
      bundle([
        { track: "교과서", source_unit: "1과", text: "A b." },
        { track: "교과서", text: "A b." },
      ]),
    );
    expect(r.passages).toEqual([]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toContain("2번째 지문");
  });
});
