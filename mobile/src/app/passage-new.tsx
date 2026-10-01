import { Stack, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
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

import { SentenceEditor } from "@/components/SentenceEditor";
import { Button, Chip, Row, SectionTitle, colors } from "@/components/ui";
import { insertPassage } from "@/db/passages";
import type { Track } from "@/db/types";
import { validatePassageInput, type PassageInput } from "@/lib/passage";
import { splitSentences } from "@/lib/sentences";

const toInt = (s: string): number | null => {
  const t = s.trim();
  return /^\d+$/.test(t) ? Number(t) : null;
};

export default function PassageNewScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [track, setTrack] = useState<Track>("교과서");
  const [book, setBook] = useState("");
  const [unit, setUnit] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [number, setNumber] = useState("");
  const [body, setBody] = useState("");
  // null이면 1단계(입력), 배열이면 2단계(문장 교정)
  const [sentences, setSentences] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  const buildInput = (): PassageInput => ({
    track,
    source_book: track === "교과서" ? book : null,
    source_unit: track === "교과서" ? unit : null,
    source_year: track === "학평" ? toInt(year) : null,
    source_month: track === "학평" ? toInt(month) : null,
    source_number: track === "학평" ? toInt(number) : null,
    body,
  });

  const goCorrect = () => {
    const errors = validatePassageInput(buildInput());
    if (errors.length > 0) {
      Alert.alert("입력을 확인하십시오", errors.join("\n"));
      return;
    }
    setSentences(splitSentences(body));
  };

  const save = async () => {
    if (!sentences || saving) return;
    const kept = sentences.filter((s) => s.trim().length > 0);
    if (kept.length === 0) {
      Alert.alert("문장이 없습니다", "저장할 문장이 하나도 없습니다.");
      return;
    }
    setSaving(true);
    try {
      const id = await insertPassage(
        db,
        { ...buildInput(), body: body.trim() },
        kept.map((en) => ({ en })),
      );
      router.replace({ pathname: "/passage/[id]", params: { id: String(id) } });
    } catch (e) {
      Alert.alert("저장하지 못했습니다", String(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: sentences ? "문장 교정" : "지문 등록" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {sentences === null ? (
          <>
            <SectionTitle>구분</SectionTitle>
            <Row>
              <Chip label="교과서" selected={track === "교과서"} onPress={() => setTrack("교과서")} />
              <Chip label="학평" selected={track === "학평"} onPress={() => setTrack("학평")} />
            </Row>

            {track === "교과서" ? (
              <>
                <SectionTitle>출처</SectionTitle>
                <TextInput style={styles.input} placeholder="교과서 이름(선택)" value={book} onChangeText={setBook} />
                <TextInput style={styles.input} placeholder="단원 (예: 1과)" value={unit} onChangeText={setUnit} />
              </>
            ) : (
              <>
                <SectionTitle>출처</SectionTitle>
                <Row>
                  <TextInput style={[styles.input, styles.short]} placeholder="연도" keyboardType="number-pad" value={year} onChangeText={setYear} />
                  <TextInput style={[styles.input, styles.short]} placeholder="월" keyboardType="number-pad" value={month} onChangeText={setMonth} />
                  <TextInput style={[styles.input, styles.short]} placeholder="번호" keyboardType="number-pad" value={number} onChangeText={setNumber} />
                </Row>
              </>
            )}

            <SectionTitle>본문 (붙여넣기)</SectionTitle>
            <TextInput
              style={[styles.input, styles.body]}
              multiline
              placeholder="지문 텍스트를 붙여넣으십시오"
              value={body}
              onChangeText={setBody}
              autoCorrect={false}
              textAlignVertical="top"
            />
            <View style={{ height: 12 }} />
            <Button label="문장 나누기" onPress={goCorrect} />
          </>
        ) : (
          <>
            <Text style={styles.help}>
              자동으로 나눈 결과입니다. 잘못 나뉜 곳을 고친 뒤 저장하십시오. ({sentences.length}문장)
            </Text>
            <SentenceEditor sentences={sentences} onChange={setSentences} />
            <View style={{ height: 12 }} />
            <Row>
              <Button label="본문으로 돌아가기" variant="secondary" onPress={() => setSentences(null)} />
              <Button label={saving ? "저장 중…" : "저장"} disabled={saving} onPress={save} />
            </Row>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  short: { minWidth: 90 },
  body: { minHeight: 220 },
  help: { color: colors.sub, marginBottom: 8 },
});
