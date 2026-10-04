import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SentenceEditor } from "@/components/SentenceEditor";
import { alertNoSentences, alertSaveFailed } from "@/components/dialogs";
import { Button, Row, colors } from "@/components/ui";
import { getSentences, replaceSentences } from "@/db/sentences";
import { nonBlank } from "@/lib/sentences/edit";

export default function PassageEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const passageId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const [sentences, setSentences] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    void getSentences(db, passageId).then((rows) => {
      if (alive) setSentences(rows.map((r) => r.en));
    });
    return () => {
      alive = false;
    };
  }, [db, passageId]);

  const save = async () => {
    if (!sentences) return;
    const kept = nonBlank(sentences);
    if (kept.length === 0) {
      alertNoSentences();
      return;
    }
    try {
      await replaceSentences(db, passageId, kept.map((en) => ({ en })));
      router.back();
    } catch (e) {
      alertSaveFailed(e);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <Stack.Screen options={{ title: "문장 교정" }} />
      {sentences === null ? (
        <Text style={{ color: colors.sub }}>불러오는 중…</Text>
      ) : (
        <>
          <Text style={styles.help}>
            문장을 고치면 그 문장에 붙은 해석·메모는 비워집니다. 문장을 바꾸지 않으면 유지됩니다.
          </Text>
          <SentenceEditor sentences={sentences} onChange={setSentences} />
          <View style={{ height: 12 }} />
          <Row>
            <Button label="취소" variant="secondary" onPress={() => router.back()} />
            <Button label="저장" onPress={save} />
          </Row>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  help: { color: colors.sub, marginBottom: 8 },
});
