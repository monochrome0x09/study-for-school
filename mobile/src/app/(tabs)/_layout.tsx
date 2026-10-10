import { Tabs } from "expo-router";

import { colors, fonts } from "@/components/ui";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleAlign: "left",
        // 화면 본문의 좌우 여백(24)과 제목 시작 위치를 맞춘다
        headerTitleContainerStyle: { paddingLeft: 8 },
        headerTitleStyle: { fontFamily: fonts.serif, fontWeight: "700", fontSize: 22, color: colors.text },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: "#8a8a8a",
        tabBarLabelStyle: { fontFamily: fonts.serif, fontSize: 13, marginTop: 0 },
        tabBarIconStyle: { display: "none" },
        tabBarItemStyle: { justifyContent: "center" },
        tabBarStyle: { borderTopColor: colors.text, borderTopWidth: 1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "오늘" }} />
      <Tabs.Screen name="passages" options={{ title: "지문" }} />
      <Tabs.Screen name="vocab" options={{ title: "단어" }} />
      <Tabs.Screen name="settings" options={{ title: "더보기" }} />
      {/* 암기는 지문을 눌러 시작하거나 '이어서 암기하기'로 시작한다. 경로는 남겨 두고 탭에서만 뺀다 */}
      <Tabs.Screen name="memorize" options={{ href: null }} />
    </Tabs>
  );
}
