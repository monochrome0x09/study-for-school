import { LEVELS, type Level } from "@/lib/level";

export const CLOZE_RATIO_MIN = 0.1; // 1단계
export const CLOZE_RATIO_MAX = 0.8; // 5단계

/** 단계별 빈칸 비율. 1단계 10%, 5단계 80%, 사이는 같은 간격. (docs/decisions/0002) */
export function blankRatio(level: Level): number {
  const step = (CLOZE_RATIO_MAX - CLOZE_RATIO_MIN) / (LEVELS.length - 1);
  return CLOZE_RATIO_MIN + step * (level - 1);
}
