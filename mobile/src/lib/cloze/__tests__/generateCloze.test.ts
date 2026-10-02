import {
  blankKey,
  gradeBlanks,
  shuffledOrder,
  blankRatio,
  firstLetterHint,
  generateCloze,
  isAnswerCorrect,
  normalizeAnswer,
} from "../index";
import { LEVELS } from "@/lib/level";
import { splitToken } from "@/lib/text";

// 테스트용으로 직접 쓴 문장. 실제 지문이 아니다.
const SENTENCES = [
  "The quiet gardener carefully watered purple flowers every morning.",
  "Her neighbor, however, preferred planting tomatoes beside the old wooden fence.",
  "They often argued about which vegetables deserved more sunlight.",
  "Eventually the two friends decided to share a single tiny greenhouse.",
  "It's surprising how cooperation transforms stubborn rivals into partners!",
  "Did anyone expect such a delicious harvest?",
];

const count = (level: 1 | 2 | 3 | 4 | 5, seed: number | string = "p1") =>
  generateCloze(SENTENCES, level, seed).reduce((n, s) => n + s.blanks.length, 0);

describe("blankRatio", () => {
  test("1단계 10%, 5단계 80%이고 단계가 오를수록 커진다", () => {
    expect(blankRatio(1)).toBeCloseTo(0.1);
    expect(blankRatio(5)).toBeCloseTo(0.8);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(blankRatio(LEVELS[i])).toBeGreaterThan(
        blankRatio(LEVELS[i - 1]),
      );
    }
  });
});

describe("generateCloze", () => {
  test("단계가 높을수록 빈칸이 늘어난다 (1단계 10% → 5단계 80%)", () => {
    const counts = LEVELS.map((l) => count(l));
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThan(counts[i - 1]);
    }
    // 빈칸 후보는 글자 둘 이상인 단어(여기서는 "a" 두 개 제외)
    const words = SENTENCES.join(" ")
      .split(/\s+/)
      .filter((t) => Array.from(splitToken(t).core).length >= 2).length;
    expect(counts[0]).toBe(Math.round(words * 0.1));
    expect(counts[4]).toBe(Math.round(words * 0.8));
  });

  test("같은 seed와 단계에서는 항상 같은 빈칸이 나온다", () => {
    expect(generateCloze(SENTENCES, 3, "p1")).toEqual(
      generateCloze(SENTENCES, 3, "p1"),
    );
    expect(generateCloze(SENTENCES, 3, 42)).toEqual(
      generateCloze(SENTENCES, 3, 42),
    );
  });

  test("seed가 다르면 다른 빈칸이 나온다", () => {
    expect(generateCloze(SENTENCES, 3, "p1")).not.toEqual(
      generateCloze(SENTENCES, 3, "p2"),
    );
  });

  test("낮은 단계의 빈칸은 높은 단계에도 비어 있다", () => {
    const key = (level: 1 | 2 | 3 | 4 | 5) =>
      generateCloze(SENTENCES, level, "p1").flatMap((s) =>
        s.blanks.map((b) => `${s.sentenceIndex}:${b.tokenIndex}`),
      );
    for (let l = 1; l < 5; l++) {
      const high = new Set(key((l + 1) as 2 | 3 | 4 | 5));
      for (const k of key(l as 1 | 2 | 3 | 4)) expect(high.has(k)).toBe(true);
    }
  });

  test("내용어를 기능어보다 우선해 비운다", () => {
    const stop = ["the", "to", "a", "such", "about", "which", "more", "did"];
    const answers = generateCloze(SENTENCES, 2, "p1").flatMap((s) =>
      s.blanks.map((b) => b.answer.toLowerCase()),
    );
    expect(answers.length).toBeGreaterThan(0);
    for (const a of answers) expect(stop).not.toContain(a);
  });

  test("정답은 문장부호를 제외한 단어이고 빈칸은 tokenIndex 순서다", () => {
    for (const s of generateCloze(SENTENCES, 5, "p1")) {
      const idx = s.blanks.map((b) => b.tokenIndex);
      expect(idx).toEqual([...idx].sort((a, b) => a - b));
      for (const b of s.blanks) {
        expect(splitToken(s.tokens[b.tokenIndex]).core).toBe(b.answer);
        expect(b.answer).toMatch(/^[\p{L}\p{N}]/u);
      }
    }
  });

  test("(A)·(B) 표지와 한 글자 단어는 빈칸으로 만들지 않는다", () => {
    const c = generateCloze(["(A) I saw a bird, (B) then left."], 5, "x");
    const answers = c[0].blanks.map((b) => b.answer);
    expect(answers).not.toContain("A");
    expect(answers).not.toContain("B");
    expect(answers).not.toContain("I");
    expect(answers).not.toContain("a");
    expect(answers.length).toBeGreaterThan(0);
  });

  test("빈 입력이나 단어 없는 입력은 빈칸이 없다", () => {
    expect(generateCloze([], 3, "x")).toEqual([]);
    expect(generateCloze(["... !!"], 3, "x")[0].blanks).toEqual([]);
  });
});

describe("답 비교", () => {
  test("대소문자·곡선 따옴표·앞뒤 문장부호·공백을 무시한다", () => {
    expect(normalizeAnswer("  Won’t, ")).toBe("won't");
    expect(isAnswerCorrect("GARDEN", "garden")).toBe(true);
    expect(isAnswerCorrect("it’s", "It's")).toBe(true);
    expect(isAnswerCorrect("gardne", "garden")).toBe(false);
    expect(isAnswerCorrect("", "garden")).toBe(false);
  });

  test("첫글자 힌트", () => {
    expect(firstLetterHint("garden")).toBe("g_____");
  });
});

describe("gradeBlanks", () => {
  const cloze = generateCloze(SENTENCES, 2, "p1");
  const all = cloze.flatMap((s) =>
    s.blanks.map((b) => [blankKey(s.sentenceIndex, b.tokenIndex), b.answer] as const),
  );

  test("모두 맞으면 통과", () => {
    const g = gradeBlanks(cloze, Object.fromEntries(all.map(([k, a]) => [k, a.toUpperCase()])));
    expect(g).toMatchObject({ total: all.length, correct: all.length, passed: true });
  });

  test("하나라도 틀리거나 비면 통과하지 못하고 틀린 칸을 알려 준다", () => {
    const inputs = Object.fromEntries(all.map(([k, a]) => [k, a]));
    inputs[all[0][0]] = "wrongword";
    delete inputs[all[1][0]];
    const g = gradeBlanks(cloze, inputs);
    expect(g.passed).toBe(false);
    expect(g.correct).toBe(all.length - 2);
    expect(g.results[all[0][0]]).toBe(false);
    expect(g.results[all[1][0]]).toBe(false);
  });

  test("빈칸이 없으면 통과가 아니다", () => {
    expect(gradeBlanks([], {}).passed).toBe(false);
  });
});

describe("shuffledOrder", () => {
  test("순열이며 원래 순서와 다르고 같은 seed면 같다", () => {
    for (const n of [2, 3, 6]) {
      const o = shuffledOrder(n, "s");
      expect([...o].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
      expect(o).not.toEqual(Array.from({ length: n }, (_, i) => i));
      expect(shuffledOrder(n, "s")).toEqual(o);
    }
    expect(shuffledOrder(1, "s")).toEqual([0]);
  });
});
