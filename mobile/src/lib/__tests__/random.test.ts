import { seededRandom, seededShuffle } from "../random";

describe("seededShuffle", () => {
  test("같은 seed면 같은 순서이고 원본은 그대로다", () => {
    const src = [1, 2, 3, 4, 5, 6];
    expect(seededShuffle(src, "a")).toEqual(seededShuffle(src, "a"));
    expect([...seededShuffle(src, "a")].sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

test("seededRandom은 0 이상 1 미만이고 같은 seed면 같은 수열이다", () => {
  const a = seededRandom("s");
  const b = seededRandom("s");
  for (let i = 0; i < 20; i++) {
    const v = a();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(b()).toBe(v);
  }
});
