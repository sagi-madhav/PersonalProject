import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Markdown from 'react-native-markdown-display';
import { Screen, Text } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { PYTHON_CHEAT_SHEET } from '../../../content';

export default function PythonCheatSheetScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const markdownStyles = {
    body: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    heading1: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700' as const,
      marginBottom: 12,
    },
    heading3: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600' as const,
      marginTop: 16,
      marginBottom: 6,
    },
    code_block: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.hairline,
      borderWidth: 0.5,
      borderRadius: 8,
      padding: 12,
      fontFamily: 'Menlo',
      fontSize: 13,
      color: colors.text,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.hairline,
      borderWidth: 0.5,
      borderRadius: 8,
      padding: 12,
      fontFamily: 'Menlo',
      fontSize: 13,
      color: colors.text,
      marginVertical: 8,
    },
  };

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
        </Pressable>
        <Text variant="title">Python Cheat Sheet</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Markdown style={markdownStyles}>{PYTHON_CHEAT_SHEET}</Markdown>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
