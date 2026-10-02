import type { SQLiteDatabase } from "expo-sqlite";

import type { Level } from "@/lib/level";
import type { PassageInput } from "@/lib/passage";
import { DEFAULT_SUBJECT } from "@/lib/subject";

import { insertSentences, type SentenceInput } from "./sentences";
import type { PassageRow } from "./types";
import { nullIfBlank } from "./util";

export type PassageListItem = PassageRow & {
  sentence_count: number;
  /** 지금까지 통과한 가장 높은 단계. 기록이 없으면 null. */
  level: Level | null;
};

/** 지문과 문장을 한 트랜잭션으로 저장하고 지문 id를 돌려준다. */
export async function insertPassage(
  db: SQLiteDatabase,
  input: PassageInput,
  sentences: readonly SentenceInput[],
): Promise<number> {
  let passageId = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO passage
         (subject, track, source_school, source_book, source_unit,
          source_year, source_month, source_number, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.subject ?? DEFAULT_SUBJECT,
      input.track,
      nullIfBlank(input.source_school),
      nullIfBlank(input.source_book),
      nullIfBlank(input.source_unit),
      input.source_year ?? null,
      input.source_month ?? null,
      input.source_number ?? null,
      input.body,
    );
    passageId = res.lastInsertRowId;
    await insertSentences(db, passageId, sentences);
  });
  return passageId;
}

export async function listPassages(
  db: SQLiteDatabase,
): Promise<PassageListItem[]> {
  return db.getAllAsync<PassageListItem>(
    `SELECT p.*,
            (SELECT COUNT(*) FROM sentence s WHERE s.passage_id = p.id) AS sentence_count,
            r.level AS level
       FROM passage p
       LEFT JOIN review r ON r.item_type = 'passage' AND r.item_id = p.id
      ORDER BY p.id DESC`,
  );
}

export async function getPassage(
  db: SQLiteDatabase,
  id: number,
): Promise<PassageRow | null> {
  return db.getFirstAsync<PassageRow>("SELECT * FROM passage WHERE id = ?", id);
}

/**
 * 지문과 거기에 딸린 모든 행을 지운다. review는 item_type/item_id 다형 참조라
 * FK 연쇄 삭제가 되지 않으므로 직접 지운다.
 */
export async function deletePassage(
  db: SQLiteDatabase,
  passageId: number,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM review WHERE
         (item_type = 'passage' AND item_id = ?)
      OR (item_type = 'sentence' AND item_id IN (SELECT id FROM sentence WHERE passage_id = ?))
      OR (item_type = 'vocab' AND item_id IN (SELECT id FROM vocab WHERE passage_id = ?))`,
      passageId,
      passageId,
      passageId,
    );
    await db.runAsync("DELETE FROM vocab WHERE passage_id = ?", passageId);
    await db.runAsync("DELETE FROM question WHERE passage_id = ?", passageId);
    await db.runAsync("DELETE FROM sentence WHERE passage_id = ?", passageId);
    await db.runAsync("DELETE FROM passage WHERE id = ?", passageId);
  });
}
