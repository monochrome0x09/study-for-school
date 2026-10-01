import { insertPassage } from "../passages";
import {
  getSentences,
  replaceSentences,
  updateSentenceNotes,
} from "../sentences";
import { createTestDb } from "../testing/nodeSqlite";
import { listVocab, upsertVocab } from "../vocab";

async function setup(sentences: string[]) {
  const db = await createTestDb();
  const id = await insertPassage(db, { track: "교과서", source_unit: "1과", body: sentences.join(" ") }, sentences.map((en) => ({ en })));
  return { db, id };
}

test("해석·메모를 저장하고 공백만 있으면 null로 둔다", async () => {
  const { db, id } = await setup(["A b."]);
  const [s] = await getSentences(db, id);
  await updateSentenceNotes(db, s.id, "해석", "  ");
  expect((await getSentences(db, id))[0]).toMatchObject({ ko: "해석", note: null });
  await updateSentenceNotes(db, s.id, "", "메모");
  expect((await getSentences(db, id))[0]).toMatchObject({ ko: null, note: "메모" });
});

test("교정: 그대로인 문장은 해석·메모를 이어받고, 고친 문장은 비워진다", async () => {
  const { db, id } = await setup(["Keep me.", "Change me."]);
  const [s1, s2] = await getSentences(db, id);
  await updateSentenceNotes(db, s1.id, "유지", "메모1");
  await updateSentenceNotes(db, s2.id, "사라짐", null);

  await replaceSentences(db, id, [{ en: "Keep me." }, { en: "Changed now." }, { en: "Added." }]);

  expect((await getSentences(db, id)).map((s) => [s.ord, s.en, s.ko, s.note])).toEqual([
    [0, "Keep me.", "유지", "메모1"],
    [1, "Changed now.", null, null],
    [2, "Added.", null, null],
  ]);
});

test("교정: 문장 순서가 바뀌거나 합쳐져도 ord가 0부터 다시 매겨진다", async () => {
  const { db, id } = await setup(["One.", "Two.", "Three."]);
  const [, , s3] = await getSentences(db, id);
  await updateSentenceNotes(db, s3.id, "셋", null);

  await replaceSentences(db, id, [{ en: "Three." }, { en: "One. Two." }]);

  const after = await getSentences(db, id);
  expect(after.map((s) => [s.ord, s.en, s.ko])).toEqual([
    [0, "Three.", "셋"],
    [1, "One. Two.", null],
  ]);
});

test("교정: 그대로인 문장을 가리키던 단어는 새 문장으로 옮겨지고, 고친 문장의 단어는 문장 연결만 끊긴다", async () => {
  const { db, id } = await setup(["Keep me.", "Change me."]);
  const [s1, s2] = await getSentences(db, id);
  const keepWord = await upsertVocab(db, { word: "keep", meaning: "유지", passage_id: id, sentence_id: s1.id });
  const changeWord = await upsertVocab(db, { word: "change", meaning: "변경", passage_id: id, sentence_id: s2.id });

  // 문장 id가 재사용되더라도 단어가 올바른 문장을 가리켜야 한다
  await replaceSentences(db, id, [{ en: "Intro." }, { en: "Keep me." }, { en: "Changed." }]);

  const after = await getSentences(db, id);
  const keepNow = after.find((s) => s.en === "Keep me.")!;
  const vocab = await listVocab(db, id);
  expect(vocab.find((v) => v.id === keepWord)?.sentence_id).toBe(keepNow.id);
  // 고친 문장의 단어는 단어 자체는 남고 문장 연결만 끊긴다(다른 문장에 잘못 붙지 않음)
  expect(vocab.find((v) => v.id === changeWord)?.sentence_id).toBeNull();
  expect(vocab).toHaveLength(2);
});

test("교정 저장 중 오류가 나면 기존 문장이 그대로 남는다(트랜잭션)", async () => {
  const { db, id } = await setup(["Keep me.", "Other."]);
  // 새 문장을 넣는 두 번째 INSERT에서 실패시킨다(앞서 DELETE는 이미 실행된 상태)
  const real = db.runAsync.bind(db);
  let inserts = 0;
  db.runAsync = (async (sql: string, ...rest: never[]) => {
    if (sql.startsWith("INSERT INTO sentence") && ++inserts === 2) throw new Error("boom");
    return real(sql, ...rest);
  }) as typeof db.runAsync;

  await expect(replaceSentences(db, id, [{ en: "New one." }, { en: "New two." }])).rejects.toThrow("boom");
  expect((await getSentences(db, id)).map((s) => s.en)).toEqual(["Keep me.", "Other."]);
});
