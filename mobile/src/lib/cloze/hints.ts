/** 첫글자 힌트 표시. 예: "garden" → "g_____" */
export function firstLetterHint(answer: string): string {
  const chars = Array.from(answer);
  return chars[0] + "_".repeat(Math.max(chars.length - 1, 1));
}

/** 빈칸 표시. 예: "garden" → "______" */
export function blankMask(answer: string): string {
  return "_".repeat(Math.max(Array.from(answer).length, 2));
}
