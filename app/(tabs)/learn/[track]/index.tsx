import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Screen, Text, ProgressBar, EmptyState } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';
import { getAllLessons, TrackId, Lesson } from '../../../../content';
import { learnRepo } from '../../../../src/db/repos/learnRepo';
import { LearnProgressRecord } from '../../../../src/db/types';

export default function TrackDetailScreen() {
  const router = useRouter();
  const { track } = useLocalSearchParams<{ track: string }>();
  const { colors } = useTheme();

  const [progressMap, setProgressMap] = useState<Record<string, LearnProgressRecord>>({});
  const lessons = getAllLessons(track as TrackId);

  const loadProgress = useCallback(async () => {
    try {
      const all = await learnRepo.getAll();
      const map: Record<string, LearnProgressRecord> = {};
      all.forEach((p) => {
        map[p.topic_id] = p;
      });
      setProgressMap(map);
    } catch (err) {
      console.warn('Failed to load track progress', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  // Group lessons by module
  const modulesMap = lessons.reduce((acc, l) => {
    if (!acc[l.module]) acc[l.module] = [];
    acc[l.module].push(l);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const moduleEntries = Object.entries(modulesMap);

  const completedCount = lessons.filter(
    (l) => progressMap[l.id]?.status === 'done'
  ).length;
  const progressRatio = lessons.length > 0 ? completedCount / lessons.length : 0;

  const trackTitle =
    track === 'python'
      ? 'Python 101'
      : track === 'dsa'
      ? 'DSA 101'
      : track === 'system-design'
      ? 'System Design'
      : 'Track';

  return (
    <Screen edges={['top']} padHorizontal>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
          </Pressable>
          <Text variant="title">{trackTitle}</Text>
        </View>
        <Text variant="bodyStrong" color={colors.accent}>
          {Math.round(progressRatio * 100)}%
        </Text>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={progressRatio} style={{ flex: 1 }} />
        <Text variant="caption" color={colors.textSecondary} style={{ marginLeft: 10 }}>
          {completedCount}/{lessons.length} done
        </Text>
      </View>

      <FlatList
        data={moduleEntries}
        keyExtractor={([modName]) => modName}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message="No lessons found for this track." />}
        renderItem={({ item: [modName, modLessons] }) => {
          const modDone = modLessons.filter(
            (l) => progressMap[l.id]?.status === 'done'
          ).length;

          return (
            <View
              style={[
                styles.moduleCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.moduleHeader}>
                <Text variant="bodyStrong">{modName}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {modDone}/{modLessons.length}
                </Text>
              </View>

              <View style={styles.lessonsList}>
                {modLessons.map((l) => {
                  const p = progressMap[l.id];
                  const isDone = p?.status === 'done';
                  const isLearning = p?.status === 'learning';

                  return (
                    <Pressable
                      key={l.id}
                      onPress={() =>
                        router.push(`/(tabs)/learn/${track}/${l.id}` as any)
                      }
                      style={[
                        styles.lessonRow,
                        { borderTopColor: colors.hairline },
                      ]}
                    >
                      <View style={styles.lessonInfo}>
                        <Text
                          variant="body"
                          color={isDone ? colors.textSecondary : colors.text}
                          style={isDone ? styles.strikethrough : undefined}
                        >
                          {l.title}
                        </Text>
                        <Text variant="caption" color={colors.textTertiary}>
                          ⏱ {l.estMinutes} mins
                        </Text>
                      </View>

                      <View style={styles.statusIndicator}>
                        {isDone ? (
                          <Text variant="caption" color={colors.accent}>
                            ✓ Done
                          </Text>
                        ) : isLearning ? (
                          <Text variant="caption" color={colors.textSecondary}>
                            ● Learning
                          </Text>
                        ) : (
                          <SymbolView
                            name="chevron.right"
                            tintColor={colors.textTertiary}
                            size={14}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        }}
      />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 30,
  },
  moduleCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 14,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lessonsList: {
    marginTop: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  lessonInfo: {
    flex: 1,
    paddingRight: 12,
  },
  strikethrough: {
    opacity: 0.8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
