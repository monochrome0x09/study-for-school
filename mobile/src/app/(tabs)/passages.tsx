import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { Text, View } from "react-native";

import { PassageList } from "@/components/PassageList";
import { Button, colors } from "@/components/ui";
import { listPassages } from "@/db/passages";
import { useFocusLoad } from "@/hooks/useFocusLoad";

export default function PassagesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const load = useCallback(() => listPassages(db), [db]);
  const { data, error } = useFocusLoad(load);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Button label="지문 등록" onPress={() => router.push("/passage-new")} />
        <Button label="JSON으로 한꺼번에 가져오기" variant="secondary" onPress={() => router.push("/import")} style={{ marginTop: 8 }} />
      </View>
      {error ? <Text style={{ color: colors.bad, padding: 16 }}>{error}</Text> : null}
      <PassageList
        items={data ?? []}
        emptyText="등록된 지문이 없습니다. 위의 버튼으로 지문을 등록하십시오."
        onPress={(p) =>
          router.push({ pathname: "/passage/[id]", params: { id: String(p.id) } })
        }
      />
    </View>
  );
}
