import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { Text, View } from "react-native";

import { PassageList } from "@/components/PassageList";
import { colors } from "@/components/ui";
import { listPassages } from "@/db/passages";
import { useFocusLoad } from "@/hooks/useFocusLoad";

export default function MemorizeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const load = useCallback(() => listPassages(db), [db]);
  const { data, error } = useFocusLoad(load);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Text style={{ padding: 16, color: colors.sub }}>암기할 지문을 고르십시오.</Text>
      {error ? <Text style={{ color: colors.bad, padding: 16 }}>{error}</Text> : null}
      <PassageList
        items={data ?? []}
        emptyText="등록된 지문이 없습니다. 지문 탭에서 먼저 등록하십시오."
        onPress={(p) =>
          router.push({ pathname: "/practice/[id]", params: { id: String(p.id) } })
        }
      />
    </View>
  );
}
