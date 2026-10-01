/** 암기 난이도. 1단계 10% → 5단계 80%. 중간 비율은 구현 시 정해 docs/decisions/에 기록한다. */
export type ClozeLevel = 1 | 2 | 3 | 4 | 5;

/** 힌트 없음 / 첫글자 / 직접 타이핑 / 문장 순서 맞추기 */
export type ClozeMode = "none" | "firstLetter" | "typing" | "order";

export type ClozeBlank = {
  /** 문장 안의 토큰 위치 */
  tokenIndex: number;
  answer: string;
};

export type ClozeSentence = {
  sentenceIndex: number;
  tokens: string[];
  blanks: ClozeBlank[];
};

export const CLOZE_RATIO_MIN = 0.1; // 1단계
export const CLOZE_RATIO_MAX = 0.8; // 5단계

/** 단계별 빈칸 비율. */
export function blankRatio(level: ClozeLevel): number {
  // TODO: 중간값(2~4단계) 결정 후 구현
  throw new Error("blankRatio: not implemented");
}

/**
 * 문장 목록에서 단계별 빈칸을 만든다. 내용어를 우선하고,
 * 같은 seed(지문별 고정값)이면 항상 같은 빈칸이 나와야 한다.
 */
export function generateCloze(
  sentences: readonly string[],
  level: ClozeLevel,
  seed: number | string,
): ClozeSentence[] {
  // TODO: 구현
  throw new Error("generateCloze: not implemented");
}
