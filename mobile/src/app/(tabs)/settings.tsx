import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";

import { alertInvalidInput, alertSaveFailed } from "@/components/dialogs";
import { Button, SectionTitle, TextField, colors } from "@/components/ui";
import { validateSettings } from "@/lib/settings";
import { loadSettings, saveSettings } from "@/lib/settings/storage";

export default function SettingsScreen() {
  const router = useRouter();
  const [textbook, setTextbook] = useState("");
  const [scope, setScope] = useState("");
  const [examDate, setExamDate] = useState("");
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const s = loadSettings();
      setTextbook(s.textbook);
      setScope(s.scope);
      setExamDate(s.examDate);
      setSaved(false);
    }, []),
  );

  const save = () => {
    const next = { textbook: textbook.trim(), scope: scope.trim(), examDate: examDate.trim() };
    const errors = validateSettings(next);
    if (errors.length > 0) {
      alertInvalidInput(errors);
      return;
    }
    try {
      saveSettings(next);
      setSaved(true);
    } catch (e) {
      alertSaveFailed(e);
    }
  };

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setSaved(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionTitle>교과서</SectionTitle>
        <TextField value={textbook} onChangeText={edit(setTextbook)} placeholder="교과서 이름" />
        <SectionTitle>시험 범위</SectionTitle>
        <TextField value={scope} onChangeText={edit(setScope)} placeholder="예: 1~2과" />
        <SectionTitle>시험일 (YYYY-MM-DD)</SectionTitle>
        <TextField
          value={examDate}
          onChangeText={edit(setExamDate)}
          placeholder="2026-10-15"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />
        <Button label="저장" onPress={save} style={{ marginTop: 16 }} />
        {saved ? <Text style={styles.saved}>저장했습니다.</Text> : null}

        <SectionTitle>지문 가져오기</SectionTitle>
        <Button label="JSON으로 한꺼번에 가져오기" variant="secondary" onPress={() => router.push("/import")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48 },
  saved: { color: colors.good, marginTop: 8 },
});
