import React from 'react';
import {
  View,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { lightHaptic } from '../lib/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  pill?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  variant = 'primary',
  style,
  loading = false,
  pill = true,
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled,
  onPress,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress: PressableProps['onPress'] = (e) => {
    if (disabled || loading) return;
    lightHaptic();
    onPress?.(e);
  };

  let bg = colors.ink;
  let textColor = colors.inkText;
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    bg = colors.surfaceAlt;
    textColor = colors.text;
  } else if (variant === 'quiet') {
    bg = 'transparent';
    textColor = colors.text;
  } else if (variant === 'danger') {
    bg = colors.danger;
    textColor = '#FFFFFF';
  }

  const paddingVertical = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingHorizontal = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const minHeight = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: pill ? 999 : 8,
          paddingVertical,
          paddingHorizontal,
          minHeight,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}
          <Text
            variant={size === 'sm' ? 'caption' : 'bodyStrong'}
            color={textColor}
            style={styles.text}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  text: {
    textAlign: 'center',
  },
});
