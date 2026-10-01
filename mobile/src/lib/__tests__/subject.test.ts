import { supportsTranslation } from "../subject";

test("영어 전용 기능은 영어 과목에서만 켜진다", () => {
  expect(supportsTranslation("영어")).toBe(true);
  expect(supportsTranslation("한국사")).toBe(false);
  expect(supportsTranslation("")).toBe(false);
});
