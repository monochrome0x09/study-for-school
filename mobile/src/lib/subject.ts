/**
 * 영어 전용 기능(문장 해석, 단어장)을 보여줄지 판단하는 곳.
 * 과목 이름 비교는 이 파일에만 두고, 화면은 이 함수만 쓴다(화면 문구에 과목명을 하드코딩하지 않는다).
 */
/** 지문 등록 시 과목 기본값. (DB 스키마의 DEFAULT도 같은 값) */
export const DEFAULT_SUBJECT = "영어";

const TRANSLATION_SUBJECTS: readonly string[] = [DEFAULT_SUBJECT];

export function supportsTranslation(subject: string): boolean {
  return TRANSLATION_SUBJECTS.includes(subject);
}
