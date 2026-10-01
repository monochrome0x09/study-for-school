import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Row, SectionTitle, colors } from "@/components/ui";
import { deletePassage, getPassage, getSentences } from "@/db/passages";
import { getReview } from "@/db/review";
import { useFocusLoad } from "@/hooks/useFocusLoad";
import { passageTitle } from "@/lib/passage";

export default function PassageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const passageId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();

  const load = useCallback(async () => {
    const [passage, sentences, review] = await Promise.all([
      getPassage(db, passageId),
      getSentences(db, passageId),
      getReview(db, "passage", passageId),
    ]);
    return { passage, sentences, review };
  }, [db, passageId]);
  const { data, error } = useFocusLoad(load);

  const confirmDelete = () =>
    Alert.alert("지문을 삭제합니다", "문장과 암기 기록도 함께 삭제됩니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await deletePassage(db, passageId);
          router.back();
        },
      },
    ]);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!data) return <View style={styles.page} />;
  if (!data.passage) return <Text style={styles.error}>지문을 찾을 수 없습니다.</Text>;

  const { passage, sentences, review } = data;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: passageTitle(passage) }} />
      <Text style={styles.meta}>
        {passage.track} · {sentences.length}문장 ·{" "}
        {review ? `${review.level}단계까지 통과` : "아직 통과 기록 없음"}
      </Text>
      <Row>
        <Button
          label="암기하기"
          onPress={() =>
            router.push({ pathname: "/practice/[id]", params: { id } })
          }
        />
        <Button
          label="문장 교정"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: "/passage-edit/[id]", params: { id } })
          }
        />
        <Button label="삭제" variant="secondary" onPress={confirmDelete} />
      </Row>

      <SectionTitle>문장</SectionTitle>
      {sentences.map((s) => (
        <Text key={s.id} style={styles.sentence}>
          {s.ord + 1}. {s.en}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  meta: { color: colors.sub, marginBottom: 12 },
  sentence: { fontSize: 16, lineHeight: 24, marginBottom: 8, color: colors.text },
  error: { color: colors.bad, padding: 16 },
});
