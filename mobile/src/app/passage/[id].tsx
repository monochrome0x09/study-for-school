import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SentenceBlock } from "@/components/SentenceBlock";
import { Button, Row, SectionTitle, colors } from "@/components/ui";
import {
  deletePassage,
  getPassage,
  getSentences,
  updateSentenceNotes,
} from "@/db/passages";
import { getReview } from "@/db/review";
import { listVocab, upsertVocab } from "@/db/vocab";
import { useFocusLoad } from "@/hooks/useFocusLoad";
import { passageTitle } from "@/lib/passage";
import { supportsTranslation } from "@/lib/subject";

type Picked = { word: string; sentenceId: number };

export default function PassageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const passageId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();

  const [picked, setPicked] = useState<Picked | null>(null);
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");

  const load = useCallback(async () => {
    const [passage, sentences, review, vocab] = await Promise.all([
      getPassage(db, passageId),
      getSentences(db, passageId),
      getReview(db, "passage", passageId),
      listVocab(db, passageId),
    ]);
    return { passage, sentences, review, vocab };
  }, [db, passageId]);
  const { data, error, reload } = useFocusLoad(load);

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

  const pick = (w: string, sentenceId: number) => {
    setPicked({ word: w, sentenceId });
    setWord(w);
    const existing = data?.vocab.find((v) => v.word.toLowerCase() === w);
    setMeaning(existing?.meaning ?? "");
  };

  const saveVocab = async () => {
    if (!picked) return;
    try {
      await upsertVocab(db, {
        word,
        meaning,
        passage_id: passageId,
        sentence_id: picked.sentenceId,
      });
      setPicked(null);
      await reload();
    } catch (e) {
      Alert.alert("저장하지 못했습니다", e instanceof Error ? e.message : String(e));
    }
  };

  const saveNotes = async (sentenceId: number, ko: string, note: string) => {
    try {
      await updateSentenceNotes(db, sentenceId, ko, note);
    } catch (e) {
      Alert.alert("저장하지 못했습니다", String(e));
    }
  };

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!data) return <View style={styles.page} />;
  if (!data.passage) return <Text style={styles.error}>지문을 찾을 수 없습니다.</Text>;

  const { passage, sentences, review, vocab } = data;
  const withTranslation = supportsTranslation(passage.subject);
  const knownWords = new Set(vocab.map((v) => v.word.toLowerCase()));

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: passageTitle(passage) }} />
        <Text style={styles.meta}>
          {passage.track} · {sentences.length}문장 ·{" "}
          {review ? `${review.level}단계까지 통과` : "아직 통과 기록 없음"}
        </Text>
        <Row>
          <Button
            label="암기하기"
            onPress={() => router.push({ pathname: "/practice/[id]", params: { id } })}
          />
          <Button
            label="문장 교정"
            variant="secondary"
            onPress={() => router.push({ pathname: "/passage-edit/[id]", params: { id } })}
          />
          <Button label="삭제" variant="secondary" onPress={confirmDelete} />
        </Row>

        <SectionTitle>
          {withTranslation ? "문장 (단어를 누르면 단어장에 등록)" : "문장"}
        </SectionTitle>
        {sentences.map((s) => (
          <SentenceBlock
            key={s.id}
            sentence={s}
            knownWords={knownWords}
            withTranslation={withTranslation}
            onWordPress={pick}
            onSaveNotes={saveNotes}
          />
        ))}
      </ScrollView>

      {picked ? (
        <View style={styles.panel}>
          <TextInput style={styles.panelInput} value={word} onChangeText={setWord} autoCapitalize="none" autoCorrect={false} />
          <TextInput
            style={styles.panelInput}
            placeholder="뜻"
            value={meaning}
            onChangeText={setMeaning}
            autoFocus
          />
          <Row>
            <Button label="단어장에 저장" onPress={saveVocab} />
            <Button label="닫기" variant="secondary" onPress={() => setPicked(null)} />
          </Row>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  meta: { color: colors.sub, marginBottom: 12 },
  error: { color: colors.bad, padding: 16 },
  panel: {
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  panelInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: colors.text,
  },
});
