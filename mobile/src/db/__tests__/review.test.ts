import { getReview, recordPass, setReviewLevel } from "../review";
import { countRows, createTestDb } from "../testing/nodeSqlite";

test("통과 기록은 더 낮은 단계로 되돌리지 않는다", async () => {
  const db = await createTestDb();
  await recordPass(db, "passage", 1, 3);
  await recordPass(db, "passage", 1, 2);
  expect((await getReview(db, "passage", 1))?.level).toBe(3);
  await recordPass(db, "passage", 1, 5);
  expect((await getReview(db, "passage", 1))?.level).toBe(5);
  expect(await countRows(db, "review")).toBe(1);
});

test("next_due는 값을 주면 갱신, 주지 않으면 유지, null을 주면 지운다", async () => {
  const db = await createTestDb();
  await recordPass(db, "passage", 1, 1, "2026-10-08");
  expect((await getReview(db, "passage", 1))?.next_due).toBe("2026-10-08");
  await recordPass(db, "passage", 1, 2);
  expect((await getReview(db, "passage", 1))?.next_due).toBe("2026-10-08");
  await recordPass(db, "passage", 1, 3, "2026-10-12");
  expect((await getReview(db, "passage", 1))?.next_due).toBe("2026-10-12");
  await recordPass(db, "passage", 1, 3, null);
  expect((await getReview(db, "passage", 1))?.next_due).toBeNull();
});

test("항목 종류와 id가 같아야 같은 기록이다", async () => {
  const db = await createTestDb();
  await recordPass(db, "passage", 1, 2);
  await recordPass(db, "sentence", 1, 3);
  await recordPass(db, "vocab", 1, 4);
  expect(await countRows(db, "review")).toBe(3);
  expect((await getReview(db, "sentence", 1))?.level).toBe(3);
  expect(await getReview(db, "passage", 2)).toBeNull();
});

test("setReviewLevel은 단계를 낮출 수도 있다", async () => {
  const db = await createTestDb();
  await setReviewLevel(db, "vocab", 7, 4);
  await setReviewLevel(db, "vocab", 7, 1);
  expect((await getReview(db, "vocab", 7))?.level).toBe(1);
});

test("범위를 벗어난 단계는 DB가 거부한다", async () => {
  const db = await createTestDb();
  await expect(recordPass(db, "passage", 1, 6 as never)).rejects.toThrow();
  await expect(setReviewLevel(db, "passage", 1, 0 as never)).rejects.toThrow();
});
