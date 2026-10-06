import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Button } from '../../../src/components';
import { useTheme } from '../../../src/theme';

export default function TrainHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">Train</Text>
        <Text variant="caption">Workout logger and exercises</Text>
      </View>
      <View style={styles.actions}>
        <Button
          title="Start Workout"
          variant="primary"
          onPress={() => router.push('/workout/active')}
          style={{ marginBottom: 12 }}
        />
        <View style={styles.subActions}>
          <Button
            title="Exercises"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(tabs)/train/exercises')}
          />
          <Button
            title="History"
            variant="secondary"
            size="sm"
            onPress={() => router.push('/(tabs)/train/history')}
          />
        </View>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Train dashboard placeholder (Owned by Train Agent)
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
  },
  actions: {
    paddingVertical: 16,
  },
  subActions: {
    flexDirection: 'row',
    gap: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
