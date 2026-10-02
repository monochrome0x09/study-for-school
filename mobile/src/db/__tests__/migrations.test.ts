import { DATABASE_VERSION, migrateDbIfNeeded } from "../migrations";
import { createTestDb } from "../testing/nodeSqlite";

test("마이그레이션은 user_version을 올리고 다시 실행해도 안전하다", async () => {
  const db = await createTestDb();
  const version = async () =>
    (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))
      ?.user_version;
  expect(await version()).toBe(DATABASE_VERSION);
  await migrateDbIfNeeded(db);
  expect(await version()).toBe(DATABASE_VERSION);
});

test("5개 테이블이 만들어진다", async () => {
  const db = await createTestDb();
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  expect(rows.map((r) => r.name)).toEqual([
    "passage",
    "question",
    "review",
    "sentence",
    "vocab",
  ]);
});

test("제약 조건: 잘못된 트랙·단계와 없는 지문 참조를 거부한다", async () => {
  const db = await createTestDb();
  await expect(
    db.runAsync("INSERT INTO passage (track, body) VALUES ('기타', 'x')"),
  ).rejects.toThrow();
  await expect(
    db.runAsync(
      "INSERT INTO review (item_type, item_id, level) VALUES ('passage', 1, 6)",
    ),
  ).rejects.toThrow();
  // foreign_keys가 켜져 있어야 한다
  await expect(
    db.runAsync(
      "INSERT INTO sentence (passage_id, ord, en) VALUES (999, 0, 'x')",
    ),
  ).rejects.toThrow();
});
