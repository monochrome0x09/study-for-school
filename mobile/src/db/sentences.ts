import type { SQLiteDatabase } from "expo-sqlite";

import type { SentenceRow } from "./types";
import { nullIfBlank } from "./util";

/** 문장 저장 입력. ko/note는 비어 있으면 null. */
export type SentenceInput = {
  en: string;
  ko?: string | null;
  note?: string | null;
};

export async function insertSentences(
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
