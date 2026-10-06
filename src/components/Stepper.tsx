import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { lightHaptic } from '../lib/haptics';

export interface StepperProps {
  value: number;
  step?: number;
  min?: number;
  max?: number;
  format?: (val: number) => string;
  onChange: (val: number) => void;
  label?: string;
}

export function Stepper({
  value,
  step = 1,
  min = 0,
  max = 9999,
  format,
  onChange,
  label,
}: StepperProps) {
  const { colors } = useTheme();

  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));
    if (next !== value) {
      lightHaptic();
      onChange(next);
    }
  };

  const handleIncrement = () => {
    const next = Math.min(max, Number((value + step).toFixed(2)));
    if (next !== value) {
      lightHaptic();
      onChange(next);
    }
  };

  const formatted = format ? format(value) : value.toString();

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="caption" color={colors.textSecondary} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.control, { backgroundColor: colors.surfaceAlt }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease value"
          onPress={handleDecrement}
          disabled={value <= min}
          style={({ pressed }) => [
            styles.button,
            { opacity: value <= min ? 0.3 : pressed ? 0.6 : 1 },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="heading" color={colors.text}>
            −
          </Text>
        </Pressable>

        <View style={styles.valueContainer}>
          <Text variant="bodyStrong" tabular color={colors.text}>
            {formatted}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase value"
          onPress={handleIncrement}
          disabled={value >= max}
          style={({ pressed }) => [
            styles.button,
            { opacity: value >= max ? 0.3 : pressed ? 0.6 : 1 },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text variant="heading" color={colors.text}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    marginBottom: 4,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 2,
    minHeight: 44,
  },
  button: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
