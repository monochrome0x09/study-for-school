import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PassageList } from "@/components/PassageList";
import { Button, Row, colors } from "@/components/ui";
import { listPassages } from "@/db/passages";
import { useFocusLoad } from "@/hooks/useFocusLoad";

const FILTERS = ["전체", "학평", "교과서"] as const;
type Filter = (typeof FILTERS)[number];

export default function PassagesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const load = useCallback(() => listPassages(db), [db]);
  const { data, error } = useFocusLoad(load);
  const [filter, setFilter] = useState<Filter>("전체");
  const all = data ?? [];
  const items = filter === "전체" ? all : all.filter((p) => p.track === filter);
  const countOf = (f: Filter) => (f === "전체" ? all.length : all.filter((p) => p.track === f).length);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 24, paddingTop: 8 }}>
        <Row>
          <Button label="지문 등록" onPress={() => router.push("/passage-new")} style={{ flex: 1 }} />
          <Button label="JSON 가져오기" variant="secondary" onPress={() => router.push("/import")} style={{ flex: 1 }} />
        </Row>
      </View>
      <View style={{ flexDirection: "row", gap: 24, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.text }}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            style={{ paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: filter === f ? colors.text : "transparent", marginBottom: -1 }}
          >
            <Text style={{ fontSize: 13, color: filter === f ? colors.text : "#8a8a8a", fontWeight: filter === f ? "500" : "300" }}>
              {f} {countOf(f)}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={{ color: colors.bad, padding: 16 }}>{error}</Text> : null}
      <PassageList
        items={items}
        emptyText="등록된 지문이 없습니다. 위의 버튼으로 지문을 등록하십시오."
        onPress={(p) =>
          router.push({ pathname: "/passage/[id]", params: { id: String(p.id) } })
        }
      />
    </View>
  );
}
