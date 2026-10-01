import { useSQLiteContext } from "expo-sqlite";
import { useMemo, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

import { ClozeView } from "@/components/ClozeView";
import { Button, Row, colors } from "@/components/ui";
import { recordPass } from "@/db/review";
import {
  blankRatio,
  generateCloze,
  gradeBlanks,
  type BlankKey,
  type BlankMode,
  type GradeResult,
} from "@/lib/cloze";
import { errorMessage } from "@/lib/errors";
import type { Level } from "@/lib/level";
import { passageSeed } from "@/lib/passage";

import { modeInfo } from "./modes";
import { practiceStyles as styles } from "./styles";

type Props = {
  sentences: string[];
  passageId: number;
  level: Level;
  mode: BlankMode;
  onPassed: (level: Level) => void;
  onAgain: () => void;
  onExit: () => void;
};

/**
 * 빈칸 암기 진행. 통과 규칙(docs/decisions/0002):
 * 타이핑은 모두 맞으면 자동 기록, 힌트 없음·첫글자는 정답 확인 후 "다 맞혔다"로 기록.
 */
export function ClozeRunner({
  sentences,
  passageId,
  level,
  mode,
  onPassed,
  onAgain,
  onExit,
}: Props) {
  const db = useSQLiteContext();
  const cloze = useMemo(
    () => generateCloze(sentences, level, passageSeed(passageId)),
    [sentences, level, passageId],
  );
  const [inputs, setInputs] = useState<Partial<Record<BlankKey, string>>>({});
  const [revealed, setRevealed] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const record = async () => {
    try {
      await recordPass(db, "passage", passageId, level);
      setRecorded(true);
      onPassed(level);
    } catch (e) {
      setSaveError(errorMessage(e));
    }
  };

  const check = async () => {
    const g = gradeBlanks(cloze, inputs);
    setGrade(g);
    if (g.passed) await record();
  };

  /** 상태에 따라 보여 줄 버튼. 마지막의 "설정으로"는 항상 따로 붙는다. */
  const actions = (): ReactNode => {
    if (mode === "typing") {
      if (!grade) return <Button label="채점" onPress={check} />;
      if (grade.passed) return null;
      return (
        <>
          <Button label="다시 풀기" onPress={onAgain} />
          {!revealed ? (
            <Button label="정답 보기" variant="secondary" onPress={() => setRevealed(true)} />
          ) : null}
        </>
      );
    }
    if (!revealed) return <Button label="정답 보기" onPress={() => setRevealed(true)} />;
    if (recorded) return null;
    return (
      <>
        <Button label="다 맞혔다 (통과 기록)" onPress={record} />
        <Button label="다시" variant="secondary" onPress={onAgain} />
      </>
    );
  };

  return (
    <View>
      <Text style={styles.meta}>
        {level}단계 · {Math.round(blankRatio(level) * 100)}% 빈칸 · {modeInfo(mode).label}
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
        {actions()}
        {recorded ? <Button label="한 번 더" variant="secondary" onPress={onAgain} /> : null}
        <Button label="설정으로" variant="secondary" onPress={onExit} />
      </Row>
    </View>
  );
}
