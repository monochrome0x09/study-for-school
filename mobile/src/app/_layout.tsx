import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/migrations";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="passage-new" options={{ title: "지문 등록" }} />
        <Stack.Screen name="import" options={{ title: "일괄 가져오기" }} />
      </Stack>
    </SQLiteProvider>
  );
}
