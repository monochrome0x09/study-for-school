import { importPassages } from "../importer";
import { getSentences } from "../sentences";
import { countRows, createTestDb } from "../testing/nodeSqlite";
import { listVocab } from "../vocab";
import { parseImportBundle } from "@/lib/importer";

const parse = (passages: unknown[]) => {
  const r = parseImportBundle(JSON.stringify({ version: 1, passages }));
  expect(r.errors).toEqual([]);
  return r.passages;
};

const mock19 = {
  track: "학평", source_year: 2025, source_month: 9, source_number: 19,
  sentences: [{ en: "One tree.", ko: "나무 하나.", note: "n1" }, { en: "Two trees." }],
  vocab: [{ word: "tree", meaning: "나무", sentence: 0 }, { word: "two", meaning: "둘" }],
};

test("지문·문장·해석·메모·단어를 한 번에 저장하고 단어를 문장에 연결한다", async () => {
  const db = await createTestDb();
  const res = await importPassages(db, parse([mock19]));
  expect(res.imported).toHaveLength(1);
  expect(res.skipped).toEqual([]);
  const id = res.imported[0].id;
  const sents = await getSentences(db, id);
  expect(sents.map((s) => [s.ord, s.en, s.ko, s.note])).toEqual([
    [0, "One tree.", "나무 하나.", "n1"],
    [1, "Two trees.", null, null],
  ]);
  const vocab = await listVocab(db, id);
  const tree = vocab.find((v) => v.word === "tree")!;
  expect(tree.sentence_id).toBe(sents[0].id);
  expect(vocab.find((v) => v.word === "two")!.sentence_id).toBeNull();
});

test("이미 있는 지문은 건너뛰고 사용자가 고친 내용을 지킨다", async () => {
  const db = await createTestDb();
  await importPassages(db, parse([mock19]));
  await db.runAsync("UPDATE sentence SET ko = '내가 고침' WHERE ord = 0");

  const again = await importPassages(db, parse([mock19, { ...mock19, source_number: 20 }]));
  expect(again.skipped).toEqual([{ title: "학평 2025년 9월 19번" }]);
  expect(again.imported.map((x) => x.title)).toEqual(["학평 2025년 9월 20번"]);
  expect(await countRows(db, "passage")).toBe(2);
  const row = await db.getFirstAsync<{ ko: string }>(
    "SELECT ko FROM sentence WHERE ord = 0 ORDER BY id LIMIT 1",
  );
  expect(row!.ko).toBe("내가 고침");
});

test("교과서는 책과 단원이 같으면 중복, 단원이 다르면 별개", async () => {
  const db = await createTestDb();
  const t = (unit: string, book: string | null = "영어2") => ({
    track: "교과서", source_book: book, source_unit: unit, text: "A b.",
  });
  const res = await importPassages(db, parse([t("1과 본문"), t("1과 본문"), t("1과 문화"), t("1과 본문", null)]));
  expect(res.imported.map((x) => x.title)).toEqual(["영어2 1과 본문", "영어2 1과 문화", "1과 본문"]);
  expect(res.skipped).toHaveLength(1);
});

test("같은 묶음 안의 중복도 두 번째는 건너뛴다", async () => {
  const db = await createTestDb();
  const res = await importPassages(db, parse([mock19, mock19]));
  expect(res.imported).toHaveLength(1);
  expect(res.skipped).toHaveLength(1);
  expect(await countRows(db, "passage")).toBe(1);
});

test("저장 중 실패하면 그 지문은 하나도 남지 않는다", async () => {
  const db = await createTestDb();
  // 단어 저장 단계에서 실패하도록 vocab 테이블을 없앤다
  await db.execAsync("DROP TABLE vocab");
  await expect(importPassages(db, parse([mock19]))).rejects.toThrow();
  expect(await countRows(db, "passage")).toBe(0);
  expect(await countRows(db, "sentence")).toBe(0);
});
