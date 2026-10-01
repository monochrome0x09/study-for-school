import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { ClozeRunner } from "@/components/practice/ClozeRunner";
import { OrderRunner } from "@/components/practice/OrderRunner";
import { PracticeSetup } from "@/components/practice/PracticeSetup";
import { colors } from "@/components/ui";
import { getPassage } from "@/db/passages";
import { getSentences } from "@/db/sentences";
import { getReview } from "@/db/review";
import type { ClozeMode } from "@/lib/cloze";
import type { Level } from "@/lib/level";
import { passageSeed, passageTitle } from "@/lib/passage";

type Loaded = { title: string; sentences: string[]; best: number | null };

/** 암기 화면: 지문을 읽어 와 설정(방식·단계) → 진행(빈칸 / 순서)으로 넘긴다. */
export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const passageId = Number(id);
  const db = useSQLiteContext();

  // undefined: 불러오는 중, null: 지문 없음
  const [loaded, setLoaded] = useState<Loaded | null | undefined>(undefined);
  const [level, setLevel] = useState<Level>(1);
  const [mode, setMode] = useState<ClozeMode>("typing");
  const [started, setStarted] = useState(false);
  // 시작·다시 할 때마다 올려 진행 컴포넌트를 새로 만든다
  const [attempt, setAttempt] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [passage, sentences, review] = await Promise.all([
        getPassage(db, passageId),
        getSentences(db, passageId),
        getReview(db, "passage", passageId),
      ]);
      if (!alive) return;
      if (!passage) return setLoaded(null);
      setLoaded({ title: passageTitle(passage), sentences: sentences.map((s) => s.en), best: review?.level ?? null });
      setBest(review?.level ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [db, passageId]);

  if (loaded === undefined) return <View style={styles.page} />;
  if (loaded === null) return <Text style={styles.error}>지문을 찾을 수 없습니다.</Text>;

  const again = () => setAttempt((a) => a + 1);
  const exit = () => setStarted(false);

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: loaded.title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!started ? (
          <PracticeSetup
            best={best}
            sentenceCount={loaded.sentences.length}
            mode={mode}
            level={level}
            onModeChange={setMode}
            onLevelChange={setLevel}
            onStart={() => {
              again();
              setStarted(true);
            }}
          />
        ) : mode === "order" ? (
          <OrderRunner
            key={attempt}
            sentences={loaded.sentences}
            seed={`${passageSeed(passageId)}-order-${attempt}`}
            onAgain={again}
            onExit={exit}
          />
        ) : (
          <ClozeRunner
            key={`${attempt}-${level}-${mode}`}
            sentences={loaded.sentences}
            passageId={passageId}
            level={level}
            mode={mode}
            onPassed={(l) => setBest((b) => Math.max(b ?? 0, l))}
            onAgain={again}
            onExit={exit}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 64 },
  error: { color: colors.bad, padding: 8 },
});
