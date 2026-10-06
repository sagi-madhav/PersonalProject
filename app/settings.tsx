import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text } from '../src/components';
import { useTheme } from '../src/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen edges={['top', 'bottom']} padHorizontal>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
        </Pressable>
        <Text variant="heading" style={{ marginLeft: 12 }}>Settings</Text>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Settings placeholder (Owned by Settings Agent)
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
