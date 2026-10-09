import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";
import { Platform } from "react-native";

import { colors, fonts } from "@/components/ui";
import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/migrations";

export default function RootLayout() {
  // 웹앱: 브라우저가 저장소를 임의로 비우지 않도록 영구 저장을 요청한다(지원하지 않으면 무시)
  useEffect(() => {
    if (Platform.OS === "web") void globalThis.navigator?.storage?.persist?.().catch(() => {});
  }, []);

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.serif, fontWeight: "700" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="passage-new" options={{ title: "지문 등록" }} />
        <Stack.Screen name="import" options={{ title: "일괄 가져오기" }} />
      </Stack>
    </SQLiteProvider>
  );
}
