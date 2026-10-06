import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, Text } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function CalendarScreen() {
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">Calendar</Text>
        <Text variant="caption">Month grid and agenda</Text>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Calendar placeholder (Owned by Blocks-Calendar Agent)
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
