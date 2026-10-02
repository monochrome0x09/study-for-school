import { buildDeck, nextVocabLevel, wordFromToken } from "../index";

test("카드 단계: 알면 +1(최대 5), 모르면 1", () => {
  expect(nextVocabLevel(null, true)).toBe(1);
  expect(nextVocabLevel(2, true)).toBe(3);
  expect(nextVocabLevel(5, true)).toBe(5);
  expect(nextVocabLevel(4, false)).toBe(1);
  expect(nextVocabLevel(null, false)).toBe(1);
});

test("복습 순서: 낮은 단계 먼저, 같은 시드면 같은 순서, 모든 카드 포함", () => {
  const items = [
    { id: 1, level: 3 },
    { id: 2, level: null },
    { id: 3, level: 1 },
    { id: 4, level: null },
    { id: 5, level: 1 },
  ];
  const deck = buildDeck(items, "s");
  expect(deck.map((d) => d.id).sort()).toEqual([1, 2, 3, 4, 5]);
  expect(deck.slice(0, 2).map((d) => d.level)).toEqual([null, null]);
  expect(deck.slice(2, 4).map((d) => d.level)).toEqual([1, 1]);
  expect(deck[4].level).toBe(3);
  expect(buildDeck(items, "s")).toEqual(deck);
});

test("눌린 토큰에서 단어 뽑기", () => {
  expect(wordFromToken('"Garden,')).toBe("garden");
  expect(wordFromToken("well-known.")).toBe("well-known");
  expect(wordFromToken("—")).toBe("");
});
