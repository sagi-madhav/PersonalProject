import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color,
  height = 3,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();

  const clamped = Math.min(1, Math.max(0, isNaN(progress) ? 0 : progress));
  const activeColor = color || colors.accent;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: colors.hairline,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            height,
            backgroundColor: activeColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
