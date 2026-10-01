/** 문장 교정 화면에서 쓰는 순수 함수. 입력 배열은 바꾸지 않는다. */

/** i번째 문장을 다음 문장과 합친다. 마지막 문장이면 그대로. */
export function mergeWithNext(list: readonly string[], i: number): string[] {
  if (i < 0 || i >= list.length - 1) return [...list];
  const merged = `${list[i].trimEnd()} ${list[i + 1].trimStart()}`.trim();
  return [...list.slice(0, i), merged, ...list.slice(i + 2)];
}

/** i번째 문장을 글자 위치 pos에서 둘로 나눈다. 앞뒤 중 하나가 비면 나누지 않는다. */
export function splitAt(
  list: readonly string[],
  i: number,
  pos: number,
): string[] {
  const text = list[i];
  if (text === undefined) return [...list];
  const head = text.slice(0, pos).trim();
  const tail = text.slice(pos).trim();
  if (!head || !tail) return [...list];
  return [...list.slice(0, i), head, tail, ...list.slice(i + 1)];
}

export function removeAt(list: readonly string[], i: number): string[] {
  return list.filter((_, idx) => idx !== i);
}

export function updateAt(
  list: readonly string[],
  i: number,
  text: string,
): string[] {
  return list.map((s, idx) => (idx === i ? text : s));
}
