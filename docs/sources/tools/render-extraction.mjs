#!/usr/bin/env node
// 추출 JSON을 사람이 검수하기 쉬운 md, 앱에 붙여넣기용 txt, 검수 목록으로 바꾼다. 의존성 없음.
// 사용: node docs/sources/tools/render-extraction.mjs <추출.json> <출력 폴더>
// 출력: <폴더>/md/qNN.md, <폴더>/txt/qNN.txt, <폴더>/REVIEW.md  (출력은 지문 내용을 담으므로 private 아래에 둔다)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [file, outDir] = process.argv.slice(2);
if (!file || !outDir) {
  console.error("사용법: node render-extraction.mjs <추출.json> <출력 폴더>");
  process.exit(2);
}
const doc = JSON.parse(readFileSync(file, "utf8"));
mkdirSync(join(outDir, "md"), { recursive: true });
mkdirSync(join(outDir, "txt"), { recursive: true });

const KIND_LABEL = {
  vocab: "어휘",
  grammar: "문법",
  "chunk-slash": "끊어 읽기(/)",
  underline: "밑줄",
  circle: "동그라미",
  arrow: "화살표",
  bracket: "괄호",
  insertion: "생략 복원(^)",
  other: "기타",
};
const mark = (a) => (a.confidence === "low" ? " ⚠️(낮은 신뢰도)" : a.confidence === "medium" ? " (보통)" : "");

const review = [];

for (const p of doc.passages) {
  const pad = String(p.number).padStart(2, "0");
  const lines = [];
  lines.push(`# ${doc.source.exam} ${p.number}번 (스캔 ${p.page}쪽)`);
  lines.push("");
  lines.push(`> 인쇄 제목: ${p.printed_title}. AI가 판독한 결과이며 사람의 검수 전입니다. ⚠️ 표시는 원본과 꼭 대조하십시오.`);
  lines.push("");
  for (const n of p.page_notes ?? []) lines.push(`- 쪽 메모(${n.placement}): ${n.text}${n.confidence === "low" ? " ⚠️" : ""}`);
  if ((p.page_notes ?? []).length) lines.push("");
  lines.push("## 문장별");
  lines.push("");
  p.sentences.forEach((s, i) => {
    lines.push(`### ${i + 1}`);
    lines.push("");
    lines.push(`**EN** ${s.en}`);
    lines.push("");
    lines.push(`**KO** ${s.ko}`);
    const anns = p.annotations.filter((a) => a.sentence === i);
    if (anns.length) {
      lines.push("");
      lines.push("손필기:");
      for (const a of anns) {
        const body = a.text ? ` → ${a.text}` : "";
        const note = a.note ? ` _(${a.note})_` : "";
        lines.push(`- [${KIND_LABEL[a.kind] ?? a.kind}] \`${a.anchor}\`${body}${mark(a)}${note}`);
        if (a.confidence === "low") review.push({ number: p.number, page: p.page, sentence: i + 1, a });
      }
    }
    lines.push("");
  });
  if ((p.footnotes ?? []).length) {
    lines.push("## 각주");
    lines.push("");
    for (const f of p.footnotes) lines.push(`- ${f.marker ?? ""}${f.term}: ${f.gloss}`);
    lines.push("");
  }
  if (p.korean_note) {
    lines.push("## 해석 판독 메모");
    lines.push("");
    lines.push(p.korean_note);
    lines.push("");
  }
  writeFileSync(join(outDir, "md", `q${pad}.md`), lines.join("\n"));
  // 앱 지문 등록 화면에 붙여넣을 영문만
  writeFileSync(join(outDir, "txt", `q${pad}.txt`), `${p.english}\n`);
}

const r = [];
r.push(`# 검수 목록 (낮은 신뢰도 ${review.length}개)`);
r.push("");
r.push("AI가 판독하면서 확신하지 못한 손필기입니다. 스캔 원본의 해당 쪽과 대조해 고쳐 주십시오.");
r.push("");
for (const x of review) {
  r.push(`- ${x.number}번(스캔 ${x.page}쪽) 문장 ${x.sentence}: \`${x.a.anchor}\` → ${x.a.text || "(표시만)"} — ${x.a.note ?? ""}`);
}
r.push("");
writeFileSync(join(outDir, "REVIEW.md"), r.join("\n"));
console.log(`지문 ${doc.passages.length}개를 ${outDir}에 변환했습니다. 검수 필요 ${review.length}개`);
