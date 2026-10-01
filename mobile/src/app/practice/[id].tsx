import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ClozeView } from "@/components/ClozeView";
import { Button, Chip, Row, SectionTitle, colors } from "@/components/ui";
import { getPassage, getSentences } from "@/db/passages";
import { getReview, recordPass } from "@/db/review";
import {
  CLOZE_LEVELS,
  blankRatio,
  generateCloze,
  gradeBlanks,
  shuffledOrder,
  type BlankKey,
  type ClozeLevel,
  type ClozeMode,
} from "@/lib/cloze";
import { passageSeed, passageTitle } from "@/lib/passage";

const MODES: { mode: ClozeMode; label: string; help: string }[] = [
  { mode: "none", label: "힌트 없음", help: "빈칸만 보고 떠올린 뒤 정답을 보고 스스로 확인합니다." },
  { mode: "firstLetter", label: "첫글자", help: "첫 글자 힌트를 보고 떠올린 뒤 정답을 보고 스스로 확인합니다." },
  { mode: "typing", label: "직접 타이핑", help: "빈칸에 직접 입력하고 채점합니다. 모두 맞아야 통과입니다." },
  { mode: "order", label: "문장 순서", help: "섞인 문장을 원래 순서대로 고릅니다. 연습용이며 통과 단계는 기록하지 않습니다." },
];

