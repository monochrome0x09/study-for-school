import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { Button, colors } from "@/components/ui";
import { listPassages } from "@/db/passages";
import { useFocusLoad } from "@/hooks/useFocusLoad";
import { daysUntilExam, reviewLabel, todayLocal } from "@/lib/review";
import { ddayLabel } from "@/lib/settings";
import { loadSettings } from "@/lib/settings/storage";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  // 설정과 지문 수는 화면에 돌아올 때마다 다시 읽는다
  const load = useCallback(async () => {
    const settings = loadSettings();
    const passages = await listPassages(db);
    return { settings, passages };
  }, [db]);
  const { data, error } = useFocusLoad(load);

  const settings = data?.settings;
  const passages = data?.passages ?? [];
  const dday = settings
    ? ddayLabel(daysUntilExam(settings.examDate, todayLocal()))
    : null;
  const cleared = passages.filter((p) => p.level === 5).length;
  const nextReview = settings ? reviewLabel(settings.examDate, todayLocal()) : null;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={styles.dday}>{dday ?? "시험일 미설정"}</Text>
      {settings ? (
        <Text style={styles.sub}>
          {settings.textbook} · {settings.scope} · 시험일 {settings.examDate}
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {nextReview ? <Text style={styles.review}>{nextReview}</Text> : null}

      <Text style={styles.stat}>
        등록한 지문 {passages.length}개 · 5단계까지 통과 {cleared}개 · 남은 지문{" "}
        {passages.length - cleared}개
      </Text>
      <Button label="암기하러 가기" onPress={() => router.push("/memorize")} style={{ marginTop: 16 }} />
      <Button label="지문 등록" variant="secondary" onPress={() => router.push("/passage-new")} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, alignItems: "stretch" },
  dday: { fontSize: 56, fontWeight: "800", color: colors.primary, textAlign: "center", marginTop: 24 },
  sub: { color: colors.sub, textAlign: "center", marginTop: 4 },
  review: { fontSize: 16, fontWeight: "600", color: colors.text, textAlign: "center", marginTop: 24 },
  stat: { fontSize: 16, color: colors.text, textAlign: "center", marginTop: 16 },
  error: { color: colors.bad, marginTop: 8, textAlign: "center" },
});
