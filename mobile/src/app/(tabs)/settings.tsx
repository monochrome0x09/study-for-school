import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";

import { Button, SectionTitle, colors } from "@/components/ui";
import { validateSettings } from "@/lib/settings";
import { loadSettings, saveSettings } from "@/lib/settings/storage";

export default function SettingsScreen() {
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
      Alert.alert("입력을 확인하십시오", errors.join("\n"));
      return;
    }
    try {
      saveSettings(next);
      setSaved(true);
    } catch (e) {
      Alert.alert("저장하지 못했습니다", String(e));
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
        <TextInput style={styles.input} value={textbook} onChangeText={edit(setTextbook)} placeholder="교과서 이름" />
        <SectionTitle>시험 범위</SectionTitle>
        <TextInput style={styles.input} value={scope} onChangeText={edit(setScope)} placeholder="예: 1~2과" />
        <SectionTitle>시험일 (YYYY-MM-DD)</SectionTitle>
        <TextInput
          style={styles.input}
          value={examDate}
          onChangeText={edit(setExamDate)}
          placeholder="2026-10-15"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />
        <Button label="저장" onPress={save} style={{ marginTop: 16 }} />
        {saved ? <Text style={styles.saved}>저장했습니다.</Text> : null}
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
  },
  saved: { color: colors.good, marginTop: 8 },
});
