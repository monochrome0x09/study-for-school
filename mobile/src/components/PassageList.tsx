import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { PassageListItem } from "@/db/passages";
import { passageTitle } from "@/lib/passage";

import { colors } from "./ui";

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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{passageTitle(item)}</Text>
            <Text style={styles.meta}>
              {item.track} · {item.sentence_count}문장
            </Text>
          </View>
          <Text style={[styles.level, item.level === 5 && { color: colors.good }]}>
            {item.level ? `${item.level}단계 통과` : "미통과"}
          </Text>
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
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  title: { fontSize: 17, fontWeight: "600", color: colors.text },
  meta: { fontSize: 13, color: colors.sub, marginTop: 2 },
  level: { fontSize: 14, color: colors.sub },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: colors.sub, padding: 24 },
});
