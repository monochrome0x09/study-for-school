import type { ClozeMode } from "@/lib/cloze";

/** 암기 방식 목록(선택 칩의 순서). 통과 규칙은 docs/decisions/0002. */
export const MODES: readonly { mode: ClozeMode; label: string; help: string }[] = [
  { mode: "none", label: "힌트 없음", help: "빈칸만 보고 떠올린 뒤 정답을 보고 스스로 확인합니다." },
  { mode: "firstLetter", label: "첫글자", help: "첫 글자 힌트를 보고 떠올린 뒤 정답을 보고 스스로 확인합니다." },
  { mode: "typing", label: "직접 타이핑", help: "빈칸에 직접 입력하고 채점합니다. 모두 맞아야 통과입니다." },
  { mode: "order", label: "문장 순서", help: "섞인 문장을 원래 순서대로 고릅니다. 연습용이며 통과 단계는 기록하지 않습니다." },
];

export function modeInfo(mode: ClozeMode) {
  return MODES.find((m) => m.mode === mode)!;
}
