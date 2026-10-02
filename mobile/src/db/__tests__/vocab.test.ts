import { insertPassage } from "../passages";
import { recordPass, setReviewLevel } from "../review";
import { getSentences } from "../sentences";
import { countRows, createTestDb } from "../testing/nodeSqlite";
import { deleteVocab, listVocab, updateVocab, upsertVocab } from "../vocab";

async function setup() {
  const db = await createTestDb();
  const a = await insertPassage(db, { track: "교과서", source_unit: "1과", body: "x" }, [{ en: "Garden one." }]);
  const b = await insertPassage(db, { track: "교과서", source_unit: "2과", body: "y" }, [{ en: "Garden two." }]);
  return { db, a, b };
}

test("같은 지문의 같은 단어는 대소문자를 무시하고 뜻만 갱신한다", async () => {
  const { db, a } = await setup();
  const [s] = await getSentences(db, a);
  const first = await upsertVocab(db, { word: " Garden ", meaning: "정원", passage_id: a, sentence_id: s.id });
  const again = await upsertVocab(db, { word: "garden", meaning: "뜰", passage_id: a });
  expect(again).toBe(first);
  const rows = await listVocab(db, a);
  expect(rows).toHaveLength(1);
  // 단어 철자는 처음 등록한 그대로, 뜻은 갱신, 문장 연결은 유지
  expect(rows[0]).toMatchObject({ word: "Garden", meaning: "뜰", sentence_id: s.id, level: null });
});

test("다른 지문이나 지문 없는 단어는 별개로 등록된다", async () => {
  const { db, a, b } = await setup();
  const ids = [
    await upsertVocab(db, { word: "garden", meaning: "1", passage_id: a }),
    await upsertVocab(db, { word: "garden", meaning: "2", passage_id: b }),
    await upsertVocab(db, { word: "garden", meaning: "3" }),
    await upsertVocab(db, { word: "Garden", meaning: "4" }),
  ];
  expect(new Set(ids).size).toBe(3); // 지문 없는 두 단어는 같은 항목
  expect(await listVocab(db)).toHaveLength(3);
  expect(await listVocab(db, a)).toHaveLength(1);
  expect(await listVocab(db, b)).toHaveLength(1);
});

test("단어나 뜻이 비어 있으면 거부한다", async () => {
  const { db, a } = await setup();
  await expect(upsertVocab(db, { word: " ", meaning: "뜻", passage_id: a })).rejects.toThrow();
  await expect(upsertVocab(db, { word: "w", meaning: " ", passage_id: a })).rejects.toThrow();
  await expect(updateVocab(db, 1, "", "뜻")).rejects.toThrow();
  expect(await countRows(db, "vocab")).toBe(0);
});

test("수정은 공백을 다듬고 목록에 복습 단계가 붙는다", async () => {
  const { db, a } = await setup();
  const id = await upsertVocab(db, { word: "w", meaning: "m", passage_id: a });
  await updateVocab(db, id, " yard ", " 마당 ");
  await setReviewLevel(db, "vocab", id, 4);
  expect((await listVocab(db))[0]).toMatchObject({ word: "yard", meaning: "마당", level: 4 });
});

test("단어를 지우면 그 단어의 복습 기록만 함께 지워진다", async () => {
  const { db, a } = await setup();
  const v1 = await upsertVocab(db, { word: "one", meaning: "1", passage_id: a });
  const v2 = await upsertVocab(db, { word: "two", meaning: "2", passage_id: a });
  await recordPass(db, "vocab", v1, 1);
  await recordPass(db, "vocab", v2, 2);
  await recordPass(db, "passage", a, 3);

  await deleteVocab(db, v1);

  expect((await listVocab(db)).map((v) => v.id)).toEqual([v2]);
  expect(await countRows(db, "review")).toBe(2); // v2 + passage
});
