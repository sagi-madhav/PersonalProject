import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Text, ProgressBar } from '../../components';
import { useTheme } from '../../theme';
import { lightHaptic } from '../../lib/haptics';

export interface RestBarProps {
  remainingSeconds: number;
  totalDuration?: number;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

export function RestBar({
  remainingSeconds,
  totalDuration = 90,
  onAdjust,
  onSkip,
}: RestBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (remainingSeconds <= 0) return null;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const progress = Math.max(0, Math.min(1, remainingSeconds / totalDuration));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
          bottom: Math.max(insets.bottom, 16) + 10,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text variant="bodyStrong" tabular color={colors.accent}>
          Rest {timeStr}
        </Text>

        <View style={styles.controls}>
          <Pressable
            onPress={() => onAdjust(-15)}
            style={styles.adjustBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text variant="caption" color={colors.textSecondary}>
              -15s
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onAdjust(15)}
            style={styles.adjustBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text variant="caption" color={colors.textSecondary}>
              +15s
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              lightHaptic();
              onSkip();
            }}
            style={styles.skipBtn}
            accessibilityLabel="Skip rest timer"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="xmark" tintColor={colors.textSecondary} size={16} />
          </Pressable>
        </View>
      </View>

      <ProgressBar progress={progress} height={3} color={colors.accent} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  skipBtn: {
    padding: 2,
  },
});
