import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { SentenceRow } from "@/db/types";
import { wordFromToken } from "@/lib/vocab";

import { TextField, colors } from "./ui";

type Props = {
  sentence: SentenceRow;
  /** 이미 단어장에 있는 단어(소문자). 밑줄로 표시한다. */
  knownWords: ReadonlySet<string>;
  /** 영어 전용 기능(단어 등록, 해석·메모 입력)을 보여줄지. */
  withTranslation: boolean;
  onWordPress: (word: string, sentenceId: number) => void;
  onSaveNotes: (sentenceId: number, ko: string, note: string) => void;
};

/** 문장 하나: 단어를 눌러 등록하고, 해석·메모를 직접 입력한다. */
export function SentenceBlock({
  sentence,
  knownWords,
  withTranslation,
  onWordPress,
  onSaveNotes,
}: Props) {
  const [ko, setKo] = useState(sentence.ko ?? "");
  const [note, setNote] = useState(sentence.note ?? "");
  const tokens = sentence.en.split(/\s+/).filter((t) => t.length > 0);

  // 입력이 멈추면 저장하고, 화면을 떠날 때 저장되지 않은 입력이 있으면 마저 저장한다.
  const latest = useRef({ ko, note });
  const saved = useRef({ ko: sentence.ko ?? "", note: sentence.note ?? "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSave = useRef(onSaveNotes);
  onSave.current = onSaveNotes;

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const cur = latest.current;
    if (cur.ko === saved.current.ko && cur.note === saved.current.note) return;
    saved.current = cur;
    onSave.current(sentence.id, cur.ko, cur.note);
  };
  const change = (next: { ko: string; note: string }) => {
    latest.current = next;
    setKo(next.ko);
    setNote(next.note);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };
  // flush는 ref만 읽으므로 처음 만든 것을 언마운트 때 써도 된다.
  useEffect(() => flush, []);

  return (
    <View style={styles.block}>
      <Text style={styles.en}>
        <Text style={styles.num}>{sentence.ord + 1}. </Text>
        {tokens.map((token, i) => {
          const word = withTranslation ? wordFromToken(token) : "";
          return (
            <Text
              key={i}
              onPress={word ? () => onWordPress(word, sentence.id) : undefined}
              style={word && knownWords.has(word) ? styles.known : undefined}
            >
              {token}
              {i < tokens.length - 1 ? " " : ""}
            </Text>
          );
        })}
      </Text>
      {withTranslation ? (
        <>
          <TextField
            compact
            placeholder="해석 (직접 입력)"
            multiline
            value={ko}
            onChangeText={(t) => change({ ko: t, note })}
            onBlur={flush}
          />
          <TextField
            compact
            placeholder="메모"
            multiline
            value={note}
            onChangeText={(t) => change({ ko, note: t })}
            onBlur={flush}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 6,
  },
  en: { fontSize: 17, lineHeight: 27, color: colors.text },
  num: { color: colors.sub, fontSize: 12 },
  known: { textDecorationLine: "underline", color: colors.primary },
});
