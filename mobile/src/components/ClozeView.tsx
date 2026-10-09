import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  blankKey,
  blankMask,
  firstLetterHint,
  type BlankKey,
  type BlankMode,
  type ClozeSentence,
} from "@/lib/cloze";
import { splitToken } from "@/lib/text";

import { colors } from "./ui";

type Props = {
  cloze: ClozeSentence[];
  /** "order"는 이 화면에서 쓰지 않는다. */
  mode: BlankMode;
  /** true면 빈칸에 정답을 보여 준다. */
  revealed: boolean;
  inputs: Partial<Record<BlankKey, string>>;
  onInput: (key: BlankKey, value: string) => void;
  /** 채점 결과(typing). 없으면 채점 전. */
  results?: Record<BlankKey, boolean>;
};

export function ClozeView({ cloze, mode, revealed, inputs, onInput, results }: Props) {
  return (
    <View>
      {cloze.map((s) => {
        const blankByToken = new Map(s.blanks.map((b) => [b.tokenIndex, b]));
        return (
          <View key={s.sentenceIndex} style={styles.sentence}>
            <Text style={styles.num}>{s.sentenceIndex + 1}</Text>
            <View style={styles.words}>
              {s.tokens.map((token, ti) => {
                const blank = blankByToken.get(ti);
                if (!blank) {
                  return (
                    <Text key={ti} style={styles.word}>
                      {token}
                    </Text>
                  );
                }
                const { prefix, suffix } = splitToken(token);
                const key = blankKey(s.sentenceIndex, ti);
                const graded = results?.[key];
                return (
                  <View key={ti} style={styles.blankWrap}>
                    {prefix ? <Text style={styles.word}>{prefix}</Text> : null}
                    {mode === "typing" && !revealed ? (
                      <TextInput
                        style={[
                          styles.input,
                          { width: Math.max(44, blank.answer.length * 11 + 16) },
                          graded === true && { borderColor: colors.good, borderWidth: 2 },
                          graded === false && { borderColor: colors.bad, borderStyle: "dashed", borderWidth: 2 },
                        ]}
                        value={inputs[key] ?? ""}
                        onChangeText={(t) => onInput(key, t)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        editable={graded === undefined}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.word,
                          revealed ? styles.answer : styles.mask,
                        ]}
                      >
                        {revealed
                          ? blank.answer
                          : mode === "firstLetter"
                            ? firstLetterHint(blank.answer)
                            : blankMask(blank.answer)}
                      </Text>
                    )}
                    {suffix ? <Text style={styles.word}>{suffix}</Text> : null}
                    {mode === "typing" && graded === false && !revealed ? (
                      <Text style={styles.correction}> ({blank.answer})</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sentence: { flexDirection: "row", gap: 8, marginBottom: 14 },
  num: { width: 18, color: colors.sub, fontSize: 12, paddingTop: 5 },
  words: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 5, rowGap: 6 },
  word: { fontSize: 17, lineHeight: 26, color: colors.text },
  blankWrap: { flexDirection: "row", alignItems: "center" },
  mask: { color: colors.sub, letterSpacing: 1 },
  answer: { color: colors.primary, fontWeight: "700", textDecorationLine: "underline" },
  input: {
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 17,
    color: colors.text,
  },
  correction: { color: colors.bad, fontSize: 14 },
});
