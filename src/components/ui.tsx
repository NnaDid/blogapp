import type { ReactNode } from 'react';
// @ts-ignore -- react-native types may be provided by the consuming app.
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';

export const palette = {
  background: '#F6F5F1',
  surface: '#FFFFFF',
  ink: '#20251F',
  muted: '#777D75',
  line: '#E8E8E1',
  green: '#345C44',
  greenSoft: '#EAF0E9',
  orange: '#D67B4A',
  danger: '#A64242',
};

export function Page({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.page, style]}>{children}</View>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={palette.muted}
      selectionColor={palette.green}
      style={[styles.field, props.multiline && styles.multiline]}
      {...props}
    />
  );
}

export function Button({
  title,
  onPress,
  disabled,
  secondary,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={secondary ? palette.green : palette.surface} />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Notice({ children, danger = false }: { children: string; danger?: boolean }) {
  return (
    <Text style={[styles.notice, danger && styles.dangerNotice]} accessibilityRole="alert">
      {children}
    </Text>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.green} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  heading: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 18,
  },
  field: {
    minHeight: 54,
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    color: palette.ink,
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  multiline: {
    minHeight: 132,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  button: {
    minHeight: 52,
    backgroundColor: palette.green,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButton: {
    backgroundColor: palette.greenSoft,
  },
  buttonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: palette.green,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
  notice: {
    color: palette.green,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: palette.greenSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  dangerNotice: {
    color: palette.danger,
    backgroundColor: '#F8EAEA',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.background,
  },
  loadingLabel: {
    color: palette.muted,
    fontSize: 14,
  },
});
