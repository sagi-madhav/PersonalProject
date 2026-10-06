import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text, Button } from '../../src/components';
import { useTheme } from '../../src/theme';

export default function BlockEditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id, date, startMin } = useLocalSearchParams<{
    id: string;
    date?: string;
    startMin?: string;
  }>();

  const isNew = id === 'new';

  return (
    <Screen edges={['top', 'bottom']} padHorizontal>
      <View style={styles.header}>
        <Text variant="title">{isNew ? 'New Block' : 'Edit Block'}</Text>
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
          Block editor placeholder (Owned by Blocks-Calendar Agent)
        </Text>
        {date ? (
          <Text variant="caption" color={colors.textTertiary} style={{ marginTop: 4 }}>
            Date: {date} {startMin ? `Start: ${startMin}m` : ''}
          </Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button title="Save" onPress={() => router.back()} />
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
  footer: {
    paddingVertical: 16,
  },
});
