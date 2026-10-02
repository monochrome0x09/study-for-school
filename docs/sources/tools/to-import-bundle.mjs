#!/usr/bin/env node
// 스캔 추출 JSON(FORMAT.md)을 앱의 "일괄 가져오기" 묶음으로 바꾼다. 의존성 없음.
// 사용: node docs/sources/tools/to-import-bundle.mjs <추출.json> <출력 폴더> --year 2025 --month 9 [--vocab]
//   --year/--month  추출 JSON의 source에 연도가 없으면(스캔에 적혀 있지 않음) 직접 지정해야 한다.
//   --vocab         한글 뜻이 있는(낮은 신뢰도 제외) 손필기 어휘와 각주 풀이를 단어장 항목으로 함께 만든다.
// 출력: <폴더>/all.json(전체), <폴더>/qNN.json(지문별). 출력은 지문 내용을 담으므로 private 아래에 둔다.
// 손필기 중 글자가 없는 표시(밑줄·동그라미·끊어 읽기·괄호)는 문장 메모에 넣지 않는다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
// 값이 있는 옵션 읽기
function opt(name) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}
const withVocab = args.includes("--vocab") && (args.splice(args.indexOf("--vocab"), 1), true);
const yearArg = opt("--year");
const monthArg = opt("--month");
const [file, outDir] = args;
if (!file || !outDir || args.length !== 2) {
  console.error("사용법: node to-import-bundle.mjs <추출.json> <출력 폴더> --year YYYY --month M [--vocab]");
  process.exit(2);
}

const doc = JSON.parse(readFileSync(file, "utf8"));
const toInt = (v) => (v !== undefined && /^\d+$/.test(v) ? Number(v) : null);
const year = toInt(yearArg) ?? doc.source?.year ?? null;
const month = toInt(monthArg) ?? doc.source?.month ?? (/^(\d+)월/.exec(doc.source?.exam ?? "")?.[1] ? Number(/^(\d+)월/.exec(doc.source.exam)[1]) : null);
if (doc.source?.track === "학평" || doc.source?.track === undefined) {
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    console.error("연도·월을 알 수 없습니다. --year와 --month로 지정하십시오.");
    process.exit(2);
  }
}

const KIND_LABEL = {
  vocab: "어휘", grammar: "문법", "chunk-slash": "끊어 읽기", underline: "밑줄", circle: "동그라미",
  arrow: "화살표", bracket: "괄호", insertion: "생략 복원", other: "기타",
};
const HANGUL = /[가-힣]/;
const suffix = (a) => (a.confidence === "low" ? " (?)" : "");

let omittedMarks = 0;
let lowKept = 0;
const passages = doc.passages.map((p) => {
  const sentences = p.sentences.map((s, i) => {
    const lines = [];
    for (const a of p.annotations.filter((x) => x.sentence === i)) {
      if (!a.text) { omittedMarks++; continue; }
      if (a.confidence === "low") lowKept++;
      lines.push(`${KIND_LABEL[a.kind] ?? a.kind} ${a.anchor}: ${a.text}${suffix(a)}`);
    }
    const out = { en: s.en };
    if (s.ko) out.ko = s.ko;
    if (lines.length) out.note = lines.join("\n");
    return out;
  });

  const vocab = [];
  if (withVocab) {
    const seen = new Set();
    const add = (word, meaning, sentence) => {
      const key = word.trim().toLowerCase();
      if (!word.trim() || !meaning.trim() || seen.has(key)) return;
      seen.add(key);
      vocab.push(sentence === undefined ? { word, meaning } : { word, meaning, sentence });
    };
    for (const f of p.footnotes ?? []) add(f.term, f.gloss);
    for (const a of p.annotations) {
      if (a.kind === "vocab" && a.confidence !== "low" && HANGUL.test(a.text ?? "")) add(a.anchor, a.text, a.sentence);
    }
  }

  return {
    track: "학평",
    source_year: year,
    source_month: month,
    source_number: p.number,
    sentences,
    ...(vocab.length ? { vocab } : {}),
  };
});

mkdirSync(outDir, { recursive: true });
const wrap = (list) => JSON.stringify({ version: 1, passages: list }, null, 1);
writeFileSync(join(outDir, "all.json"), wrap(passages));
for (const p of passages) writeFileSync(join(outDir, `q${String(p.source_number).padStart(2, "0")}.json`), wrap([p]));
console.log(
  `지문 ${passages.length}개를 ${outDir}에 만들었습니다. 연도 ${year} 월 ${month}. ` +
    `메모에서 뺀 표시 ${omittedMarks}개, 낮은 신뢰도 메모 ${lowKept}개(? 표시)` +
    (withVocab ? `, 단어 ${passages.reduce((n, p) => n + (p.vocab?.length ?? 0), 0)}개` : ""),
);
