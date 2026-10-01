/** 힌트 없음 / 첫글자 / 직접 타이핑 / 문장 순서 맞추기 */
export type ClozeMode = "none" | "firstLetter" | "typing" | "order";

/** 빈칸을 채워 푸는 모드(문장 순서 맞추기 제외). */
export type BlankMode = Exclude<ClozeMode, "order">;

export type ClozeBlank = {
  /** `ClozeSentence.tokens` 안의 위치 */
  tokenIndex: number;
  /** 정답 단어(앞뒤 문장부호 제외) */
  answer: string;
};

export type ClozeSentence = {
  sentenceIndex: number;
  /** 공백으로 나눈 조각(문장부호가 붙어 있을 수 있음) */
  tokens: string[];
  /** tokenIndex 오름차순 */
  blanks: ClozeBlank[];
};
