import { clampLevel, type Level } from "@/lib/level";
import { seededShuffle } from "@/lib/random";
import { splitToken } from "@/lib/text";

/** 카드 복습 결과에 따른 새 단계: 알면 한 단계 위(최대 5), 모르면 1단계로. */
export function nextVocabLevel(current: number | null, known: boolean): Level {
  if (!known) return 1;
  return clampLevel((current ?? 0) + 1);
}

/**
 * 복습 순서. 아직 복습하지 않은 단어(null)와 낮은 단계가 먼저 나온다.
 * 같은 단계 안에서는 시드로 섞는다(같은 시드면 같은 순서).
 */
export function buildDeck<T extends { id: number; level: number | null }>(
  items: readonly T[],
  seed: number | string,
): T[] {
  const groups = new Map<number, T[]>();
  for (const it of items) {
    const key = it.level ?? 0;
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .flatMap((key) => seededShuffle(groups.get(key)!, `${seed}:${key}`));
}

/** 눌린 토큰("garden,")에서 등록할 단어("garden")를 뽑는다. 단어가 없으면 빈 문자열. */
export function wordFromToken(token: string): string {
  const { core } = splitToken(token);
  return /\p{L}/u.test(core) ? core.toLowerCase() : "";
}
