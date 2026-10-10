import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SentenceBlock } from "@/components/SentenceBlock";
import { alertSaveFailed, confirmDelete } from "@/components/dialogs";
import { Button, Row, SectionTitle, TextField, colors } from "@/components/ui";
import { deletePassage, getPassage } from "@/db/passages";
import { getReview } from "@/db/review";
import { getSentences, updateSentenceNotes } from "@/db/sentences";
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

  const askDelete = () =>
    confirmDelete("지문을 삭제합니다", "문장과 암기 기록도 함께 삭제됩니다.", async () => {
      await deletePassage(db, passageId);
      router.back();
    });

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
      alertSaveFailed(e);
    }
  };

  const saveNotes = async (sentenceId: number, ko: string, note: string) => {
    try {
      await updateSentenceNotes(db, sentenceId, ko, note);
    } catch (e) {
      alertSaveFailed(e);
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
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
          <Button label="삭제" variant="secondary" onPress={askDelete} />
        </Row>

        <SectionTitle>
          {withTranslation ? "문장 (단어를 누르면 단어장에 등록)" : "문장"}
        </SectionTitle>
        {sentences.map((s) => (
          <SentenceBlock
            // 교정 저장 시 문장 id가 재사용될 수 있어, 문장이 바뀌면 입력 상태를 새로 만든다
            key={`${s.id}:${s.en}`}
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
          <TextField value={word} onChangeText={setWord} autoCapitalize="none" autoCorrect={false} />
          <TextField
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
  content: { padding: 24, paddingBottom: 48 },
  meta: { color: colors.sub, marginBottom: 12 },
  error: { color: colors.bad, padding: 16 },
  panel: {
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
});
