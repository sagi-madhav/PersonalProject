import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../../components/Text';

export interface RolloverBannerProps {
  unfinishedCount?: number;
  onMoveToToday?: () => void;
  onMoveToInbox?: () => void;
  onDismiss?: () => void;
}

export function RolloverBanner({
  unfinishedCount = 0,
  onMoveToToday,
  onMoveToInbox,
  onDismiss,
}: RolloverBannerProps) {
  const { colors } = useTheme();

  if (unfinishedCount <= 0) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline }]}>
      <Text variant="caption" color={colors.text} style={styles.text}>
        {unfinishedCount} unfinished from yesterday
      </Text>
      <View style={styles.actions}>
        {onMoveToToday ? (
          <Pressable onPress={onMoveToToday} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text variant="caption" color={colors.accent} style={styles.actionText}>
              Today
            </Text>
          </Pressable>
        ) : null}
        {onMoveToInbox ? (
          <Pressable onPress={onMoveToInbox} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text variant="caption" color={colors.textSecondary} style={styles.actionText}>
              Inbox
            </Text>
          </Pressable>
        ) : null}
        {onDismiss ? (
          <Pressable onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text variant="caption" color={colors.textTertiary} style={styles.actionText}>
              ✕
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 0.5,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionText: {
    fontWeight: '600',
  },
});
