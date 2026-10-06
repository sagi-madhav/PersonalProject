import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { lightHaptic } from '../lib/haptics';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (!isSelected) {
                lightHaptic();
                onChange(opt.value);
              }
            }}
            style={[
              styles.item,
              isSelected && [
                styles.selectedItem,
                { backgroundColor: colors.surface, shadowColor: colors.text },
              ],
            ]}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text
              variant="caption"
              color={isSelected ? colors.text : colors.textSecondary}
              style={[styles.label, isSelected && styles.selectedLabel]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    alignSelf: 'flex-start',
  },
  item: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  selectedItem: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  label: {
    fontWeight: '500',
  },
  selectedLabel: {
    fontWeight: '600',
  },
});
