import { LEVELS, clampLevel } from "../level";

test("단계는 1~5이고 clampLevel은 범위로 맞춘다", () => {
  expect(LEVELS).toEqual([1, 2, 3, 4, 5]);
  expect(clampLevel(0)).toBe(1);
  expect(clampLevel(3)).toBe(3);
  expect(clampLevel(3.9)).toBe(3);
  expect(clampLevel(9)).toBe(5);
});
