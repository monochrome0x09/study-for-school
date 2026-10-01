import type { SQLiteDatabase } from "expo-sqlite";

import type { PassageInput } from "@/lib/passage";

import type { PassageRow, ReviewRow, SentenceRow } from "./types";

/** 문장 저장 입력. ko/note는 비어 있으면 null. */
export type SentenceInput = {
  en: string;
  ko?: string | null;
  note?: string | null;
};

export type PassageListItem = PassageRow & {
  sentence_count: number;
  /** 지금까지 통과한 가장 높은 단계. 기록이 없으면 null. */
  level: ReviewRow["level"] | null;
};

const nullIfBlank = (s: string | null | undefined): string | null => {
  const t = s?.trim();
  return t ? t : null;
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
       VALUES (COALESCE(?, '영어'), ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.subject ?? null,
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

async function insertSentences(
  db: SQLiteDatabase,
  passageId: number,
  sentences: readonly SentenceInput[],
): Promise<Map<string, number>> {
  const idByEn = new Map<string, number>();
  let ord = 0;
  for (const s of sentences) {
    const en = s.en.trim();
    if (!en) continue;
    const res = await db.runAsync(
      "INSERT INTO sentence (passage_id, ord, en, ko, note) VALUES (?, ?, ?, ?, ?)",
      passageId,
      ord++,
      en,
      nullIfBlank(s.ko),
      nullIfBlank(s.note),
    );
    if (!idByEn.has(en)) idByEn.set(en, res.lastInsertRowId);
  }
  return idByEn;
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

export async function getSentences(
  db: SQLiteDatabase,
  passageId: number,
): Promise<SentenceRow[]> {
  return db.getAllAsync<SentenceRow>(
    "SELECT * FROM sentence WHERE passage_id = ? ORDER BY ord",
    passageId,
  );
}

/**
 * 문장 목록을 통째로 바꾼다(교정 화면 저장). UNIQUE(passage_id, ord) 때문에
 * 제자리 갱신 대신 지우고 다시 넣는다. 영어 문장이 그대로인 문장은 이전의
 * ko/note를 이어받고, 그 문장을 가리키던 단어(vocab.sentence_id)도 새 문장으로 옮긴다.
 * 문장 자체가 고쳐지거나 합쳐진 경우 해당 문장의 ko/note는 입력값을 따른다.
 */
export async function replaceSentences(
  db: SQLiteDatabase,
  passageId: number,
  sentences: readonly SentenceInput[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const old = await getSentences(db, passageId);
    const oldById = new Map(old.map((s) => [s.id, s]));
    const vocab = await db.getAllAsync<{ id: number; sentence_id: number }>(
      "SELECT id, sentence_id FROM vocab WHERE passage_id = ? AND sentence_id IS NOT NULL",
      passageId,
    );
    const oldByEn = new Map<string, SentenceRow>();
    for (const s of old) if (!oldByEn.has(s.en)) oldByEn.set(s.en, s);

    const merged: SentenceInput[] = sentences.map((s) => {
      const prev = oldByEn.get(s.en.trim());
      return prev
        ? { en: s.en, ko: s.ko ?? prev.ko, note: s.note ?? prev.note }
        : s;
    });

    await db.runAsync("DELETE FROM sentence WHERE passage_id = ?", passageId);
    const idByEn = await insertSentences(db, passageId, merged);

    for (const v of vocab) {
      const en = oldById.get(v.sentence_id)?.en;
      const newId = en ? idByEn.get(en) : undefined;
      if (newId !== undefined) {
        await db.runAsync(
          "UPDATE vocab SET sentence_id = ? WHERE id = ?",
          newId,
          v.id,
        );
      }
    }
  });
}

/** 문장의 해석·메모를 사람이 직접 고친다. 빈 문자열은 null로 저장. */
export async function updateSentenceNotes(
  db: SQLiteDatabase,
  sentenceId: number,
  ko: string | null,
  note: string | null,
): Promise<void> {
  await db.runAsync(
    "UPDATE sentence SET ko = ?, note = ? WHERE id = ?",
    nullIfBlank(ko),
    nullIfBlank(note),
    sentenceId,
  );
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
