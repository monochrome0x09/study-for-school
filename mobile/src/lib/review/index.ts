import type { ReviewItemType } from "@/db/types";
import type { Level } from "@/lib/level";

/** 시험일 기준 복습 시점(며칠 전). 시험일 10/15 → 10/8, 10/12, 10/14. */
export const REVIEW_DAYS_BEFORE_EXAM = [7, 3, 1] as const;

export type ReviewState = {
  itemType: ReviewItemType;
  itemId: number;
  level: Level;
  /** ISO 날짜(YYYY-MM-DD) */
  nextDue: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD를 시간대와 무관한 일 번호로 바꾼다. 형식이 틀리면 null. */
function dayNumber(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  // 2026-02-31 같은 존재하지 않는 날짜 거르기
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d
  ) {
    return null;
  }
  return ms / DAY_MS;
}

/** 기기 시간대 기준 오늘 날짜(YYYY-MM-DD). `new Date("YYYY-MM-DD")`는 UTC로 해석되므로 쓰지 않는다. */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 날짜 형식(YYYY-MM-DD, 실제로 있는 날짜)인지 확인. */
export function isValidDate(date: string): boolean {
  return dayNumber(date) !== null;
}

/** 시험일(YYYY-MM-DD)까지 남은 일수. 시험 당일은 0, 지났으면 음수. 형식이 틀리면 NaN. */
export function daysUntilExam(examDate: string, today: string): number {
  const e = dayNumber(examDate);
  const t = dayNumber(today);
  if (e === null || t === null) return Number.NaN;
  return e - t;
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
