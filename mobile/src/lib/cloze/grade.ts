import { splitToken } from "@/lib/text";

import type { ClozeSentence } from "./types";

/** 입력과 정답을 비교하기 위한 정규화: 대소문자, 곡선 따옴표, 앞뒤 문장부호·공백을 무시한다. */
export function normalizeAnswer(text: string): string {
  return splitToken(
    text
      .normalize("NFC")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .trim(),
  ).core.toLowerCase();
}

export function isAnswerCorrect(input: string, answer: string): boolean {
  const a = normalizeAnswer(answer);
  return a.length > 0 && normalizeAnswer(input) === a;
}

export type BlankKey = `${number}:${number}`;

/** 빈칸을 가리키는 키(문장 번호:토큰 번호). 입력값 맵의 키로 쓴다. */
export function blankKey(sentenceIndex: number, tokenIndex: number): BlankKey {
  return `${sentenceIndex}:${tokenIndex}`;
}

export type GradeResult = {
  total: number;
  correct: number;
  /** 모든 빈칸이 맞았을 때만 true. 빈칸이 없으면 false. */
  passed: boolean;
  results: Record<BlankKey, boolean>;
};

/** 직접 타이핑 모드 채점. 입력이 없는 빈칸은 틀린 것으로 본다. */
export function gradeBlanks(
  cloze: readonly ClozeSentence[],
  inputs: Partial<Record<BlankKey, string>>,
): GradeResult {
  const results: Record<BlankKey, boolean> = {};
  let total = 0;
  let correct = 0;
  for (const s of cloze) {
    for (const b of s.blanks) {
      const key = blankKey(s.sentenceIndex, b.tokenIndex);
      const ok = isAnswerCorrect(inputs[key] ?? "", b.answer);
      results[key] = ok;
      total += 1;
      if (ok) correct += 1;
    }
  }
  return { total, correct, passed: total > 0 && correct === total, results };
}