type Loaded = { title: string; sentences: string[]; best: number | null };

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const passageId = Number(id);
  const db = useSQLiteContext();

  const [loaded, setLoaded] = useState<Loaded | null | undefined>(undefined);
  const [level, setLevel] = useState<ClozeLevel>(1);
  const [mode, setMode] = useState<ClozeMode>("typing");
  const [started, setStarted] = useState(false);
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

  const modeInfo = MODES.find((m) => m.mode === mode)!;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: loaded.title }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!started ? (
          <>
            <Text style={styles.meta}>
              {best ? `${best}단계까지 통과` : "아직 통과 기록 없음"} · {loaded.sentences.length}문장
            </Text>
            <SectionTitle>방식</SectionTitle>
            <Row>
              {MODES.map((m) => (
                <Chip key={m.mode} label={m.label} selected={mode === m.mode} onPress={() => setMode(m.mode)} />
              ))}
            </Row>
            <Text style={styles.help}>{modeInfo.help}</Text>

            <SectionTitle>단계 (빈칸 비율)</SectionTitle>
            <Row>
              {CLOZE_LEVELS.map((l) => (
                <Chip
                  key={l}
                  label={`${l}단계 ${Math.round(blankRatio(l) * 100)}%`}
                  selected={level === l}
                  disabled={mode === "order"}
                  onPress={() => setLevel(l)}
                />
              ))}
            </Row>
            <View style={{ height: 20 }} />
            <Button
              label="시작"
              disabled={loaded.sentences.length === 0 || (mode === "order" && loaded.sentences.length < 2)}
              onPress={() => {
                setAttempt((a) => a + 1);
                setStarted(true);
              }}
            />
            {mode === "order" && loaded.sentences.length < 2 ? (
              <Text style={styles.help}>문장이 2개 이상이어야 합니다.</Text>
            ) : null}
          </>
        ) : mode === "order" ? (
          <OrderRunner
            key={attempt}
            sentences={loaded.sentences}
            seed={`${passageSeed(passageId)}-order-${attempt}`}
            onAgain={() => setAttempt((a) => a + 1)}
            onExit={() => setStarted(false)}
          />
        ) : (
          <ClozeRunner
            key={`${attempt}-${level}-${mode}`}
            sentences={loaded.sentences}
            passageId={passageId}
            level={level}
            mode={mode}
            onPassed={(l) => setBest((b) => Math.max(b ?? 0, l))}
            onAgain={() => setAttempt((a) => a + 1)}
            onExit={() => setStarted(false)}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type RunnerProps = {
  sentences: string[];
  onAgain: () => void;
  onExit: () => void;
};

function ClozeRunner({
  sentences,
  passageId,
  level,
  mode,
  onPassed,
  onAgain,
  onExit,
}: RunnerProps & {
  passageId: number;
  level: ClozeLevel;
  mode: Exclude<ClozeMode, "order">;
  onPassed: (level: ClozeLevel) => void;
}) {
  const db = useSQLiteContext();
  const cloze = useMemo(
    () => generateCloze(sentences, level, passageSeed(passageId)),
    [sentences, level, passageId],
  );
  const [inputs, setInputs] = useState<Partial<Record<BlankKey, string>>>({});
  const [revealed, setRevealed] = useState(false);
  const [grade, setGrade] = useState<ReturnType<typeof gradeBlanks> | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const record = async () => {
    try {
      await recordPass(db, "passage", passageId, level);
      setRecorded(true);
      onPassed(level);
    } catch (e) {
      setSaveError(String(e));
    }
  };

  const check = async () => {
    const g = gradeBlanks(cloze, inputs);
    setGrade(g);
    if (g.passed) await record();
  };

  return (
    <View>
      <Text style={styles.meta}>
        {level}단계 · {Math.round(blankRatio(level) * 100)}% 빈칸 ·{" "}
        {MODES.find((m) => m.mode === mode)?.label}
      </Text>
      <ClozeView
        cloze={cloze}
        mode={mode}
        revealed={revealed}
        inputs={inputs}
        onInput={(k, v) => setInputs((prev) => ({ ...prev, [k]: v }))}
        results={grade?.results}
      />

      {grade ? (
        <Text style={[styles.result, { color: grade.passed ? colors.good : colors.bad }]}>
          {grade.correct} / {grade.total} 정답{grade.passed ? " — 통과" : ""}
        </Text>
      ) : null}
      {recorded ? <Text style={styles.recorded}>{level}단계 통과를 기록했습니다.</Text> : null}
      {saveError ? <Text style={styles.error}>기록하지 못했습니다: {saveError}</Text> : null}

      <View style={{ height: 12 }} />
      <Row>
        {mode === "typing" ? (
          !grade ? (
            <Button label="채점" onPress={check} />
          ) : !grade.passed ? (
            <Button label="다시 풀기" onPress={onAgain} />
          ) : null
        ) : !revealed ? (
          <Button label="정답 보기" onPress={() => setRevealed(true)} />
        ) : !recorded ? (
          <>
            <Button label="다 맞혔다 (통과 기록)" onPress={record} />
            <Button label="다시" variant="secondary" onPress={onAgain} />
          </>
        ) : null}
        {mode === "typing" && !revealed && grade && !grade.passed ? (
          <Button label="정답 보기" variant="secondary" onPress={() => setRevealed(true)} />
        ) : null}
        {recorded ? <Button label="한 번 더" variant="secondary" onPress={onAgain} /> : null}
        <Button label="설정으로" variant="secondary" onPress={onExit} />
      </Row>
    </View>
  );
}

function OrderRunner({
  sentences,
  seed,
  onAgain,
  onExit,
}: RunnerProps & { seed: string }) {
  const pool = useMemo(() => shuffledOrder(sentences.length, seed), [sentences.length, seed]);
  const [picked, setPicked] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const remaining = pool.filter((i) => !picked.includes(i));
  const correct = done && picked.every((v, i) => v === i);

  return (
    <View>
      <Text style={styles.meta}>
        문장을 원래 순서대로 고르십시오. ({picked.length} / {sentences.length})
      </Text>

      <SectionTitle>고른 순서 (누르면 취소)</SectionTitle>
      {picked.length === 0 ? <Text style={styles.help}>아직 고른 문장이 없습니다.</Text> : null}
      {picked.map((idx, pos) => (
        <Text
          key={idx}
          style={[
            styles.card,
            done && (idx === pos ? { borderColor: colors.good } : { borderColor: colors.bad }),
          ]}
          onPress={() => !done && setPicked(picked.filter((v) => v !== idx))}
        >
          {pos + 1}. {sentences[idx]}
        </Text>
      ))}

      {!done ? (
        <>
          <SectionTitle>남은 문장 (눌러서 추가)</SectionTitle>
          {remaining.map((idx) => (
            <Text key={idx} style={styles.card} onPress={() => setPicked([...picked, idx])}>
              {sentences[idx]}
            </Text>
          ))}
        </>
      ) : (
        <Text style={[styles.result, { color: correct ? colors.good : colors.bad }]}>
          {correct ? "정답입니다." : "순서가 다릅니다. 빨간 테두리가 틀린 자리입니다."}
        </Text>
      )}

      <View style={{ height: 12 }} />
      <Row>
        {!done ? (
          <Button label="채점" disabled={picked.length !== sentences.length} onPress={() => setDone(true)} />
        ) : (
          <Button label="다시 섞기" onPress={onAgain} />
        )}
        <Button label="설정으로" variant="secondary" onPress={onExit} />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 64 },
  meta: { color: colors.sub, marginBottom: 12 },
  help: { color: colors.sub, marginTop: 8 },
  error: { color: colors.bad, padding: 8 },
  result: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  recorded: { color: colors.good, marginTop: 4 },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
});
