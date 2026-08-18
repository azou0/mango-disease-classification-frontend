import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

const COLORS = {
  primary: "#2E7D5B",
  primaryPressed: "#25634899",
  text: "#1A2B22",
  border: "#CBD6CE",
  white: "#FFFFFF",
  disabledBg: "#C7D2CB",
};

export default function ButtonPrimary({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            color={variant === "primary" ? COLORS.white : COLORS.primary}
          />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52, // comfortable 44px+ touch target
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: COLORS.disabledBg,
    borderColor: "transparent",
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  secondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
};

const textStyles: Record<Variant, { color: string }> = {
  primary: { color: COLORS.white },
  secondary: { color: COLORS.text },
  ghost: { color: COLORS.primary },
};
