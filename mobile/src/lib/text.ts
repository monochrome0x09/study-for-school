export type TokenParts = { prefix: string; core: string; suffix: string };

/** 토큰을 앞 문장부호 / 단어 / 뒤 문장부호로 나눈다. 단어 안의 ' 와 - 는 단어에 속하고, 줄표(—, –)부터는 뒤 문장부호로 본다. */
export function splitToken(token: string): TokenParts {
  const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/su.exec(token);
  const prefix = m?.[1] ?? "";
  const core = m?.[2] ?? token;
  const suffix = m?.[3] ?? "";
  // 공백 없이 줄표로 이어진 낱말("despair—a")은 첫 낱말만 core로 하고 나머지는 뒤 문장부호처럼 둔다
  const dash = core.search(/[\u2013\u2014]/);
  if (dash > 0) return { prefix, core: core.slice(0, dash), suffix: core.slice(dash) + suffix };
  return { prefix, core, suffix };
}

/** 공백으로 나눈 조각들. 빈 조각은 버린다. */
export function splitWords(sentence: string): string[] {
  return sentence.split(/\s+/).filter((t) => t.length > 0);
}
