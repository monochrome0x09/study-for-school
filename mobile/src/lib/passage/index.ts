import type { PassageRow, Track } from "@/db/types";

export type PassageInput = {
  subject?: string;
  track: Track;
  source_school?: string | null;
  source_book?: string | null;
  source_unit?: string | null;
  source_year?: number | null;
  source_month?: number | null;
  source_number?: number | null;
  body: string;
};

/** 학평 독해 문항 번호 범위(듣기 1~17번 제외). */
export const KOREAN_SAT_MOCK_MIN_NUMBER = 18;
export const KOREAN_SAT_MOCK_MAX_NUMBER = 45;

/** 입력 검증. 문제가 없으면 빈 배열, 있으면 사용자에게 보여줄 메시지 목록. */
export function validatePassageInput(input: PassageInput): string[] {
  const errors: string[] = [];
  if (input.body.trim().length === 0) errors.push("본문을 입력하십시오.");

  if (input.track === "학평") {
    const { source_year: y, source_month: m, source_number: n } = input;
    if (y == null || !Number.isInteger(y) || y < 2000 || y > 2100) {
      errors.push("연도를 4자리 숫자로 입력하십시오.");
    }
    if (m == null || !Number.isInteger(m) || m < 1 || m > 12) {
      errors.push("월을 1~12 사이 숫자로 입력하십시오.");
    }
    if (
      n == null ||
      !Number.isInteger(n) ||
      n < KOREAN_SAT_MOCK_MIN_NUMBER ||
      n > KOREAN_SAT_MOCK_MAX_NUMBER
    ) {
      errors.push(
        `문항 번호를 ${KOREAN_SAT_MOCK_MIN_NUMBER}~${KOREAN_SAT_MOCK_MAX_NUMBER} 사이 숫자로 입력하십시오.`,
      );
    }
  } else if (!input.source_unit?.trim()) {
    errors.push("단원(예: 1과)을 입력하십시오.");
  }
  return errors;
}

type TitleFields = Pick<
  PassageRow,
  | "track"
  | "source_book"
  | "source_unit"
  | "source_year"
  | "source_month"
  | "source_number"
> & { id?: number };

/** 목록·헤더에 보여줄 이름. */
export function passageTitle(p: TitleFields): string {
  if (p.track === "학평") {
    const parts = [
      p.source_year != null ? `${p.source_year}년` : null,
      p.source_month != null ? `${p.source_month}월` : null,
      p.source_number != null ? `${p.source_number}번` : null,
    ].filter((x): x is string => x !== null);
    if (parts.length > 0) return `학평 ${parts.join(" ")}`;
  } else {
    const parts = [p.source_book, p.source_unit]
      .map((x) => x?.trim())
      .filter((x): x is string => !!x);
    if (parts.length > 0) return parts.join(" ");
  }
  return p.id != null ? `지문 ${p.id}` : "지문";
}

/** 지문별 고정 시드. 같은 지문은 항상 같은 빈칸이 나오게 한다. */
export function passageSeed(passageId: number): string {
  return `passage-${passageId}`;
}

/**
 * '이어서 암기하기'로 열 지문. 5단계를 아직 통과하지 못한 지문 중 가장 높은 단계까지 간 것을 고르고,
 * 단계가 같으면 먼저 등록한 것(id가 작은 것)을 고른다. 전부 통과했으면 null.
 */
export function pickContinue<T extends { id: number; level: number | null }>(items: readonly T[]): T | null {
  let best: T | null = null;
  for (const p of items) {
    const lv = p.level ?? 0;
    if (lv >= 5) continue;
    const bestLv = best ? (best.level ?? 0) : -1;
    if (lv > bestLv || (lv === bestLv && p.id < best!.id)) best = p;
  }
  return best;
}
