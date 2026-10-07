import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Segmented, Chip, AppIcon } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { getBuildingBlocks, getCaseStudies } from '../../../content';

export default function SystemDesignDeckScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<'blocks' | 'cases'>('blocks');

  const buildingBlocks = getBuildingBlocks();
  const caseStudies = getCaseStudies();

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="chevron-back" color={colors.text} size={20} />
          </Pressable>
          <Text variant="title">System Design</Text>
        </View>
      </View>

      <View style={styles.segmentedRow}>
        <Segmented
          options={[
            { value: 'blocks', label: 'Building Blocks (12)' },
            { value: 'cases', label: 'Case Studies (8)' },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'blocks' | 'cases')}
        />
      </View>

      {activeTab === 'blocks' ? (
        <FlatList
          data={buildingBlocks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View
              style={[
                styles.blockCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <Text variant="bodyStrong" color={colors.accent} style={{ marginBottom: 4 }}>
                {item.title}
              </Text>
              <Text variant="body" color={colors.text} style={{ marginBottom: 12 }}>
                {item.summary}
              </Text>

              <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
                Key Concepts
              </Text>
              <View style={styles.chipsRow}>
                {item.keyConcepts.map((concept, idx) => (
                  <Chip key={idx} label={concept} selected={false} />
                ))}
              </View>

              <View
                style={[
                  styles.tradeoffsBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline },
                ]}
              >
                <Text variant="caption" color={colors.textTertiary}>
                  Trade-offs & Constraints:
                </Text>
                <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  {item.tradeoffs}
                </Text>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={caseStudies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/learn/case-study/${item.id}` as any)}
              style={[
                styles.caseCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.caseHeader}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {item.title}
                </Text>
                <AppIcon name="chevron-forward" color={colors.accent} size={16} />
              </View>
              <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                {item.description}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  segmentedRow: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  blockCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tradeoffsBox: {
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 10,
  },
  caseCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 12,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
