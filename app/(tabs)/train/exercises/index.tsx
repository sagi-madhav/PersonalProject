import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, Text } from '@/components';
import { useTheme } from '@/theme';

export default function ExercisesListScreen() {
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">Exercises</Text>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Exercise library placeholder (Owned by Train Agent)
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
