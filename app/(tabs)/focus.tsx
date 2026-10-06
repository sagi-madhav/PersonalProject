import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Text } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function FocusScreen() {
  const { colors } = useTheme();
  const { label, topicId } = useLocalSearchParams<{ label?: string; topicId?: string }>();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">Focus</Text>
        <Text variant="caption">Pomodoro · Countdown · Stopwatch</Text>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Focus placeholder (Owned by Focus Agent)
        </Text>
        {label ? (
          <Text variant="caption" color={colors.accent} style={{ marginTop: 8 }}>
            Label: {label} {topicId ? `(${topicId})` : ''}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
