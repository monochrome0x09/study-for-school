import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "study.db";

/**
 * 버전별 마이그레이션. 인덱스 0 = 버전 1.
 * 이미 배포된 단계는 수정하지 않고 뒤에 새 항목을 추가한다.
 * `order`는 SQLite 예약어이므로 sentence의 순서 컬럼명은 `ord`로 둔다.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE passage (
    id             INTEGER PRIMARY KEY NOT NULL,
    subject        TEXT NOT NULL DEFAULT '영어',
    track          TEXT NOT NULL CHECK (track IN ('교과서', '학평')),
    source_school  TEXT,
    source_book    TEXT,
    source_unit    TEXT,
    source_year    INTEGER,
    source_month   INTEGER,
    source_number  INTEGER,
    body           TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sentence (
    id          INTEGER PRIMARY KEY NOT NULL,
    passage_id  INTEGER NOT NULL REFERENCES passage(id) ON DELETE CASCADE,
    ord         INTEGER NOT NULL,
    en          TEXT NOT NULL,
    ko          TEXT,
    note        TEXT,
    UNIQUE (passage_id, ord)
  );

  CREATE TABLE vocab (
    id          INTEGER PRIMARY KEY NOT NULL,
    word        TEXT NOT NULL,
    meaning     TEXT NOT NULL,
    passage_id  INTEGER REFERENCES passage(id) ON DELETE CASCADE,
    sentence_id INTEGER REFERENCES sentence(id) ON DELETE SET NULL
  );

  -- 이번 계획에서는 사용하지 않는다. 스키마만 유지.
  CREATE TABLE question (
    id          INTEGER PRIMARY KEY NOT NULL,
    passage_id  INTEGER NOT NULL REFERENCES passage(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    stem        TEXT NOT NULL,
    choices     TEXT,
    answer      TEXT,
    explanation TEXT,
    tag         TEXT
  );

  -- 단일 사용자 전제. user_id 없음.
  CREATE TABLE review (
    id         INTEGER PRIMARY KEY NOT NULL,
    item_type  TEXT NOT NULL CHECK (item_type IN ('passage', 'sentence', 'vocab')),
    item_id    INTEGER NOT NULL,
    level      INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    next_due   TEXT,
    UNIQUE (item_type, item_id)
  );

  CREATE INDEX idx_sentence_passage ON sentence(passage_id);
  CREATE INDEX idx_vocab_passage ON vocab(passage_id);
  CREATE INDEX idx_review_due ON review(next_due);
  `,
];

export const DATABASE_VERSION = MIGRATIONS.length;

/** SQLiteProvider의 onInit에 넘긴다. PRAGMA user_version으로 적용 여부를 판단한다. */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  for (let v = current; v < DATABASE_VERSION; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
