import type { Level } from "@/lib/level";
import { seededRandom } from "@/lib/random";
import { splitToken, splitWords } from "@/lib/text";

import { blankRatio } from "./ratio";
import type { ClozeSentence } from "./types";
import { isBlankable, isContentWord } from "./words";

type Candidate = {
  sentence: number;
  token: number;
  answer: string;
  content: boolean;
  r: number;
};

/**
 * 문장 목록에서 단계별 빈칸을 만든다. 내용어를 우선하고,
 * 같은 seed(지문별 고정값)이면 항상 같은 빈칸이 나온다.
 *
 * 토큰마다 (내용어 우선, 시드 난수) 순위를 정해 앞에서부터 비율만큼 비운다.
 * 순위는 단계와 무관하므로 낮은 단계의 빈칸은 높은 단계의 빈칸에 항상 포함된다.
 * 난수는 후보 토큰마다 문장·토큰 순서대로 하나씩 뽑는다(순서를 바꾸면 결과가 달라진다).
 */
export function generateCloze(
  sentences: readonly string[],
  level: Level,
  seed: number | string,
): ClozeSentence[] {
  const rand = seededRandom(seed);

  const result: ClozeSentence[] = sentences.map((s, sentenceIndex) => ({
    sentenceIndex,
    tokens: splitWords(s),
    blanks: [],
  }));

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
