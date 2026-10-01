/** DB 행 타입. 스키마는 db/migrations.ts가 정본이고 설명은 docs/spec.md. */

export type Track = "교과서" | "학평";

export type PassageRow = {
  id: number;
  subject: string;
  track: Track;
  source_school: string | null;
  source_book: string | null;
  source_unit: string | null;
  source_year: number | null;
  source_month: number | null;
  source_number: number | null;
  body: string;
  created_at: string;
};

export type SentenceRow = {
  id: number;
  passage_id: number;
  ord: number;
  en: string;
  ko: string | null;
  note: string | null;
};

export type VocabRow = {
  id: number;
  word: string;
  meaning: string;
  passage_id: number | null;
  sentence_id: number | null;
};

/** 이번 계획에서는 사용하지 않는다. */
export type QuestionRow = {
  id: number;
  passage_id: number;
  type: string;
  stem: string;
  /** JSON 문자열 */
  choices: string | null;
  answer: string | null;
  explanation: string | null;
  tag: string | null;
};

export type ReviewItemType = "passage" | "sentence" | "vocab";

export type ReviewRow = {
  id: number;
  item_type: ReviewItemType;
  item_id: number;
  level: 1 | 2 | 3 | 4 | 5;
  /** ISO 날짜(YYYY-MM-DD) */
  next_due: string | null;
};
