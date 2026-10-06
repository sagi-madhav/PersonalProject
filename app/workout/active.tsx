import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text, Button } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen edges={['top', 'bottom']} padHorizontal>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Close workout"
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="xmark" tintColor={colors.text} size={20} />
        </Pressable>
        <Text variant="bodyStrong">Workout · 00:00:00</Text>
        <Button
          title="Finish"
          size="sm"
          onPress={() => router.back()}
        />
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Active workout logger placeholder (Owned by Train Agent)
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
