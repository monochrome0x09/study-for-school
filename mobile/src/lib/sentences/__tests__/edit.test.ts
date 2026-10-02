import { mergeWithNext, nonBlank, removeAt, splitAt, updateAt } from "../edit";

const list = ["First one.", "Second one.", "Third."];

test("다음 문장과 합친다", () => {
  expect(mergeWithNext(list, 0)).toEqual(["First one. Second one.", "Third."]);
  expect(mergeWithNext(list, 2)).toEqual(list);
});

test("커서 위치에서 나눈다", () => {
  expect(splitAt(["Hello there. Bye."], 0, 12)).toEqual(["Hello there.", "Bye."]);
  expect(splitAt(list, 0, 0)).toEqual(list);
  expect(splitAt(list, 1, 999)).toEqual(list);
});

test("삭제·수정하고 원본은 그대로다", () => {
  expect(removeAt(list, 1)).toEqual(["First one.", "Third."]);
  expect(updateAt(list, 2, "Third!")).toEqual(["First one.", "Second one.", "Third!"]);
  expect(list).toEqual(["First one.", "Second one.", "Third."]);
});

test("비어 있는 문장은 버린다", () => {
  expect(nonBlank(["a", "  ", "", "b"])).toEqual(["a", "b"]);
});
