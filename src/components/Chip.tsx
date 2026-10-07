import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { lightHaptic } from '../lib/haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dotColor?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  selected = false,
  onPress,
  dotColor,
  icon,
  style,
}: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        lightHaptic();
        onPress?.();
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : colors.surfaceAlt,
          borderColor: colors.hairline,
          opacity: pressed && onPress ? 0.75 : 1,
        },
        style,
      ]}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      {icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
      <Text
        variant="caption"
        color={selected ? colors.inkText : colors.text}
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    minHeight: 32,
    borderWidth: 0.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  iconContainer: {
    marginRight: 6,
  },
  label: {
    fontWeight: '500',
  },
});
