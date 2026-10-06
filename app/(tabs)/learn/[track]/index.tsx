import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Text } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';

export default function TrackDetailScreen() {
  const { track } = useLocalSearchParams<{ track: string }>();
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">{track ? track.toUpperCase() : 'Track'}</Text>
        <Text variant="caption">Modules and Topics</Text>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Track detail placeholder (Owned by Learn Agent)
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
