import type { ReactNode } from "react";
import {
  Platform,
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
  text: "#0b0b0b",
  sub: "#6e6e6e",
  line: "#e4e4e4",
  primary: "#0b0b0b",
  primaryText: "#ffffff",
  good: "#0b0b0b",
  bad: "#b3261e",
  chip: "#f3f3f3",
};

/**
 * 제목·숫자용 서체. 웹은 index.html에서 불러온 Playfair Display(영문·숫자)와 Noto Serif KR(한글),
 * iOS·Android 앱은 기본 세리프로 대체한다(새 의존성 없음).
 */
export const fonts = {
  serif: Platform.select({
    web: "'Playfair Display', 'Noto Serif KR', serif",
    ios: "Georgia",
    default: "serif",
  }),
};

/** Playfair Display의 숫자는 기본이 아래로 내려가는 옛 서체 숫자라, 숫자는 줄에 맞는 모양으로 쓴다. */
export const liningNums = { fontVariant: ["lining-nums" as const] };

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
    borderColor: colors.text,
  },
  buttonDanger: { backgroundColor: colors.bad },
  buttonLabel: { color: colors.primaryText, fontSize: 15, fontWeight: "500", letterSpacing: 1 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.text,
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
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.serif,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
  },
});
