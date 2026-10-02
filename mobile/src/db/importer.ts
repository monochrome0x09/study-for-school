import type { SQLiteDatabase } from "expo-sqlite";

import { importPassageTitle, type ImportPassage } from "@/lib/importer";
import { DEFAULT_SUBJECT } from "@/lib/subject";

import { insertPassageRow } from "./passages";
import { getSentences, insertSentences } from "./sentences";
import { nullIfBlank } from "./util";
import { upsertVocab } from "./vocab";

export type ImportResult = {
  /** 새로 등록한 지문 id */
  imported: { id: number; title: string }[];
  /** 이미 있어서 건드리지 않은 지문 */
  skipped: { title: string }[];
};

/** 같은 출처(교과서: 책+단원, 학평: 연·월·번호)의 지문이 이미 있는지. */
async function exists(db: SQLiteDatabase, p: ImportPassage): Promise<boolean> {
  const i = p.input;
  const row =
    i.track === "학평"
      ? await db.getFirstAsync<{ id: number }>(
          `SELECT id FROM passage
            WHERE subject = ? AND track = '학평'
              AND source_year IS ? AND source_month IS ? AND source_number IS ?`,
          i.subject ?? DEFAULT_SUBJECT,
          i.source_year ?? null,
          i.source_month ?? null,
          i.source_number ?? null,
        )
      : await db.getFirstAsync<{ id: number }>(
          `SELECT id FROM passage
            WHERE subject = ? AND track = '교과서'
              AND source_book IS ? AND source_unit IS ?`,
          i.subject ?? DEFAULT_SUBJECT,
          nullIfBlank(i.source_book),
          nullIfBlank(i.source_unit),
        );
  return row !== null;
}

/**
 * 검증된 묶음을 저장한다. 이미 있는 지문은 덮어쓰지 않고 건너뛴다(사용자가
 * 앱에서 고친 해석·메모를 지키기 위해). 지문마다 한 트랜잭션이라 지문 하나는
 * 전부 들어가거나 하나도 안 들어간다.
 */
export async function importPassages(
  db: SQLiteDatabase,
  passages: readonly ImportPassage[],
): Promise<ImportResult> {
  const result: ImportResult = { imported: [], skipped: [] };
  for (const p of passages) {
    const title = importPassageTitle(p);
    if (await exists(db, p)) {
      result.skipped.push({ title });
      continue;
    }
    let id = 0;
    await db.withTransactionAsync(async () => {
      id = await insertPassageRow(db, p.input);
      await insertSentences(db, id, p.sentences);
      if (p.vocab.length > 0) {
        // 검증 단계에서 빈 문장을 거부했으므로 ord == 입력 순서
        const saved = await getSentences(db, id);
        for (const v of p.vocab) {
          await upsertVocab(db, {
            word: v.word,
            meaning: v.meaning,
            passage_id: id,
            sentence_id: v.sentence === undefined ? null : saved[v.sentence].id,
          });
        }
      }
    });
    result.imported.push({ id, title });
  }
  return result;
}
