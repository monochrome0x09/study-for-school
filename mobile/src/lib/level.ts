/** 암기·복습 단계(1~5). 빈칸 단계, 지문 통과 단계, 단어 카드 단계가 모두 이 타입을 쓴다. */
export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

export const MAX_LEVEL: Level = 5;

/** 숫자를 1~5 범위로 맞춰 단계 타입으로 돌려준다(정수로 내림). */
export function clampLevel(n: number): Level {
  return LEVELS[Math.min(MAX_LEVEL, Math.max(1, Math.floor(n))) - 1];
}
