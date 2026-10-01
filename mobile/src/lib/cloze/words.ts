/** 빈칸 후보 판정: 어떤 토큰을 비울 수 있고, 내용어인지 기능어인지. */

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

/** 글자가 둘 이상인 단어만 빈칸 후보다. (A)·(B) 같은 표지와 a, I는 빈칸으로 쓸모가 없다. */
export function isBlankable(core: string): boolean {
  return /\p{L}/u.test(core) && Array.from(core).length >= 2;
}

export function isContentWord(core: string): boolean {
  const word = core.toLowerCase().replace(/[’']/g, "'");
  if (FUNCTION_WORDS.has(word)) return false;
  // it's / don't 처럼 축약된 형태는 앞부분이 기능어면 기능어로 본다
  const head = word.split("'")[0];
  return !(word.includes("'") && FUNCTION_WORDS.has(head));
}
