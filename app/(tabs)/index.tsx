import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <View>
          <Text variant="title">Today</Text>
          <Text variant="caption">Hour and 12h Timeline</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Inbox"
            onPress={() => router.push('/inbox')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="tray" tintColor={colors.text} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Add Block"
            onPress={() => router.push('/block/new')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="plus" tintColor={colors.text} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="gearshape" tintColor={colors.text} size={20} />
          </Pressable>
        </View>
      </View>
      <View style={styles.content}>
        <Text variant="body" color={colors.textSecondary}>
          Timeline placeholder (Owned by Timeline Agent)
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
