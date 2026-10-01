import { Stack, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Row, colors } from "@/components/ui";
import { setReviewLevel } from "@/db/review";
import { listVocab, type VocabListItem } from "@/db/vocab";
import { buildDeck, nextVocabLevel } from "@/lib/vocab";

/** 단어 카드 복습: 단어를 보고 뜻을 떠올린 뒤 확인하고, 알았는지 스스로 기록한다. */
export default function VocabReviewScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [deck, setDeck] = useState<VocabListItem[] | null>(null);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);
  const [known, setKnown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void listVocab(db).then((items) => {
      // 시작할 때마다 순서가 달라지도록 현재 시각을 시드로 쓴다
      if (alive) setDeck(buildDeck(items, `review-${Date.now()}`));
    });
    return () => {
      alive = false;
    };
  }, [db]);

  if (deck === null) return <View style={styles.page} />;

  const card = deck[pos];
  const finished = pos >= deck.length;

  const answer = async (wasKnown: boolean) => {
    try {
      await setReviewLevel(db, "vocab", card.id, nextVocabLevel(card.level, wasKnown));
      if (wasKnown) setKnown((k) => k + 1);
      setShown(false);
      setPos((p) => p + 1);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: "단어 카드 복습" }} />
      {deck.length === 0 ? (
        <Text style={styles.sub}>등록된 단어가 없습니다.</Text>
      ) : finished ? (
        <>
          <Text style={styles.big}>복습 끝</Text>
          <Text style={styles.sub}>
            {deck.length}개 중 {known}개를 알았습니다.
          </Text>
          <View style={{ height: 16 }} />
          <Button label="단어장으로" onPress={() => router.back()} />
        </>
      ) : (
        <>
          <Text style={styles.sub}>
            {pos + 1} / {deck.length} · {card.level ? `${card.level}단계` : "미복습"}
          </Text>
          <Text style={styles.big}>{card.word}</Text>
          <Text style={[styles.meaning, !shown && { opacity: 0 }]}>{card.meaning}</Text>
          <View style={{ height: 16 }} />
          {!shown ? (
            <Button label="뜻 보기" onPress={() => setShown(true)} />
          ) : (
            <Row>
              <Button label="알았다" onPress={() => answer(true)} />
              <Button label="몰랐다" variant="secondary" onPress={() => answer(false)} />
            </Row>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  big: { fontSize: 34, fontWeight: "700", marginVertical: 12, color: colors.text, textAlign: "center" },
  meaning: { fontSize: 22, color: colors.primary, textAlign: "center" },
  sub: { color: colors.sub, fontSize: 15 },
  error: { color: colors.bad, marginTop: 12 },
});
