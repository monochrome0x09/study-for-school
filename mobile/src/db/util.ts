/** 공백뿐인 문자열은 null로 바꿔 DB에 빈 값을 저장하지 않는다. */
export function nullIfBlank(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}
