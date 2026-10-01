import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

export const colors = {
  bg: "#ffffff",
  text: "#111111",
  sub: "#666666",
  line: "#dddddd",
  primary: "#2f6fed",
  primaryText: "#ffffff",
  good: "#1a7f37",
  bad: "#cf222e",
  chip: "#f0f2f5",
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.7 },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === "secondary" && { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, disabled, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[styles.chipLabel, selected && { color: colors.primaryText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

type TextFieldProps = TextInputProps & {
  /** 문장 아래에 붙는 작은 입력칸(해석·메모)용 */
  compact?: boolean;
};

/** 앱 공통 텍스트 입력칸. 추가 스타일(marginBottom, minHeight 등)은 style로 넘긴다. */
export function TextField({ compact, style, ...props }: TextFieldProps) {
  return <TextInput style={[styles.field, compact && styles.fieldCompact, style]} {...props} />;
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonDanger: { backgroundColor: colors.bad },
  buttonLabel: { color: colors.primaryText, fontSize: 16, fontWeight: "600" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.chip,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipLabel: { fontSize: 15, color: colors.text },
  field: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: colors.text,
  },
  fieldCompact: { paddingVertical: 6, paddingHorizontal: 10, fontSize: 15 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.sub,
    marginTop: 16,
    marginBottom: 6,
  },
});
