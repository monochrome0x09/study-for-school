import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { alertSaveFailed, confirmDelete } from "@/components/dialogs";
import { Button, Row, TextField, colors } from "@/components/ui";
import { deleteVocab, listVocab, updateVocab, type VocabListItem } from "@/db/vocab";
import { useFocusLoad } from "@/hooks/useFocusLoad";

export default function VocabScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const load = useCallback(() => listVocab(db), [db]);
  const { data, error, reload } = useFocusLoad(load);

  const [editing, setEditing] = useState<VocabListItem | null>(null);
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");

  const startEdit = (v: VocabListItem) => {
    setEditing(v);
    setWord(v.word);
    setMeaning(v.meaning);
  };

  const save = async () => {
    if (!editing) return;
    try {
      await updateVocab(db, editing.id, word, meaning);
      setEditing(null);
      await reload();
    } catch (e) {
      alertSaveFailed(e);
    }
  };

  const remove = () => {
    if (!editing) return;
    const target = editing;
    confirmDelete("단어를 삭제합니다", target.word, async () => {
      await deleteVocab(db, target.id);
      setEditing(null);
      await reload();
    });
  };

  const items = data ?? [];
  return (
    <View style={styles.page}>
      <View style={{ padding: 16 }}>
        <Button
          label={`카드 복습 (${items.length}개)`}
          disabled={items.length === 0}
          onPress={() => router.push("/vocab-review")}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {editing ? (
        <View style={styles.editor}>
          <TextField value={word} onChangeText={setWord} autoCapitalize="none" autoCorrect={false} />
          <TextField value={meaning} onChangeText={setMeaning} placeholder="뜻" />
          <Row>
            <Button label="저장" onPress={save} />
            <Button label="삭제" variant="secondary" onPress={remove} />
            <Button label="닫기" variant="secondary" onPress={() => setEditing(null)} />
          </Row>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : undefined}
        ListEmptyComponent={
          <Text style={styles.empty}>
            등록된 단어가 없습니다. 지문 상세에서 단어를 눌러 등록하십시오.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => startEdit(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.word}>{item.word}</Text>
              <Text style={styles.meaning}>{item.meaning}</Text>
            </View>
            <Text style={styles.level}>{item.level ? `${item.level}단계` : "미복습"}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.bad, padding: 16 },
  editor: { padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  word: { fontSize: 17, fontWeight: "600", color: colors.text },
  meaning: { fontSize: 14, color: colors.sub, marginTop: 2 },
  level: { fontSize: 13, color: colors.sub },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: colors.sub, padding: 24 },
});
