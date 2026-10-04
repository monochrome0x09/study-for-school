import { Alert, Platform } from "react-native";

import { errorMessage } from "@/lib/errors";

/**
 * 화면에서 반복되는 알림창. 문구를 한곳에서 관리한다.
 * react-native-web의 Alert.alert는 아무것도 하지 않아(웹에서 오류 안내와 삭제 확인이
 * 사라진다) 웹에서는 브라우저의 alert·confirm을 쓴다.
 */

function notify(title: string, message: string): void {
  if (Platform.OS === "web") {
    globalThis.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function alertSaveFailed(e: unknown): void {
  notify("저장하지 못했습니다", errorMessage(e));
}

export function alertInvalidInput(errors: readonly string[]): void {
  notify("입력을 확인하십시오", errors.join("\n"));
}

export function alertNoSentences(): void {
  notify("문장이 없습니다", "저장할 문장이 하나도 없습니다.");
}

/** 되돌릴 수 없는 삭제 확인창. 확인을 누르면 onConfirm을 실행한다. */
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
): void {
  if (Platform.OS === "web") {
    if (globalThis.confirm(`${title}\n\n${message}`)) void onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "취소", style: "cancel" },
    { text: "삭제", style: "destructive", onPress: onConfirm },
  ]);
}
