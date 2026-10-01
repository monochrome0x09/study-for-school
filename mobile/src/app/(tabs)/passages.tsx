import { Link } from "expo-router";
import { View } from "react-native";

import { Placeholder } from "@/components/Placeholder";

export default function PassageListScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Placeholder title="지문 목록" note="TODO: 교과서 / 학평 지문 목록" />
      <Link href="/passage-new" style={{ padding: 16, textAlign: "center" }}>
        지문 등록으로 이동
      </Link>
    </View>
  );
}
