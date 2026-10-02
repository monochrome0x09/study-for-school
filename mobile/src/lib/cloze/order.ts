import { seededShuffle } from "@/lib/random";

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
