import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { Screen, Text, Button, EmptyState, AppIcon } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { useSettingsStore } from '../../../src/lib/settingsStore';
import { workoutsRepo } from '../../../src/db/repos/workoutsRepo';
import { exercisesRepo } from '../../../src/db/repos/exercisesRepo';
import { WorkoutRecord, WorkoutSetRecord, ExerciseRecord } from '../../../src/db/types';
import { formatWeight } from '../../../src/lib/units';
import { checkAndSeedExercises } from '../../../src/features/train/seedExercises';
import { SPLIT_ROUTINES, WorkoutRoutine } from '../../../src/features/train/routines';

const DRAFT_WORKOUT_KEY = 'planner-draft-workout-v1';
const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function TrainHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [hasDraft, setHasDraft] = useState(false);
  const [draftTitle, setDraftTitle] = useState('Workout in progress');
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutRecord[]>([]);
  const [setsByWorkout, setSetsByWorkout] = useState<Record<string, WorkoutSetRecord[]>>({});
  const [exercisesMap, setExercisesMap] = useState<Record<string, ExerciseRecord>>({});
  const [totalExercisesCount, setTotalExercisesCount] = useState(0);
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [thisWeekVolumeKg, setThisWeekVolumeKg] = useState(0);
  const [activeDaysMask, setActiveDaysMask] = useState<boolean[]>([false, false, false, false, false, false, false]);

  const loadData = useCallback(async () => {
    try {
      // 1. Seed exercises if empty & fetch
      await checkAndSeedExercises();
      const allEx = await exercisesRepo.getAll(false);
      setTotalExercisesCount(allEx.length);
      const exMap: Record<string, ExerciseRecord> = {};
      allEx.forEach((e) => {
        exMap[e.id] = e;
      });
      setExercisesMap(exMap);

      // 2. Check draft
      const draft = await AsyncStorage.getItem(DRAFT_WORKOUT_KEY);
      if (draft) {
        setHasDraft(true);
        try {
          const parsed = JSON.parse(draft);
          if (parsed.title) setDraftTitle(parsed.title);
        } catch {}
      } else {
        setHasDraft(false);
      }

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

  const handleStartRoutine = (routine: WorkoutRoutine) => {
    router.push({
      pathname: '/workout/active',
      params: { routineId: routine.id },
    });
  };

  return (
    <Screen edges={['top']} padHorizontal>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header - Hevy Style */}
        <View style={styles.header}>
          <View>
            <Text variant="title">Workout</Text>
            <Text variant="caption" color={colors.textSecondary}>
              Upper/Lower + Biceps Split
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(tabs)/train/history')}
              style={[styles.headerIconBtn, { backgroundColor: colors.surfaceAlt }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="time-outline" color={colors.text} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Quick Start Card (Hevy Banner) */}
        {hasDraft ? (
          <View style={[styles.draftCard, { backgroundColor: colors.surface, borderColor: '#10B981' }]}>
            <View style={styles.draftCardHeader}>
              <View style={styles.draftPulseRow}>
                <View style={[styles.pulsingDot, { backgroundColor: '#10B981' }]} />
                <Text variant="bodyStrong" color="#10B981">
                  Workout In Progress
                </Text>
              </View>
              <Text variant="caption" color={colors.textSecondary}>
                {draftTitle}
              </Text>
            </View>
            <Button
              title="Resume Workout"
              variant="primary"
              icon={<AppIcon name="play" size={16} color="#FFF" />}
              style={{ backgroundColor: '#10B981', borderColor: '#10B981', marginTop: 10 }}
              onPress={() => router.push('/workout/active')}
            />
          </View>
        ) : (
          <View style={[styles.quickStartCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={styles.quickStartInfo}>
              <Text variant="bodyStrong">Quick Start</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Start an empty workout or pick from your split below
              </Text>
            </View>
            <Button
              title="Start Empty Workout"
              variant="primary"
              icon={<AppIcon name="add" size={16} color={colors.inkText} />}
              onPress={() => router.push('/workout/active')}
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        {/* Routines Section: Upper / Lower + Biceps Split */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="barbell-outline" size={18} color={colors.accent} />
              <Text variant="bodyStrong">My Split Routines</Text>
            </View>
            <Text variant="micro" color={colors.textSecondary} style={styles.splitTag}>
              UPPER / LOWER + BICEPS
            </Text>
          </View>

          {SPLIT_ROUTINES.map((routine) => {
            const exerciseNames = routine.exercises.map((e) => e.name).join(' · ');

            return (
              <View
                key={routine.id}
                style={[
                  styles.routineCard,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <View style={styles.routineTopRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text variant="micro" color={colors.accent} style={{ fontWeight: '700', marginBottom: 2 }}>
                      {routine.splitDay.toUpperCase()}
                    </Text>
                    <Text variant="bodyStrong" style={styles.routineTitle}>
                      {routine.title}
                    </Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {routine.subtitle}
                    </Text>
                  </View>

                  <Button
                    title="Start"
                    size="sm"
                    variant="primary"
                    icon={<AppIcon name="play" size={14} color={colors.inkText} />}
                    onPress={() => handleStartRoutine(routine)}
                    style={styles.routineStartBtn}
                  />
                </View>

                {/* Muscle tags */}
                <View style={styles.routineTagsRow}>
                  {routine.muscleGroups.map((mg) => (
                    <View
                      key={mg}
                      style={[styles.muscleBadge, { backgroundColor: colors.surfaceAlt }]}
                    >
                      <Text variant="micro" color={colors.textSecondary} style={{ fontWeight: '600' }}>
                        {mg.toUpperCase()}
                      </Text>
                    </View>
                  ))}
                  <Text variant="micro" color={colors.textTertiary} style={{ marginLeft: 'auto' }}>
                    {routine.exercises.length} exercises
                  </Text>
                </View>

                {/* Exercise List Preview */}
                <View style={[styles.routinePreviewBox, { backgroundColor: colors.surfaceAlt }]}>
                  <Text
                    variant="micro"
                    color={colors.textTertiary}
                    numberOfLines={2}
                    style={styles.routinePreviewText}
                  >
                    {exerciseNames}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekly Consistency / Habit Streak (Hevy Style) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="calendar-outline" size={16} color={colors.accent} />
              <Text variant="bodyStrong">Weekly Consistency</Text>
            </View>
            <Text variant="caption" color={colors.textSecondary}>
              {thisWeekSessions} {thisWeekSessions === 1 ? 'workout' : 'workouts'}
            </Text>
          </View>

          <View style={styles.weekStatsRow}>
            <View>
              <Text variant="micro" color={colors.textTertiary}>
                TOTAL VOLUME
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
                    variant="micro"
                    color={isToday ? colors.accent : colors.textTertiary}
                    style={[styles.dayLabel, isToday && { fontWeight: '800' }]}
                  >
                    {dayLabel}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isDone ? '#10B981' : colors.surfaceAlt,
                        borderColor: isToday ? colors.accent : 'transparent',
                        borderWidth: isToday ? 1.5 : 0,
                      },
                    ]}
                  >
                    {isDone ? <AppIcon name="checkmark" size={10} color="#FFF" /> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Workouts (Hevy Workout Feed) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="time-outline" size={18} color={colors.accent} />
              <Text variant="bodyStrong">Recent Workouts</Text>
            </View>
            {recentWorkouts.length > 0 && (
              <Pressable
                onPress={() => router.push('/(tabs)/train/history')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
              >
                <Text variant="caption" color={colors.accent}>
                  View all
                </Text>
                <AppIcon name="chevron-forward" size={13} color={colors.accent} />
              </Pressable>
            )}
          </View>

          {recentWorkouts.length === 0 ? (
            <EmptyState
              iconName="barbell-outline"
              message="No workouts logged yet. Pick a split routine or start an empty workout!"
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

              // Unique exercises in this workout
              const uniqueExIds = Array.from(new Set(wSets.map((s) => s.exercise_id)));
              const exerciseSummaries = uniqueExIds.map((eId) => {
                const ex = exercisesMap[eId];
                const count = wSets.filter((s) => s.exercise_id === eId).length;
                return `${count}× ${ex ? ex.name : 'Exercise'}`;
              });

              return (
                <View
                  key={workout.id}
                  style={[
                    styles.recentCard,
                    { backgroundColor: colors.surface, borderColor: colors.hairline },
                  ]}
                >
                  <View style={styles.recentCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{workout.title || 'Workout'}</Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {dateStr}
                      </Text>
                    </View>
                  </View>

                  {/* Stat pills row */}
                  <View style={styles.statPillsRow}>
                    <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt }]}>
                      <AppIcon name="timer-outline" size={13} color={colors.textSecondary} />
                      <Text variant="caption" tabular color={colors.textSecondary}>
                        {durationMin} min
                      </Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt }]}>
                      <AppIcon name="flash-outline" size={13} color={colors.accent} />
                      <Text variant="caption" tabular color={colors.accent} style={{ fontWeight: '700' }}>
                        {formatWeight(volume, settings.unit)}
                      </Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt }]}>
                      <AppIcon name="layers-outline" size={13} color={colors.textSecondary} />
                      <Text variant="caption" tabular color={colors.textSecondary}>
                        {wSets.length} sets
                      </Text>
                    </View>
                  </View>

                  {/* Completed exercises preview */}
                  {exerciseSummaries.length > 0 ? (
                    <View style={[styles.recentExerciseBox, { backgroundColor: colors.surfaceAlt }]}>
                      <Text variant="micro" color={colors.textTertiary} numberOfLines={2}>
                        {exerciseSummaries.join('  ·  ')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {/* Secondary Navigation Row: Exercises & History */}
        <View style={styles.secondaryNavRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/train/exercises')}
            style={[styles.secondaryCardBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <View style={styles.secondaryCardIcon}>
              <AppIcon name="barbell-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Exercise Library</Text>
              <Text variant="caption" color={colors.textSecondary}>
                {totalExercisesCount} exercises & setups
              </Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/train/history')}
            style={[styles.secondaryCardBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <View style={styles.secondaryCardIcon}>
              <AppIcon name="time-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Workout History</Text>
              <Text variant="caption" color={colors.textSecondary}>
                Full training log & PRs
              </Text>
            </View>
            <AppIcon name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
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
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  draftCardHeader: {
    marginBottom: 4,
  },
  draftPulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickStartCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 16,
  },
  quickStartInfo: {
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitTag: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  routineCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 12,
  },
  routineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routineTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  routineStartBtn: {
    minWidth: 70,
  },
  routineTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  muscleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routinePreviewBox: {
    padding: 8,
    borderRadius: 8,
  },
  routinePreviewText: {
    lineHeight: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekStatsRow: {
    marginBottom: 14,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    textAlign: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 12,
  },
  recentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recentExerciseBox: {
    padding: 8,
    borderRadius: 8,
  },
  secondaryNavRow: {
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  secondaryCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    gap: 12,
  },
  secondaryCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
