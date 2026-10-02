/** 사용자에게 보여줄 오류 문구. Error는 메시지만, 그 외는 문자열로. */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
