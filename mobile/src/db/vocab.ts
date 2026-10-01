import type { SQLiteDatabase } from "expo-sqlite";

import type { ReviewRow, VocabRow } from "./types";

export type VocabInput = {
  word: string;
  meaning: string;
  passage_id?: number | null;
  sentence_id?: number | null;
};

export type VocabListItem = VocabRow & {
  /** 카드 복습에서 쌓은 단계(1~5). 아직 복습하지 않았으면 null. */
  level: ReviewRow["level"] | null;
};

/**
 * 단어를 등록한다. 같은 지문에 같은 단어(대소문자 무시)가 이미 있으면
 * 새로 만들지 않고 뜻만 갱신한다. 등록·갱신된 행의 id를 돌려준다.
 */
export async function upsertVocab(
  db: SQLiteDatabase,
  input: VocabInput,
): Promise<number> {
  const word = input.word.trim();
  const meaning = input.meaning.trim();
  if (!word || !meaning) throw new Error("단어와 뜻을 모두 입력하십시오.");

  const passageId = input.passage_id ?? null;
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM vocab
      WHERE lower(word) = lower(?) AND passage_id IS ?`,
    word,
    passageId,
  );
  if (existing) {
    await db.runAsync(
      "UPDATE vocab SET meaning = ?, sentence_id = COALESCE(?, sentence_id) WHERE id = ?",
      meaning,
      input.sentence_id ?? null,
      existing.id,
    );
    return existing.id;
  }
  const res = await db.runAsync(
    "INSERT INTO vocab (word, meaning, passage_id, sentence_id) VALUES (?, ?, ?, ?)",
    word,
    meaning,
    passageId,
    input.sentence_id ?? null,
  );
  return res.lastInsertRowId;
}

export async function listVocab(
  db: SQLiteDatabase,
  passageId?: number,
): Promise<VocabListItem[]> {
  return db.getAllAsync<VocabListItem>(
    `SELECT v.*, r.level AS level
       FROM vocab v
       LEFT JOIN review r ON r.item_type = 'vocab' AND r.item_id = v.id
      WHERE (? IS NULL OR v.passage_id = ?)
      ORDER BY v.id DESC`,
    passageId ?? null,
    passageId ?? null,
  );
}

export async function updateVocab(
  db: SQLiteDatabase,
  id: number,
  word: string,
  meaning: string,
): Promise<void> {
  if (!word.trim() || !meaning.trim()) {
    throw new Error("단어와 뜻을 모두 입력하십시오.");
  }
  await db.runAsync(
    "UPDATE vocab SET word = ?, meaning = ? WHERE id = ?",
    word.trim(),
    meaning.trim(),
    id,
  );
}

/** 단어와 그 복습 기록을 함께 지운다(review는 FK 연쇄 삭제가 안 된다). */
export async function deleteVocab(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "DELETE FROM review WHERE item_type = 'vocab' AND item_id = ?",
      id,
    );
    await db.runAsync("DELETE FROM vocab WHERE id = ?", id);
  });
}
