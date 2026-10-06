import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { Screen, Text, Button, EmptyState } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { useSettingsStore } from '../../../src/lib/settingsStore';
import { workoutsRepo } from '../../../src/db/repos/workoutsRepo';
import { WorkoutRecord, WorkoutSetRecord } from '../../../src/db/types';
import { formatWeight } from '../../../src/lib/units';
import { formatDurationMinutes } from '../../../src/lib/time';
import { checkAndSeedExercises } from '../../../src/features/train/seedExercises';

const DRAFT_WORKOUT_KEY = 'planner-draft-workout-v1';
const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function TrainHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [hasDraft, setHasDraft] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutRecord[]>([]);
  const [setsByWorkout, setSetsByWorkout] = useState<Record<string, WorkoutSetRecord[]>>({});
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [thisWeekVolumeKg, setThisWeekVolumeKg] = useState(0);
  const [activeDaysMask, setActiveDaysMask] = useState<boolean[]>([false, false, false, false, false, false, false]);

  const loadData = useCallback(async () => {
    try {
      // 1. Seed exercises if empty
      await checkAndSeedExercises();

      // 2. Check draft
      const draft = await AsyncStorage.getItem(DRAFT_WORKOUT_KEY);
      setHasDraft(!!draft);

      // 3. Workouts
      const workouts = await workoutsRepo.getAll();
      setRecentWorkouts(workouts.slice(0, 3));

      // 4. Sets
      const allSets = await workoutsRepo.getAllSets();
      const grouped: Record<string, WorkoutSetRecord[]> = {};
      for (const s of allSets) {
        if (!grouped[s.workout_id]) grouped[s.workout_id] = [];
        grouped[s.workout_id].push(s);
      }
      setSetsByWorkout(grouped);

      // 5. Calculate "This Week" (Mon - Sun)
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      const mask = [false, false, false, false, false, false, false];
      let sessionsCount = 0;
      let totalVolume = 0;

      for (const w of workouts) {
        const wDate = new Date(w.started_at);
        weekDays.forEach((day, index) => {
          if (isSameDay(wDate, day)) {
            mask[index] = true;
          }
        });

        // If workout falls within this week
        if (wDate >= weekStart && wDate <= addDays(weekStart, 7)) {
          sessionsCount += 1;
          const wSets = grouped[w.id] || [];
          for (const s of wSets) {
            if (!s.is_warmup && s.weight_kg && s.reps) {
              totalVolume += s.weight_kg * s.reps;
            }
          }
        }
      }

      setActiveDaysMask(mask);
      setThisWeekSessions(sessionsCount);
      setThisWeekVolumeKg(totalVolume);
    } catch (err) {
      console.warn('Failed to load train dashboard', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  return (
    <Screen edges={['top']} padHorizontal>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title">Train</Text>
          <Text variant="caption" color={colors.textSecondary}>
            Workout logger & machine notes
          </Text>
        </View>

        {/* Primary CTA */}
        <View style={styles.primaryActionSection}>
          <Button
            title={hasDraft ? 'Resume Workout' : 'Start Workout'}
            variant="primary"
            onPress={() => router.push('/workout/active')}
          />
          {hasDraft && (
            <Text variant="caption" color={colors.accent} style={styles.draftBadge}>
              ● Workout in progress
            </Text>
          )}
        </View>

        {/* Secondary Navigation Row */}
        <View style={styles.secondaryNavRow}>
          <View style={styles.secondaryNavCol}>
            <Button
              title="Exercises"
              variant="secondary"
              onPress={() => router.push('/(tabs)/train/exercises')}
            />
          </View>
          <View style={styles.secondaryNavCol}>
            <Button
              title="History"
              variant="secondary"
              onPress={() => router.push('/(tabs)/train/history')}
            />
          </View>
        </View>

        {/* This Week Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          <View style={styles.cardHeader}>
            <Text variant="bodyStrong">This Week</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {thisWeekSessions} {thisWeekSessions === 1 ? 'session' : 'sessions'}
            </Text>
          </View>

          <View style={styles.weekStatsRow}>
            <View>
              <Text variant="caption" color={colors.textSecondary}>
                Total Volume
              </Text>
              <Text variant="title" color={colors.accent} style={{ marginTop: 2 }}>
                {formatWeight(thisWeekVolumeKg, settings.unit)}
              </Text>
            </View>
          </View>

          {/* 7-Day Mini Dots */}
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((dayLabel, idx) => {
              const isDone = activeDaysMask[idx];
              const isToday = idx === todayIndex;

              return (
                <View key={idx} style={styles.dayCol}>
                  <Text
                    variant="caption"
                    color={isToday ? colors.accent : colors.textTertiary}
                    style={styles.dayLabel}
                  >
                    {dayLabel}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isDone
                          ? colors.accent
                          : colors.surfaceAlt,
                        borderColor: isToday ? colors.accent : 'transparent',
                        borderWidth: isToday ? 1.5 : 0,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Workouts Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text variant="bodyStrong">Recent Workouts</Text>
            {recentWorkouts.length > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/train/history')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="caption" color={colors.accent}>
                  View all
                </Text>
              </Pressable>
            )}
          </View>

          {recentWorkouts.length === 0 ? (
            <EmptyState
              message="No workouts logged yet. Tap Start Workout to begin!"
              style={{ paddingVertical: 24 }}
            />
          ) : (
            recentWorkouts.map((workout) => {
              const wSets = setsByWorkout[workout.id] || [];
              const volume = wSets.reduce((sum, s) => {
                if (s.is_warmup || !s.weight_kg || !s.reps) return sum;
                return sum + s.weight_kg * s.reps;
              }, 0);
              const durationMs = workout.ended_at ? workout.ended_at - workout.started_at : 0;
              const durationMin = Math.round(durationMs / 60000);
              const dateStr = format(new Date(workout.started_at), 'EEE, MMM d');

              return (
                <View
                  key={workout.id}
                  style={[
                    styles.workoutRowCard,
                    { backgroundColor: colors.surface, borderColor: colors.hairline },
                  ]}
                >
                  <View style={styles.workoutRowMain}>
                    <Text variant="bodyStrong">{workout.title || 'Workout'}</Text>
                    <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      {dateStr} · {formatDurationMinutes(durationMin)} · {wSets.length} sets
                    </Text>
                  </View>
                  <Text variant="bodyStrong" color={colors.accent}>
                    {formatWeight(volume, settings.unit)}
                  </Text>
                </View>
              );
            })
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
    paddingVertical: 12,
  },
  primaryActionSection: {
    marginVertical: 12,
  },
  draftBadge: {
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  secondaryNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  secondaryNavCol: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekStatsRow: {
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  recentSection: {
    marginTop: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
  },
  workoutRowMain: {
    flex: 1,
    paddingRight: 12,
  },
});
