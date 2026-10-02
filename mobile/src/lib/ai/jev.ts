import * as SecureStore from "expo-secure-store";

/**
 * JEV API 호출은 이 파일에만 둔다. 주소·인증 방식·응답 형식이 달라져도
 * 이 파일만 고치면 되게 한다.
 */

export type JevSettings = {
  /** JEV API 주소. 설정 화면에서 입력. */
  baseUrl: string | null;
  /** API 키. 기기의 SecureStore에만 저장한다. */
  apiKey: string | null;
};

// SecureStore 키는 영숫자와 . - _ 만 허용된다.
const KEY_BASE_URL = "jev.baseUrl";
const KEY_API_KEY = "jev.apiKey";

export async function readJevSettings(): Promise<JevSettings> {
  const [baseUrl, apiKey] = await Promise.all([
    SecureStore.getItemAsync(KEY_BASE_URL),
    SecureStore.getItemAsync(KEY_API_KEY),
  ]);
  return { baseUrl, apiKey };
}

export type JevVocabItem = {
  word: string;
  meaning: string;
};

export type JevSentenceResult = {
  /** 입력 문장 목록에서의 위치 */
  index: number;
  ko: string;
  vocab: JevVocabItem[];
};

/** 문장 목록 → 문장별 해석·핵심 어휘 초안. 결과는 호출하는 쪽에서 SQLite에 캐시한다. */
export async function analyzeSentences(
  sentences: readonly string[],
  settings: JevSettings,
): Promise<JevSentenceResult[]> {
  // TODO: JEV의 실제 주소, 인증 방식, 응답 형식을 아직 모른다. 확인 후 구현.
  throw new Error("analyzeSentences: not implemented");
}
