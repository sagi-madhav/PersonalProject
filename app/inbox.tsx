import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text } from '../src/components';
import { useTheme } from '../src/theme';

export default function InboxScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen edges={['top', 'bottom']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">Inbox</Text>
        <Pressable
          accessibilityLabel="Close"
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="xmark" tintColor={colors.textSecondary} size={20} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Inbox capture and triage placeholder (Owned by Blocks-Calendar Agent)
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
