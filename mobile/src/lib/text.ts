export type TokenParts = { prefix: string; core: string; suffix: string };

/** 토큰을 앞 문장부호 / 단어 / 뒤 문장부호로 나눈다. 단어 안의 ' 와 - 는 단어에 속한다. */
export function splitToken(token: string): TokenParts {
  const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/su.exec(token);
  return { prefix: m?.[1] ?? "", core: m?.[2] ?? token, suffix: m?.[3] ?? "" };
}

/** 공백으로 나눈 조각들. 빈 조각은 버린다. */
export function splitWords(sentence: string): string[] {
  return sentence.split(/\s+/).filter((t) => t.length > 0);
}
