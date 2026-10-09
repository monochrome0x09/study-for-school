import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, colors, fonts } from "@/components/ui";
import { listPassages } from "@/db/passages";
import { useFocusLoad } from "@/hooks/useFocusLoad";
import { passageTitle, pickContinue } from "@/lib/passage";
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
  const today = todayLocal();
  const dday = settings ? ddayLabel(daysUntilExam(settings.examDate, today)) : null;
  const cleared = passages.filter((p) => p.level === 5).length;
  const nextReview = settings ? reviewLabel(settings.examDate, today) : null;
  const next = pickContinue(passages);
  const ratio = passages.length > 0 ? cleared / passages.length : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.rule} />
      <Text style={styles.label}>EXAM</Text>
      <Text style={styles.dday} adjustsFontSizeToFit numberOfLines={1}>
        {dday ?? "–"}
      </Text>
      <Text style={styles.sub}>
        {settings ? `${settings.examDate} · ${settings.textbook} · ${settings.scope}` : "시험일 미설정"}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.progressHead}>
        <Text style={styles.sub}>5단계 통과</Text>
        <Text style={styles.sub}>
          <Text style={styles.count}>{cleared}</Text> / {passages.length}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      {nextReview ? <Text style={styles.review}>{nextReview}</Text> : null}

      {next ? (
        <Button
          label="이어서 암기하기"
          onPress={() => router.push({ pathname: "/practice/[id]", params: { id: String(next.id) } })}
          style={{ marginTop: 28 }}
        />
      ) : (
        <Button label="지문 보러 가기" onPress={() => router.push("/passages")} style={{ marginTop: 28 }} />
      )}
      {next ? (
        <Text style={styles.nextHint}>
          {passageTitle(next)} · {next.level ? `${next.level}단계까지 통과` : "아직 통과 기록 없음"}
        </Text>
      ) : null}
      <Button label="지문 등록" variant="secondary" onPress={() => router.push("/passage-new")} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 28, paddingTop: 8, paddingBottom: 48 },
  rule: { height: 1, backgroundColor: colors.text, marginBottom: 20 },
  label: { fontFamily: fonts.serif, fontSize: 11, letterSpacing: 4, color: colors.sub },
  dday: { fontFamily: fonts.serif, fontSize: 112, fontWeight: "900", lineHeight: 124, color: colors.text, letterSpacing: -4 },
  sub: { color: colors.sub, fontSize: 12, fontWeight: "300" },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 28 },
  count: { fontFamily: fonts.serif, fontSize: 18, fontWeight: "700", color: colors.text },
  track: { height: 2, backgroundColor: colors.line, marginTop: 8 },
  fill: { height: 2, backgroundColor: colors.text },
  review: { fontSize: 14, fontWeight: "500", color: colors.text, marginTop: 16 },
  nextHint: { fontSize: 12, color: colors.sub, marginTop: 8, textAlign: "center" },
  error: { color: colors.bad, marginTop: 8 },
});
