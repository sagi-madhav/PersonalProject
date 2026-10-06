import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, Text } from '../../../src/components';
import { useTheme } from '../../../src/theme';

export default function LearnHomeScreen() {
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">Learn</Text>
        <Text variant="caption">Python 101 · DSA 101 · System Design</Text>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Learn placeholder (Owned by Learn Agent)
        </Text>
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
