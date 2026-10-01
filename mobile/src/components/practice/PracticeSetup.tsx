import { Text, View } from "react-native";

import { Button, Chip, Row, SectionTitle } from "@/components/ui";
import { blankRatio, type ClozeMode } from "@/lib/cloze";
import { LEVELS, type Level } from "@/lib/level";

import { MODES, modeInfo } from "./modes";
import { practiceStyles as styles } from "./styles";

type Props = {
  best: number | null;
  sentenceCount: number;
  mode: ClozeMode;
  level: Level;
  onModeChange: (mode: ClozeMode) => void;
  onLevelChange: (level: Level) => void;
  onStart: () => void;
};

/** 암기 시작 전: 방식과 단계를 고른다. */
export function PracticeSetup({
  best,
  sentenceCount,
  mode,
  level,
  onModeChange,
  onLevelChange,
  onStart,
}: Props) {
  const tooFewForOrder = mode === "order" && sentenceCount < 2;
  return (
    <>
      <Text style={styles.meta}>
        {best ? `${best}단계까지 통과` : "아직 통과 기록 없음"} · {sentenceCount}문장
      </Text>
      <SectionTitle>방식</SectionTitle>
      <Row>
        {MODES.map((m) => (
          <Chip key={m.mode} label={m.label} selected={mode === m.mode} onPress={() => onModeChange(m.mode)} />
        ))}
      </Row>
      <Text style={styles.help}>{modeInfo(mode).help}</Text>

      <SectionTitle>단계 (빈칸 비율)</SectionTitle>
      <Row>
        {LEVELS.map((l) => (
          <Chip
            key={l}
            label={`${l}단계 ${Math.round(blankRatio(l) * 100)}%`}
            selected={level === l}
            disabled={mode === "order"}
            onPress={() => onLevelChange(l)}
          />
        ))}
      </Row>
      <View style={{ height: 20 }} />
      <Button label="시작" disabled={sentenceCount === 0 || tooFewForOrder} onPress={onStart} />
      {tooFewForOrder ? <Text style={styles.help}>문장이 2개 이상이어야 합니다.</Text> : null}
    </>
  );
}
