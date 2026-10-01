export type SplitOptions = {
  /** 마침표로 끝나도 문장 경계로 보지 않을 약어(예: "Mr.", "e.g."). */
  abbreviations?: readonly string[];
};

/**
 * 원문을 문장 단위로 나눈다. 규칙 기반(마침표·물음표·느낌표, 약어 예외)이며
 * 결과는 사용자가 교정 화면에서 고친다.
 */
export function splitSentences(
  text: string,
  options?: SplitOptions,
): string[] {
  // TODO: 구현
  throw new Error("splitSentences: not implemented");
}
