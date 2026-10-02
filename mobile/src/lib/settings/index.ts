import { isValidDate } from "@/lib/review";

/** 교과서·시험 설정. 비밀 값이 아니므로 키 저장소가 아닌 일반 저장소에 둔다. */
export type StudySettings = {
  /** 예: "NE능률 고2 영어 2" */
  textbook: string;
  /** 시험 범위 설명. 예: "1~2과" */
  scope: string;
  /** YYYY-MM-DD */
  examDate: string;
};

export const DEFAULT_SETTINGS: StudySettings = {
  textbook: "NE능률 고2 영어 2",
  scope: "1~2과",
  examDate: "2026-10-15",
};

/** 저장된 JSON 문자열을 설정으로 바꾼다. 없거나 깨졌으면 기본값, 일부만 틀리면 그 항목만 기본값. */
export function parseSettings(raw: string | null): StudySettings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  const o = (obj && typeof obj === "object" ? obj : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v : fallback;
  const examDate = str(o.examDate, DEFAULT_SETTINGS.examDate);
  return {
    textbook: str(o.textbook, DEFAULT_SETTINGS.textbook),
    scope: str(o.scope, DEFAULT_SETTINGS.scope),
    examDate: isValidDate(examDate) ? examDate : DEFAULT_SETTINGS.examDate,
  };
}

/** 입력 검증. 문제가 없으면 빈 배열. */
export function validateSettings(s: StudySettings): string[] {
  const errors: string[] = [];
  if (!isValidDate(s.examDate)) {
    errors.push("시험일을 YYYY-MM-DD 형식의 실제 날짜로 입력하십시오.");
  }
  return errors;
}

/** 홈 화면용 D-day 문구. 날짜가 잘못되면 null. */
export function ddayLabel(daysLeft: number): string | null {
  if (Number.isNaN(daysLeft)) return null;
  if (daysLeft === 0) return "D-Day";
  return daysLeft > 0 ? `D-${daysLeft}` : `D+${-daysLeft}`;
}
