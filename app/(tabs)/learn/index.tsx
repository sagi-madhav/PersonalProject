import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Screen, Text, Button, Segmented, ProgressBar, AppIcon } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { getAllLessons, TrackId, Lesson } from '../../../content';
import { learnRepo } from '../../../src/db/repos/learnRepo';
import { LearnProgressRecord } from '../../../src/db/types';

export default function LearnHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [activeTrack, setActiveTrack] = useState<TrackId>('python');
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [progressMap, setProgressMap] = useState<Record<string, LearnProgressRecord>>({});

  const loadLearnData = useCallback(async () => {
    try {
      const dues = await learnRepo.getDueReviews(Date.now());
      setDueReviewsCount(dues.length);

      const all = await learnRepo.getAll();
      const map: Record<string, LearnProgressRecord> = {};
      all.forEach((p) => {
        map[p.topic_id] = p;
      });
      setProgressMap(map);
    } catch (err) {
      console.warn('Failed to load learn data', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLearnData();
    }, [loadLearnData])
  );

  const trackLessons = getAllLessons(activeTrack);
  const completedCount = trackLessons.filter(
    (l) => progressMap[l.id]?.status === 'done'
  ).length;
  const trackRatio =
    trackLessons.length > 0 ? completedCount / trackLessons.length : 0;
  const trackPercent = Math.round(trackRatio * 100);

  // Group lessons by module
  const modulesMap = trackLessons.reduce((acc, l) => {
    if (!acc[l.module]) acc[l.module] = [];
    acc[l.module].push(l);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const moduleEntries = Object.entries(modulesMap);

  return (
    <Screen edges={['top']} padHorizontal>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="title">Learn</Text>
            <Text variant="caption" color={colors.textSecondary}>
              Personal engineering curriculum
            </Text>
          </View>
          <View style={styles.headerPercent}>
            <Text variant="title" color={colors.accent}>
              {trackPercent}%
            </Text>
            <Text variant="caption" color={colors.textSecondary}>
              Complete
            </Text>
          </View>
        </View>

        {/* Track Segmented Control */}
        <View style={styles.segmentedWrapper}>
          <Segmented
            options={[
              { value: 'python', label: 'Python 101' },
              { value: 'dsa', label: 'DSA 101' },
              { value: 'system-design', label: 'Sys Design' },
            ]}
            value={activeTrack}
            onChange={(val) => setActiveTrack(val as TrackId)}
          />
        </View>

        {/* Review Due Banner (Hidden when zero) */}
        {dueReviewsCount > 0 && (
          <View
            style={[
              styles.reviewDueCard,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.accent },
            ]}
          >
            <View style={styles.reviewDueHeader}>
              <View style={styles.reviewDueTitleRow}>
                <AppIcon
                  name="flame"
                  color={colors.accent}
                  size={20}
                />
                <Text variant="bodyStrong" color={colors.accent}>
                  {dueReviewsCount} {dueReviewsCount === 1 ? 'card' : 'cards'} due for review
                </Text>
              </View>
            </View>
            <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 10 }}>
              Keep your retention high with quick spaced-repetition recalls.
            </Text>
            <Button
              title="Start Review Session"
              variant="primary"
              size="sm"
              icon={<AppIcon name="play" size={15} color={colors.inkText} />}
              onPress={() => router.push('/(tabs)/learn/review')}
            />
          </View>
        )}

        {/* Modules List */}
        <View style={styles.modulesSection}>
          <Text variant="bodyStrong" style={{ marginBottom: 12 }}>
            Curriculum Modules
          </Text>

          {moduleEntries.map(([modName, modLessons]) => {
            const modDone = modLessons.filter(
              (l) => progressMap[l.id]?.status === 'done'
            ).length;
            const modRatio = modLessons.length > 0 ? modDone / modLessons.length : 0;

            return (
              <View
                key={modName}
                style={[
                  styles.moduleCard,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <View style={styles.moduleCardHeader}>
                  <Text variant="bodyStrong">{modName}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {modDone}/{modLessons.length}
                  </Text>
                </View>
                <ProgressBar progress={modRatio} style={{ marginBottom: 12 }} />

                {/* Lessons inside module */}
                <View style={styles.lessonsContainer}>
                  {modLessons.map((lesson) => {
                    const p = progressMap[lesson.id];
                    const isDone = p?.status === 'done';
                    const isLearning = p?.status === 'learning';

                    return (
                      <Pressable
                        key={lesson.id}
                        onPress={() =>
                          router.push({
                            pathname: '/(tabs)/learn/[track]/[topicId]',
                            params: { track: activeTrack, topicId: lesson.id },
                          })
                        }
                        style={[
                          styles.lessonRow,
                          { borderTopColor: colors.hairline },
                        ]}
                      >
                        <View style={styles.lessonRowInfo}>
                          <Text
                            variant="body"
                            color={isDone ? colors.textSecondary : colors.text}
                          >
                            {lesson.title}
                          </Text>
                          <Text variant="caption" color={colors.textTertiary}>
                            ⏱ {lesson.estMinutes} mins
                          </Text>
                        </View>

                        <View style={styles.statusCol}>
                          {isDone ? (
                            <Text variant="caption" color={colors.accent}>
                              ✓ Done
                            </Text>
                          ) : isLearning ? (
                            <Text variant="caption" color={colors.textSecondary}>
                              ● In progress
                            </Text>
                          ) : (
                            <AppIcon
                              name="chevron-forward"
                              color={colors.textTertiary}
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
          })}
        </View>

        {/* Track-Specific Extras */}
        <View style={styles.extrasSection}>
          <Text variant="bodyStrong" style={{ marginBottom: 12 }}>
            Track Extras
          </Text>

          {activeTrack === 'python' && (
            <Pressable
              onPress={() => router.push('/(tabs)/learn/python-cheatsheet')}
              style={[
                styles.extraCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.extraIcon}>
                <AppIcon family="ion" name="logo-python" color={colors.accent} size={26} />
              </View>
              <View style={styles.extraInfo}>
                <Text variant="bodyStrong">Python Cheat Sheet</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Syntax quick-reference: slicing, comprehensions, context managers, dataclasses
                </Text>
              </View>
              <AppIcon name="chevron-forward" color={colors.textTertiary} size={14} />
            </Pressable>
          )}

          {activeTrack === 'dsa' && (
            <Pressable
              onPress={() => router.push('/(tabs)/learn/dsa-problems')}
              style={[
                styles.extraCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.extraIcon}>
                <AppIcon family="ion" name="code-slash" color={colors.accent} size={24} />
              </View>
              <View style={styles.extraInfo}>
                <Text variant="bodyStrong">DSA Problems Tracker</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Track LeetCode questions, patterns, difficulty, and review reminders
                </Text>
              </View>
              <AppIcon name="chevron-forward" color={colors.textTertiary} size={14} />
            </Pressable>
          )}

          {activeTrack === 'system-design' && (
            <Pressable
              onPress={() => router.push('/(tabs)/learn/system-design-deck')}
              style={[
                styles.extraCard,
                { backgroundColor: colors.surface, borderColor: colors.hairline },
              ]}
            >
              <View style={styles.extraIcon}>
                <AppIcon family="ion" name="layers-outline" color={colors.accent} size={24} />
              </View>
              <View style={styles.extraInfo}>
                <Text variant="bodyStrong">Building Blocks & Case Studies</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  12 architectural components & 8 end-to-end case study templates
                </Text>
              </View>
              <AppIcon name="chevron-forward" color={colors.textTertiary} size={14} />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  headerPercent: {
    alignItems: 'flex-end',
  },
  segmentedWrapper: {
    marginVertical: 12,
  },
  reviewDueCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  reviewDueHeader: {
    marginBottom: 6,
  },
  reviewDueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modulesSection: {
    marginBottom: 20,
  },
  moduleCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 14,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonsContainer: {
    marginTop: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  lessonRowInfo: {
    flex: 1,
    paddingRight: 10,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  extrasSection: {
    marginTop: 8,
  },
  extraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 12,
  },
  extraIcon: {
    marginRight: 14,
  },
  extraInfo: {
    flex: 1,
    paddingRight: 10,
  },
});
