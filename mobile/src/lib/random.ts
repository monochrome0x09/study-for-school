/** 시드 고정 난수. 같은 시드면 항상 같은 결과가 나와야 하는 곳(빈칸, 섞기, 카드 순서)에서 쓴다. */

/** 문자열 시드를 32비트 정수로 바꾼다(FNV-1a). 숫자는 그대로 쓴다. */
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
