import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { PassageListItem } from "@/db/passages";
import { passageTitle } from "@/lib/passage";

import { LEVELS } from "@/lib/level";

import { colors, fonts, liningNums } from "./ui";

type Props = {
  items: PassageListItem[];
  onPress: (item: PassageListItem) => void;
  emptyText: string;
};

export function PassageList({ items, onPress, emptyText }: Props) {
  return (
    <FlatList
      data={items}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={items.length === 0 ? styles.emptyWrap : undefined}
      ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.item} onPress={() => onPress(item)}>
          <Text style={styles.no}>{item.source_number ?? ""}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{passageTitle(item)}</Text>
            <Text style={styles.meta}>
              {item.track} · {item.sentence_count}문장 · {item.level ? `${item.level}단계 통과` : "미통과"}
            </Text>
          </View>
          {/* 통과한 단계만큼 채운 5칸 */}
          <View style={styles.levels} accessibilityLabel={item.level ? `${item.level}단계 통과` : "미통과"}>
            {LEVELS.map((l) => (
              <View key={l} style={[styles.box, item.level != null && l <= item.level && styles.boxOn]} />
            ))}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  no: { width: 36, fontFamily: fonts.serif, ...liningNums, fontSize: 22, color: "#9a9a9a" },
  title: { fontSize: 15, fontWeight: "500", color: colors.text },
  meta: { fontSize: 12, fontWeight: "300", color: colors.sub, marginTop: 2 },
  levels: { flexDirection: "row", gap: 3 },
  box: { width: 9, height: 9, borderWidth: 1, borderColor: colors.text },
  boxOn: { backgroundColor: colors.text },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: colors.sub, padding: 24 },
});
