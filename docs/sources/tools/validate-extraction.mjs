#!/usr/bin/env node
// 스캔 추출 JSON 검증 도구. 의존성 없음. 사용: node docs/sources/tools/validate-extraction.mjs <추출.json>
// 형식은 docs/sources/FORMAT.md 참고. 지문 내용은 이 파일에 없다.
import { readFileSync } from "node:fs";

const KINDS = new Set(["vocab", "grammar", "chunk-slash", "underline", "circle", "arrow", "bracket", "insertion", "other"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);

const file = process.argv[2];
if (!file) {
  console.error("사용법: node validate-extraction.mjs <추출.json>");
  process.exit(2);
}

const doc = JSON.parse(readFileSync(file, "utf8"));
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

if (doc.schema_version !== 1) err("root", "schema_version은 1이어야 합니다");
if (!doc.source || typeof doc.source !== "object") err("root", "source가 없습니다");
if (!Array.isArray(doc.passages) || doc.passages.length === 0) err("root", "passages가 비어 있습니다");

const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

/** english에서 anchor의 occurrence번째 위치(없으면 -1). 단어 경계가 맞아야 한다. */
function findAnchor(english, anchor, occurrence) {
  let from = 0;
  let seen = 0;
  for (;;) {
    const i = english.indexOf(anchor, from);
    if (i < 0) return -1;
    from = i + 1;
    const startsOk = !isWordChar(anchor[0]) || !isWordChar(english[i - 1]);
    const endsOk = !isWordChar(anchor[anchor.length - 1]) || !isWordChar(english[i + anchor.length]);
    if (!startsOk || !endsOk) continue;
    seen += 1;
    if (seen === occurrence) return i;
  }
}

const numbers = new Set();
let annotationTotal = 0;
let lowTotal = 0;

for (const p of doc.passages ?? []) {
  const w = `q${p.number}`;
  if (!Number.isInteger(p.number)) err(w, "number가 정수가 아닙니다");
  if (numbers.has(p.number)) err(w, "번호가 중복되었습니다");
  numbers.add(p.number);
  if (typeof p.english !== "string" || p.english.trim() === "") err(w, "english가 비어 있습니다");
  else if (/[①-⑳]/.test(p.english) && !p.printed_markers) {
    // 어법·삽입 문항처럼 원문자가 인쇄된 지문은 정상이다. 손필기가 새어 들어간 경우와 구분하도록 경고만 한다.
    warn(w, 'english에 원문자 번호가 있습니다. 인쇄된 표지라면 passage에 "printed_markers": true를 적고, 손필기가 섞인 것이라면 고치십시오');
  }

  // sentences: en을 공백으로 이으면 english와 같아야 하고, ko_indices가 해석 문장을 빠짐없이 한 번씩 덮어야 한다
  if (!Array.isArray(p.sentences) || p.sentences.length === 0) err(w, "sentences가 비어 있습니다");
  else {
    if (p.sentences.map((s) => s.en).join(" ") !== p.english) err(w, "sentences의 en을 공백으로 이은 값이 english와 다릅니다");
    const used = p.sentences.flatMap((s) => s.ko_indices ?? []).sort((a, b) => a - b);
    const want = (p.korean_sentences ?? []).map((_, i) => i);
    if (JSON.stringify(used) !== JSON.stringify(want)) err(w, "ko_indices가 korean_sentences를 한 번씩 정확히 덮지 않습니다");
    for (const [i, s] of p.sentences.entries()) {
      const joined = (s.ko_indices ?? []).map((j) => p.korean_sentences?.[j]).join(" ");
      if (joined !== s.ko) err(`${w}.sentences[${i}]`, "ko가 ko_indices로 이은 해석과 다릅니다");
    }
  }
  if (typeof p.korean === "string" && Array.isArray(p.korean_sentences) && p.korean_sentences.join(" ") !== p.korean) {
    err(w, "korean_sentences를 공백으로 이은 값이 korean과 다릅니다");
  }

  for (const [i, a] of (p.annotations ?? []).entries()) {
    const aw = `${w}.annotations[${i}]`;
    annotationTotal += 1;
    if (!KINDS.has(a.kind)) err(aw, `kind가 올바르지 않습니다: ${a.kind}`);
    if (!CONFIDENCE.has(a.confidence)) err(aw, `confidence가 올바르지 않습니다: ${a.confidence}`);
    if (a.confidence === "low") lowTotal += 1;
    const occ = a.occurrence ?? 1;
    const at = typeof a.anchor === "string" && a.anchor ? findAnchor(p.english, a.anchor, occ) : -1;
    if (at < 0) err(aw, `anchor를 english에서 찾지 못했습니다(단어 경계 기준): ${JSON.stringify(a.anchor)} #${occ}`);
    else if (Number.isInteger(a.sentence)) {
      // 앵커가 시작하는 문장 번호와 일치해야 한다
      let pos = 0;
      let idx = 0;
      for (const [k, s] of (p.sentences ?? []).entries()) {
        if (at >= pos) idx = k;
        pos += s.en.length + 1;
      }
      if (idx !== a.sentence) err(aw, `sentence(${a.sentence})가 앵커가 시작하는 문장(${idx})과 다릅니다`);
    }
    if (typeof a.text !== "string") err(aw, "text는 문자열이어야 합니다(없으면 빈 문자열)");
  }

  for (const f of p.footnotes ?? []) {
    if (!f.term || !f.gloss) err(w, "footnotes 항목에는 term과 gloss가 필요합니다");
  }
  for (const it of p.italics ?? []) {
    if (!p.english.includes(it)) err(w, `italics 항목이 english에 없습니다: ${it}`);
  }
}

console.log(`지문 ${doc.passages?.length ?? 0}개, 손필기 ${annotationTotal}개(낮은 신뢰도 ${lowTotal}개)`);
for (const x of warnings) console.warn(`경고 - ${x}`);
if (errors.length > 0) {
  console.error(`검증 실패 ${errors.length}건:`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log("검증 통과");
