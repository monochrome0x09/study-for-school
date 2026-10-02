import { StyleSheet } from "react-native";

import { colors } from "@/components/ui";

/** 암기 화면(설정·진행)이 함께 쓰는 스타일. */
export const practiceStyles = StyleSheet.create({
  meta: { color: colors.sub, marginBottom: 12 },
  help: { color: colors.sub, marginTop: 8 },
  error: { color: colors.bad, padding: 8 },
  result: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  recorded: { color: colors.good, marginTop: 4 },
});
