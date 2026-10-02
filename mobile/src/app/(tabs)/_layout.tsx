import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="passages" options={{ title: "지문" }} />
      <Tabs.Screen name="memorize" options={{ title: "암기" }} />
      <Tabs.Screen name="vocab" options={{ title: "단어장" }} />
      <Tabs.Screen name="settings" options={{ title: "설정" }} />
    </Tabs>
  );
}
