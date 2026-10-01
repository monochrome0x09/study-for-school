import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  note?: string;
};

export function Placeholder({ title, note }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "600" },
  note: { marginTop: 8, color: "#666" },
});
