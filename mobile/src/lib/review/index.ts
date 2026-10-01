import type { ReviewItemType } from "@/db/types";

export type ReviewLevel = 1 | 2 | 3 | 4 | 5;

/** 시험일 기준 복습 시점(며칠 전). 시험일 10/15 → 10/8, 10/12, 10/14. */
export const REVIEW_DAYS_BEFORE_EXAM = [7, 3, 1] as const;

export type ReviewState = {
  itemType: ReviewItemType;
  itemId: number;
  level: ReviewLevel;
  /** ISO 날짜(YYYY-MM-DD) */
  nextDue: string | null;
};

/** 시험일(YYYY-MM-DD)까지 남은 일수. 시험 당일은 0. */
export function daysUntilExam(examDate: string, today: string): number {
  // TODO: 구현
  throw new Error("daysUntilExam: not implemented");
}

/** 시험일 기준 복습 날짜 목록(YYYY-MM-DD, 오름차순). */
export function reviewDates(examDate: string): string[] {
  // TODO: 구현
  throw new Error("reviewDates: not implemented");
}

/** 기준일 이후 가장 가까운 복습 날짜. 없으면 null. */
export function nextReviewDue(examDate: string, today: string): string | null {
  // TODO: 구현
  throw new Error("nextReviewDue: not implemented");
}
