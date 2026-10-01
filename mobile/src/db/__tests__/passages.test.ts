import { deletePassage, getPassage, insertPassage, listPassages } from "../passages";
import { getSentences } from "../sentences";
import { recordPass } from "../review";
import { countRows, createTestDb } from "../testing/nodeSqlite";
import { upsertVocab } from "../vocab";

const MOCK = {
  track: "학평" as const,
  source_year: 2025,
  source_month: 9,
  source_number: 23,
  body: "One two. Three four.",
};

test("지문과 문장을 저장하고 목록에 문장 수·통과 단계가 나온다", async () => {
  const db = await createTestDb();
  const id = await insertPassage(db, MOCK, [{ en: "One two." }, { en: " Three four. " }, { en: "  " }]);

  expect((await getSentences(db, id)).map((s) => [s.ord, s.en])).toEqual([
    [0, "One two."],
    [1, "Three four."],
  ]);
  expect(await listPassages(db)).toMatchObject([
    { id, sentence_count: 2, level: null, subject: "영어", track: "학평", source_number: 23 },
  ]);

  await recordPass(db, "passage", id, 3);
  expect((await listPassages(db))[0].level).toBe(3);
});

test("메타의 공백 문자열은 null로 저장하고 과목을 지정할 수 있다", async () => {
  const db = await createTestDb();
  const id = await insertPassage(
    db,
    { track: "교과서", source_book: "  ", source_unit: "1과", subject: "한국사", body: "x" },
    [{ en: "x" }],
  );
  expect(await getPassage(db, id)).toMatchObject({
    source_book: null,
    source_unit: "1과",
    subject: "한국사",
  });
  expect(await getPassage(db, 999)).toBeNull();
});

test("저장 중 오류가 나면 지문도 남지 않는다(트랜잭션)", async () => {
  const db = await createTestDb();
  await expect(
    insertPassage(db, { ...MOCK, track: "기타" as never }, [{ en: "a" }]),
  ).rejects.toThrow();
  expect(await countRows(db, "passage")).toBe(0);
  expect(await countRows(db, "sentence")).toBe(0);
});

test("지문 삭제는 문장·단어·문제·복습 기록을 모두 지우고 다른 지문은 건드리지 않는다", async () => {
  const db = await createTestDb();
  const a = await insertPassage(db, MOCK, [{ en: "A one." }, { en: "A two." }]);
  const b = await insertPassage(db, { ...MOCK, source_number: 24 }, [{ en: "B one." }]);
  for (const id of [a, b]) {
    const [s] = await getSentences(db, id);
    const v = await upsertVocab(db, { word: `w${id}`, meaning: "뜻", passage_id: id, sentence_id: s.id });
    await recordPass(db, "passage", id, 2);
    await recordPass(db, "sentence", s.id, 1);
    await recordPass(db, "vocab", v, 1);
    await db.runAsync("INSERT INTO question (passage_id, type, stem) VALUES (?, 'x', 's')", id);
  }

  await deletePassage(db, a);

  expect(await getPassage(db, a)).toBeNull();
  expect(await getSentences(db, a)).toEqual([]);
  expect(await db.getAllAsync("SELECT id FROM vocab WHERE passage_id = ?", a)).toEqual([]);
  expect(await db.getAllAsync("SELECT id FROM question WHERE passage_id = ?", a)).toEqual([]);
  // b의 것은 그대로: 지문 1, 문장 1, 단어 1, 문제 1, 복습 3(passage/sentence/vocab)
  expect(await countRows(db, "passage")).toBe(1);
  expect(await countRows(db, "sentence")).toBe(1);
  expect(await countRows(db, "vocab")).toBe(1);
  expect(await countRows(db, "question")).toBe(1);
  expect(await countRows(db, "review")).toBe(3);
});
