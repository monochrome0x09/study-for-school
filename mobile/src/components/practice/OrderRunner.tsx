import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, Row, SectionTitle, colors } from "@/components/ui";
import { shuffledOrder } from "@/lib/cloze";

import { practiceStyles as styles } from "./styles";

type Props = {
  sentences: string[];
  seed: string;
  onAgain: () => void;
  onExit: () => void;
};

/** 문장 순서 맞추기. 연습용이라 통과 단계는 기록하지 않는다(docs/decisions/0002). */
export function OrderRunner({ sentences, seed, onAgain, onExit }: Props) {
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
            local.card,
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
            <Text key={idx} style={local.card} onPress={() => setPicked([...picked, idx])}>
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

const local = StyleSheet.create({
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
