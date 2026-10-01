/**
 * 암기 난이도. 단계별 빈칸 비율은 `blankRatio` 참고
 * (근거: docs/decisions/0002-cloze-ratio-and-pass-rules.md).
 */
export type ClozeLevel = 1 | 2 | 3 | 4 | 5;

export const CLOZE_LEVELS: readonly ClozeLevel[] = [1, 2, 3, 4, 5];

/** 힌트 없음 / 첫글자 / 직접 타이핑 / 문장 순서 맞추기 */
export type ClozeMode = "none" | "firstLetter" | "typing" | "order";

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

export const CLOZE_RATIO_MIN = 0.1; // 1단계
export const CLOZE_RATIO_MAX = 0.8; // 5단계

/** 단계별 빈칸 비율. 1단계 10%, 5단계 80%, 사이는 같은 간격. */
export function blankRatio(level: ClozeLevel): number {
  const step = (CLOZE_RATIO_MAX - CLOZE_RATIO_MIN) / (CLOZE_LEVELS.length - 1);
  return CLOZE_RATIO_MIN + step * (level - 1);
}

/** 빈칸으로 잘 만들지 않는 기능어. 내용어를 모두 비운 뒤에야 비워진다. */
const FUNCTION_WORDS = new Set(
  (
    "a an the and or but nor so yet for of in on at to from by with about as into onto over under " +
    "up down out off than then that this these those there here it its he him his she her they them their " +
    "we us our you your i me my mine is am are was were be been being do does did have has had " +
    "will would shall should can could may might must not no if when while because although though " +
    "which who whom whose what where how why also too very just only both either neither each every any some " +
    "such more most much many few other another all s t d ll re ve m"
  ).split(" "),
);

export type TokenParts = { prefix: string; core: string; suffix: string };

/** 토큰을 앞 문장부호 / 단어 / 뒤 문장부호로 나눈다. 단어 안의 ' 와 - 는 단어에 속한다. */
export function splitToken(token: string): TokenParts {
  const m = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/su.exec(token);
  return { prefix: m?.[1] ?? "", core: m?.[2] ?? token, suffix: m?.[3] ?? "" };
}

function isBlankable(core: string): boolean {
  return /\p{L}/u.test(core);
}

function isContentWord(core: string): boolean {
  const word = core.toLowerCase().replace(/[’']/g, "'");
  if (FUNCTION_WORDS.has(word)) return false;
  // it's / don't 처럼 축약된 형태는 앞부분이 기능어면 기능어로 본다
  const head = word.split("'")[0];
  return !(word.includes("'") && FUNCTION_WORDS.has(head));
}

/** 문자열 시드를 32비트 정수로 바꾼다(FNV-1a). */
function hashSeed(seed: number | string): number {
  if (typeof seed === "number") return seed >>> 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 시드 고정 난수(mulberry32). 같은 시드면 같은 수열. */
export function seededRandom(seed: number | string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 시드 고정 셔플(Fisher-Yates). 원본은 바꾸지 않는다. */
export function seededShuffle<T>(items: readonly T[], seed: number | string): T[] {
  const rand = seededRandom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 문장 목록에서 단계별 빈칸을 만든다. 내용어를 우선하고,
 * 같은 seed(지문별 고정값)이면 항상 같은 빈칸이 나온다.
 *
 * 토큰마다 (내용어 우선, 시드 난수) 순위를 정해 앞에서부터 비율만큼 비운다.
 * 순위는 단계와 무관하므로 낮은 단계의 빈칸은 높은 단계의 빈칸에 항상 포함된다.
 */
export function generateCloze(
  sentences: readonly string[],
  level: ClozeLevel,
  seed: number | string,
): ClozeSentence[] {
  const rand = seededRandom(seed);

  const result: ClozeSentence[] = sentences.map((s, sentenceIndex) => ({
    sentenceIndex,
    tokens: s.split(/\s+/).filter((t) => t.length > 0),
    blanks: [],
  }));

  type Candidate = {
    sentence: number;
    token: number;
    answer: string;
    content: boolean;
    r: number;
  };
  const candidates: Candidate[] = [];
  result.forEach((sentence, si) => {
    sentence.tokens.forEach((token, ti) => {
      const { core } = splitToken(token);
      if (!isBlankable(core)) return;
      candidates.push({
        sentence: si,
        token: ti,
        answer: core,
        content: isContentWord(core),
        r: rand(),
      });
    });
  });

  if (candidates.length === 0) return result;

  const count = Math.max(1, Math.round(candidates.length * blankRatio(level)));
  const picked = [...candidates]
    .sort((a, b) => Number(!a.content) - Number(!b.content) || a.r - b.r)
    .slice(0, count);

  for (const c of picked) {
    result[c.sentence].blanks.push({ tokenIndex: c.token, answer: c.answer });
  }
  for (const s of result) s.blanks.sort((a, b) => a.tokenIndex - b.tokenIndex);
  return result;
}

/** 입력과 정답을 비교하기 위한 정규화: 대소문자, 곡선 따옴표, 앞뒤 문장부호·공백을 무시한다. */
export function normalizeAnswer(text: string): string {
  return splitToken(
    text
      .normalize("NFC")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .trim(),
  )
    .core.toLowerCase();
}

export function isAnswerCorrect(input: string, answer: string): boolean {
  const a = normalizeAnswer(answer);
  return a.length > 0 && normalizeAnswer(input) === a;
}

/** 힌트용 첫글자 표시. 예: "garden" → "g_____" */
export function firstLetterHint(answer: string): string {
  const chars = Array.from(answer);
  return chars[0] + "_".repeat(Math.max(chars.length - 1, 1));
}

/** 빈칸 표시. 예: "garden" → "______" */
export function blankMask(answer: string): string {
  return "_".repeat(Math.max(Array.from(answer).length, 2));
}

export type BlankKey = `${number}:${number}`;

/** 빈칸을 가리키는 키(문장 번호:토큰 번호). 입력값 맵의 키로 쓴다. */
export function blankKey(sentenceIndex: number, tokenIndex: number): BlankKey {
  return `${sentenceIndex}:${tokenIndex}`;
}

export type GradeResult = {
  total: number;
  correct: number;
  /** 모든 빈칸이 맞았을 때만 true. 빈칸이 없으면 false. */
  passed: boolean;
  results: Record<BlankKey, boolean>;
};

/** 직접 타이핑 모드 채점. 입력이 없는 빈칸은 틀린 것으로 본다. */
export function gradeBlanks(
  cloze: readonly ClozeSentence[],
  inputs: Partial<Record<BlankKey, string>>,
): GradeResult {
  const results: Record<BlankKey, boolean> = {};
  let total = 0;
  let correct = 0;
  for (const s of cloze) {
    for (const b of s.blanks) {
      const key = blankKey(s.sentenceIndex, b.tokenIndex);
      const ok = isAnswerCorrect(inputs[key] ?? "", b.answer);
      results[key] = ok;
      total += 1;
      if (ok) correct += 1;
    }
  }
  return { total, correct, passed: total > 0 && correct === total, results };
}

/**
 * 문장 순서 맞추기용 섞인 순서(원래 위치의 배열). 문장이 둘 이상이면
 * 원래 순서와 같게 나오지 않는다.
 */
export function shuffledOrder(count: number, seed: number | string): number[] {
  const base = Array.from({ length: count }, (_, i) => i);
  if (count < 2) return base;
  for (let attempt = 0; attempt < 20; attempt++) {
    const out = seededShuffle(base, `${seed}#${attempt}`);
    if (out.some((v, i) => v !== i)) return out;
  }
  return [...base].reverse();
}
