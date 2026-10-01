import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  mergeWithNext,
  removeAt,
  splitAt,
  updateAt,
} from "@/lib/sentences/edit";

import { Button, Row, TextField, colors } from "./ui";

type Props = {
  sentences: string[];
  onChange: (next: string[]) => void;
};

/** 문장 교정: 직접 고치기, 커서 위치에서 나누기, 다음 문장과 합치기, 삭제. */
export function SentenceEditor({ sentences, onChange }: Props) {
  // 문장별 커서 위치(나누기에 사용)
  const cursors = useRef<Record<number, number>>({});
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <View>
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {sentences.map((text, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.index}>{i + 1}</Text>
          <TextField
            style={styles.input}
            multiline
            value={text}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(t) => onChange(updateAt(sentences, i, t))}
            onSelectionChange={(e) => {
              cursors.current[i] = e.nativeEvent.selection.start;
            }}
          />
          <Row>
            <Button
              label="커서에서 나누기"
              variant="secondary"
              onPress={() => {
                const pos = cursors.current[i] ?? 0;
                const next = splitAt(sentences, i, pos);
                if (next.length === sentences.length) {
                  setNotice("나눌 위치에 커서를 두십시오(문장 앞뒤는 나눌 수 없습니다).");
                  return;
                }
                setNotice(null);
                onChange(next);
              }}
            />
            <Button
              label="다음과 합치기"
              variant="secondary"
              disabled={i === sentences.length - 1}
              onPress={() => onChange(mergeWithNext(sentences, i))}
            />
            <Button
              label="삭제"
              variant="secondary"
              onPress={() => onChange(removeAt(sentences, i))}
            />
          </Row>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingVertical: 10,
    gap: 6,
  },
  index: { color: colors.sub, fontSize: 12 },
  input: { minHeight: 44 },
  notice: { color: colors.bad, marginBottom: 6 },
});
