import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { alertSaveFailed } from "@/components/dialogs";
import { Button, Row, SectionTitle, TextField, colors } from "@/components/ui";
import { importPassages, type ImportResult } from "@/db/importer";
import {
  importPassageTitle,
  parseImportBundle,
  summarizeImportPassage,
  type ParsedBundle,
} from "@/lib/importer";

export default function ImportScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedBundle | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const change = (t: string) => {
    setText(t);
    setParsed(null); // 내용이 바뀌면 이전 확인 결과는 무효
  };

  const doImport = async () => {
    if (!parsed || busy) return;
    setBusy(true);
    try {
      setResult(await importPassages(db, parsed.passages));
    } catch (e) {
      alertSaveFailed(e);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setText("");
    setParsed(null);
    setResult(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {result ? (
          <>
            <SectionTitle>가져오기 결과</SectionTitle>
            <Text style={styles.line}>새로 등록 {result.imported.length}개</Text>
            {result.imported.map((p) => (
              <Text key={p.id} style={styles.item}>· {p.title}</Text>
            ))}
            {result.skipped.length > 0 ? (
              <>
                <Text style={[styles.line, { marginTop: 12 }]}>
                  이미 있어서 건너뜀 {result.skipped.length}개 (기존 내용은 그대로입니다)
                </Text>
                {result.skipped.map((p, i) => (
                  <Text key={i} style={styles.item}>· {p.title}</Text>
                ))}
              </>
            ) : null}
            <View style={{ height: 16 }} />
            <Row>
              <Button label="더 가져오기" variant="secondary" onPress={reset} />
              <Button label="지문 목록 보기" onPress={() => router.back()} />
            </Row>
          </>
        ) : (
          <>
            <Text style={styles.help}>
              컴퓨터에서 만든 가져오기 묶음(JSON)을 붙여넣으십시오. 지문, 문장별 해석·메모, 단어가 한 번에 등록됩니다. 이미 등록된 지문은 건너뜁니다.
            </Text>
            <TextField
              style={styles.box}
              multiline
              placeholder='{"version": 1, "passages": [ … ]}'
              value={text}
              onChangeText={change}
              autoCorrect={false}
              autoCapitalize="none"
              textAlignVertical="top"
            />
            <View style={{ height: 12 }} />
            {/* 여러 줄 입력칸의 완료 키는 줄바꿈이라 키보드가 안 닫힌다: 닫기 버튼과 끌어내리기로 닫는다 */}
            <Row>
              <Button label="키보드 닫기" variant="secondary" onPress={() => Keyboard.dismiss()} />
              <Button
                label="내용 확인"
                onPress={() => {
                  Keyboard.dismiss();
                  setParsed(parseImportBundle(text));
                }}
              />
            </Row>

            {parsed && parsed.errors.length > 0 ? (
              <>
                <SectionTitle>고쳐야 할 곳 ({parsed.errors.length})</SectionTitle>
                {parsed.errors.map((e, i) => (
                  <Text key={i} style={styles.error}>· {e}</Text>
                ))}
                <Text style={styles.help}>하나라도 틀리면 아무것도 등록하지 않습니다.</Text>
              </>
            ) : null}

            {parsed && parsed.errors.length === 0 ? (
              <>
                <SectionTitle>등록할 지문 {parsed.passages.length}개</SectionTitle>
                {parsed.passages.map((p, i) => (
                  <View key={i} style={styles.preview}>
                    <Text style={styles.previewTitle}>{importPassageTitle(p)}</Text>
                    <Text style={styles.previewMeta}>{summarizeImportPassage(p)}</Text>
                  </View>
                ))}
                <View style={{ height: 12 }} />
                <Button
                  label={busy ? "가져오는 중…" : `${parsed.passages.length}개 가져오기`}
                  disabled={busy}
                  onPress={doImport}
                />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  help: { color: colors.sub, marginVertical: 8 },
  box: { minHeight: 200 },
  line: { fontSize: 16, color: colors.text, marginBottom: 4 },
  item: { fontSize: 15, color: colors.text, marginLeft: 4, marginBottom: 2 },
  error: { color: colors.bad, marginBottom: 4 },
  preview: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  previewTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  previewMeta: { fontSize: 13, color: colors.sub, marginTop: 2 },
});
