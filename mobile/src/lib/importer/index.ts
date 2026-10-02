import type { SentenceInput } from "@/db/sentences";
import type { Track } from "@/db/types";
import { passageTitle, validatePassageInput, type PassageInput } from "@/lib/passage";
import { splitSentences } from "@/lib/sentences";

/**
 * 일괄 가져오기 묶음(JSON). 형식 설명은 docs/sources/FORMAT.md의 "가져오기 묶음".
 *
 * { "version": 1, "passages": [{
 *     "track": "교과서" | "학평",
 *     "source_book", "source_unit", "source_year", "source_month", "source_number",
 *     "text": "…"  또는  "sentences": [{ "en", "ko", "note" }],
 *     "vocab": [{ "word", "meaning", "sentence": 0 }]
 * }] }
 */

export const IMPORT_VERSION = 1;

export type ImportVocab = {
  word: string;
  meaning: string;
  /** 연결할 문장의 0부터 시작하는 번호. 없으면 지문에만 연결. */
  sentence?: number;
};

export type ImportPassage = {
  input: PassageInput;
  sentences: SentenceInput[];
  vocab: ImportVocab[];
};

export type ParsedBundle = {
  passages: ImportPassage[];
  /** 하나라도 있으면 가져오지 않는다(일부만 들어가는 일을 막는다). */
  errors: string[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const optString = (v: unknown): string | null | undefined =>
  v === undefined || v === null ? null : typeof v === "string" ? v : undefined;

function optInt(v: unknown): number | null | undefined {
  if (v === undefined || v === null) return null;
  return typeof v === "number" && Number.isInteger(v) ? v : undefined;
}

function parsePassage(raw: unknown, label: string): { value?: ImportPassage; errors: string[] } {
  if (!isObj(raw)) return { errors: [`${label}: 지문이 객체가 아닙니다.`] };
  const errors: string[] = [];

  const track = raw.track;
  if (track !== "교과서" && track !== "학평") {
    return { errors: [`${label}: track은 "교과서" 또는 "학평"이어야 합니다.`] };
  }

  const strFields = ["source_book", "source_unit"] as const;
  const intFields = ["source_year", "source_month", "source_number"] as const;
  const input: PassageInput = { track: track as Track, body: "" };
  for (const k of strFields) {
    const v = optString(raw[k]);
    if (v === undefined) errors.push(`${label}: ${k}는 문자열이어야 합니다.`);
    else input[k] = v;
  }
  for (const k of intFields) {
    const v = optInt(raw[k]);
    if (v === undefined) errors.push(`${label}: ${k}는 정수여야 합니다.`);
    else input[k] = v;
  }

  // 문장: sentences가 있으면 그대로, 없으면 text를 앱의 문장 나누기로 나눈다
  let sentences: SentenceInput[] = [];
  if (raw.sentences !== undefined) {
    if (!Array.isArray(raw.sentences)) {
      errors.push(`${label}: sentences는 배열이어야 합니다.`);
    } else {
      raw.sentences.forEach((s, i) => {
        if (!isObj(s) || typeof s.en !== "string" || !s.en.trim()) {
          errors.push(`${label}: sentences[${i}].en이 비어 있습니다.`);
          return;
        }
        const ko = optString(s.ko);
        const note = optString(s.note);
        if (ko === undefined || note === undefined) {
          errors.push(`${label}: sentences[${i}]의 ko·note는 문자열이어야 합니다.`);
          return;
        }
        sentences.push({ en: s.en.trim(), ko, note });
      });
    }
  } else if (typeof raw.text === "string") {
    sentences = splitSentences(raw.text).map((en) => ({ en }));
  } else {
    errors.push(`${label}: sentences 또는 text가 필요합니다.`);
  }
  if (errors.length === 0 && sentences.length === 0) {
    errors.push(`${label}: 문장이 하나도 없습니다.`);
  }

  input.body = sentences.map((s) => s.en).join(" ");
  if (errors.length === 0) {
    for (const e of validatePassageInput(input)) errors.push(`${label}: ${e}`);
  }

  const vocab: ImportVocab[] = [];
  if (raw.vocab !== undefined) {
    if (!Array.isArray(raw.vocab)) {
      errors.push(`${label}: vocab은 배열이어야 합니다.`);
    } else {
      raw.vocab.forEach((v, i) => {
        if (
          !isObj(v) ||
          typeof v.word !== "string" || !v.word.trim() ||
          typeof v.meaning !== "string" || !v.meaning.trim()
        ) {
          errors.push(`${label}: vocab[${i}]에 word와 meaning이 모두 필요합니다.`);
          return;
        }
        const sentence = optInt(v.sentence);
        if (
          sentence === undefined ||
          (sentence !== null && (sentence < 0 || sentence >= sentences.length))
        ) {
          errors.push(`${label}: vocab[${i}].sentence가 문장 번호 범위를 벗어났습니다.`);
          return;
        }
        vocab.push({
          word: v.word.trim(),
          meaning: v.meaning.trim(),
          ...(sentence === null ? {} : { sentence }),
        });
      });
    }
  }

  return errors.length > 0 ? { errors } : { value: { input, sentences, vocab }, errors };
}

/** 붙여넣은 JSON 문자열을 읽고 검증한다. 오류가 있으면 passages는 비어 있다. */
export function parseImportBundle(text: string): ParsedBundle {
  const fail = (msg: string): ParsedBundle => ({ passages: [], errors: [msg] });
  const trimmed = text.trim();
  if (!trimmed) return fail("붙여넣은 내용이 없습니다.");

  let root: unknown;
  try {
    root = JSON.parse(trimmed);
  } catch {
    return fail("JSON 형식이 아닙니다. 따옴표나 괄호가 빠지지 않았는지, 일부만 복사하지 않았는지 확인하십시오.");
  }
  if (!isObj(root) || root.version !== IMPORT_VERSION) {
    return fail(`가져오기 묶음이 아닙니다(version ${IMPORT_VERSION}이어야 합니다).`);
  }
  if (!Array.isArray(root.passages) || root.passages.length === 0) {
    return fail("passages가 비어 있습니다.");
  }

  const passages: ImportPassage[] = [];
  const errors: string[] = [];
  root.passages.forEach((raw, i) => {
    const r = parsePassage(raw, `${i + 1}번째 지문`);
    errors.push(...r.errors);
    if (r.value) passages.push(r.value);
  });
  return errors.length > 0 ? { passages: [], errors } : { passages, errors };
}

/** 미리보기에 보여줄 한 줄 요약. */
export function summarizeImportPassage(p: ImportPassage): string {
  const ko = p.sentences.filter((s) => s.ko?.trim()).length;
  const note = p.sentences.filter((s) => s.note?.trim()).length;
  const parts = [`${p.sentences.length}문장`];
  if (ko > 0) parts.push(`해석 ${ko}`);
  if (note > 0) parts.push(`메모 ${note}`);
  if (p.vocab.length > 0) parts.push(`단어 ${p.vocab.length}`);
  return parts.join(" · ");
}

export function importPassageTitle(p: ImportPassage): string {
  return passageTitle({
    track: p.input.track,
    source_book: p.input.source_book ?? null,
    source_unit: p.input.source_unit ?? null,
    source_year: p.input.source_year ?? null,
    source_month: p.input.source_month ?? null,
    source_number: p.input.source_number ?? null,
  });
}
