export type SplitOptions = {
  /** 마침표로 끝나도 문장 경계로 보지 않을 약어(예: "Mr.", "e.g."). 기본 목록에 더해진다. */
  abbreviations?: readonly string[];
};

const DEFAULT_ABBREVIATIONS = [
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "prof.",
  "sr.",
  "jr.",
  "st.",
  "vs.",
  "etc.",
  "no.",
  "inc.",
  "ltd.",
  "co.",
];

// 문장 끝 뒤에 붙는 닫는 따옴표·괄호
const CLOSERS = /["'”’)\]]+$/;
// 문장 시작 앞에 붙는 여는 따옴표·괄호
const OPENERS = /^["'“‘(\[]+/;
// U.S., e.g., i.e., a.m., 이니셜(J.) 같은 약어
const DOTTED_ABBREVIATION = /^(?:[A-Za-z]\.)+$/;

function endsSentence(token: string): boolean {
  return /[.?!]$/.test(token.replace(CLOSERS, ""));
}

function startsSentence(token: string): boolean {
  const first = token.replace(OPENERS, "").charAt(0);
  return /[A-Z0-9]/.test(first);
}

/**
 * 원문을 문장 단위로 나눈다. 규칙 기반(마침표·물음표·느낌표, 약어 예외)이며
 * 결과는 사용자가 교정 화면에서 고친다.
 *
 * 마침표·물음표·느낌표(뒤에 닫는 따옴표·괄호가 올 수 있음) 다음 단어가
 * 대문자나 숫자로 시작할 때만 나눈다. 줄바꿈과 연속 공백은 공백 하나로 합친다.
 */
export function splitSentences(
  text: string,
  options?: SplitOptions,
): string[] {
  const abbreviations = new Set(
    [...DEFAULT_ABBREVIATIONS, ...(options?.abbreviations ?? [])].map((a) =>
      a.toLowerCase(),
    ),
  );

  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  const sentences: string[] = [];
  let current: string[] = [];

  tokens.forEach((token, i) => {
    current.push(token);

    const next = tokens[i + 1];
    if (next === undefined) return;
    if (!endsSentence(token) || !startsSentence(next)) return;

    const bare = token.replace(CLOSERS, "");
    if (bare.endsWith(".")) {
      if (abbreviations.has(bare.toLowerCase())) return;
      if (DOTTED_ABBREVIATION.test(bare)) return;
    }

    sentences.push(current.join(" "));
    current = [];
  });

  if (current.length > 0) sentences.push(current.join(" "));
  return sentences;
}
