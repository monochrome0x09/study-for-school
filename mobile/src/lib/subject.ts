/**
 * 영어 전용 기능(문장 해석, 단어장)을 보여줄지 판단하는 곳.
 * 과목 이름 비교는 이 파일에만 두고, 화면은 이 함수만 쓴다(화면 문구에 과목명을 하드코딩하지 않는다).
 */
const TRANSLATION_SUBJECTS: readonly string[] = ["영어"];

export function supportsTranslation(subject: string): boolean {
  return TRANSLATION_SUBJECTS.includes(subject);
}
