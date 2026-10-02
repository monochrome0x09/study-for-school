import { Alert } from "react-native";

import { errorMessage } from "@/lib/errors";

/** 화면에서 반복되는 알림창. 문구를 한곳에서 관리한다. */

export function alertSaveFailed(e: unknown): void {
  Alert.alert("저장하지 못했습니다", errorMessage(e));
}

export function alertInvalidInput(errors: readonly string[]): void {
  Alert.alert("입력을 확인하십시오", errors.join("\n"));
}

export function alertNoSentences(): void {
  Alert.alert("문장이 없습니다", "저장할 문장이 하나도 없습니다.");
}

/** 되돌릴 수 없는 삭제 확인창. 확인을 누르면 onConfirm을 실행한다. */
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
): void {
  Alert.alert(title, message, [
    { text: "취소", style: "cancel" },
    { text: "삭제", style: "destructive", onPress: onConfirm },
  ]);
}
