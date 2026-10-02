import type { SQLiteDatabase } from "expo-sqlite";

import type { Level } from "@/lib/level";

import type { ReviewItemType, ReviewRow } from "./types";

export async function getReview(
  db: SQLiteDatabase,
  itemType: ReviewItemType,
  itemId: number,
): Promise<ReviewRow | null> {
  return db.getFirstAsync<ReviewRow>(
    "SELECT * FROM review WHERE item_type = ? AND item_id = ?",
    itemType,
    itemId,
  );
}

/**
 * 단계 통과를 기록한다. 이미 더 높은 단계를 통과했다면 낮추지 않는다.
 * nextDue를 주지 않으면 기존 값을 유지한다(복습 일정은 Phase 3에서 채운다).
 */
export async function recordPass(
  db: SQLiteDatabase,
  itemType: ReviewItemType,
  itemId: number,
  level: Level,
  nextDue?: string | null,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO review (item_type, item_id, level, next_due)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_type, item_id) DO UPDATE SET
       level = MAX(review.level, excluded.level),
       next_due = CASE WHEN ? THEN excluded.next_due ELSE review.next_due END`,
    itemType,
    itemId,
    level,
    nextDue ?? null,
    nextDue === undefined ? 0 : 1,
  );
}

/**
 * 단계를 그대로 덮어쓴다(낮출 수 있음). 단어 카드 복습처럼 모르면 1단계로
 * 돌아가는 경우에 쓴다. 지문 통과 기록에는 `recordPass`를 쓴다.
 */
export async function setReviewLevel(
  db: SQLiteDatabase,
  itemType: ReviewItemType,
  itemId: number,
  level: Level,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO review (item_type, item_id, level) VALUES (?, ?, ?)
     ON CONFLICT(item_type, item_id) DO UPDATE SET level = excluded.level`,
    itemType,
    itemId,
    level,
  );
}
