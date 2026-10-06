import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle, Platform } from 'react-native';
import { useTheme } from '../theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'micro'
  | 'mono';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  tabular?: boolean;
}

export function Text({
  variant = 'body',
  color,
  tabular = false,
  style,
  maxFontSizeMultiplier,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  const variantStyle: TextStyle = styles[variant] || styles.body;

  const fontVariant: TextStyle['fontVariant'] =
    tabular || variant === 'display' ? ['tabular-nums'] : undefined;

  const resolvedColor =
    color ||
    (variant === 'caption' ? colors.textSecondary : variant === 'micro' ? colors.textTertiary : colors.text);

  return (
    <RNText
      maxFontSizeMultiplier={variant === 'display' ? 1.2 : maxFontSizeMultiplier}
      style={[
        variantStyle,
        { color: resolvedColor },
        fontVariant ? { fontVariant } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 76,
    fontWeight: '300',
    lineHeight: 84,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  micro: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mono: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
});
