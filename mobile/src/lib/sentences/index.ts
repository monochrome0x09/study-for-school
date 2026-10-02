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

// 문장 시작이 될 수 있는 글자: 영문 대문자, 숫자, 원문자 번호(①~⑳, 학평 지문의 보기 표지)
const SENTENCE_START = /[A-Z0-9\u2460-\u2473]/;

function startsSentence(token: string): boolean {
  const first = token.replace(OPENERS, "").charAt(0);
  return SENTENCE_START.test(first);
}

/**
 * 줄이 *로 시작하면 각주로 보고 새 덩어리를 시작한다. 각주는 앞 문장과 합쳐지지 않고
 * 따로 나뉘며, 지울지는 교정 화면에서 사용자가 정한다. 그 밖의 줄바꿈은 같은 덩어리 안에서
 * 공백으로 이어 붙는다.
 */
function splitBlocks(text: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*\*/.test(line) && current.length > 0) {
      blocks.push(current.join(" "));
      current = [];
    }
    current.push(line);
  }
  blocks.push(current.join(" "));
  return blocks;
}

/**
 * 원문을 문장 단위로 나눈다. 규칙 기반(마침표·물음표·느낌표, 약어 예외)이며
 * 결과는 사용자가 교정 화면에서 고친다.
 *
 * 마침표·물음표·느낌표(뒤에 닫는 따옴표·괄호가 올 수 있음) 다음 단어가
 * 대문자, 숫자, 원문자 번호(①~⑳)로 시작할 때만 나눈다. 원문자 표지는 지우지 않고 문장에 남긴다.
 * 줄바꿈과 연속 공백은 공백 하나로 합치되, `*`로 시작하는 줄(각주)은 따로 나눈다.
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

  return splitBlocks(text).flatMap((block) => splitBlock(block, abbreviations));
}

function splitBlock(block: string, abbreviations: ReadonlySet<string>): string[] {
  const tokens = block.split(/\s+/).filter((t) => t.length > 0);
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
