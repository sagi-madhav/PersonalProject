import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { Screen, Text, EmptyState, AppIcon } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { useSettingsStore } from '../../../src/lib/settingsStore';
import { workoutsRepo } from '../../../src/db/repos/workoutsRepo';
import { exercisesRepo } from '../../../src/db/repos/exercisesRepo';
import { WorkoutRecord, WorkoutSetRecord, ExerciseRecord } from '../../../src/db/types';
import { formatWeight } from '../../../src/lib/units';
import { formatDurationMinutes } from '../../../src/lib/time';
import { notificationWarning } from '../../../src/lib/haptics';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [setsByWorkout, setSetsByWorkout] = useState<Record<string, WorkoutSetRecord[]>>({});
  const [exercisesMap, setExercisesMap] = useState<Record<string, ExerciseRecord>>({});

  const loadHistory = useCallback(async () => {
    try {
      const allEx = await exercisesRepo.getAll(false);
      const exMap: Record<string, ExerciseRecord> = {};
      allEx.forEach((e) => {
        exMap[e.id] = e;
      });
      setExercisesMap(exMap);

      const list = await workoutsRepo.getAll();
      setWorkouts(list);

      const allSets = await workoutsRepo.getAllSets();
      const grouped: Record<string, WorkoutSetRecord[]> = {};
      for (const s of allSets) {
        if (!grouped[s.workout_id]) grouped[s.workout_id] = [];
        grouped[s.workout_id].push(s);
      }
      setSetsByWorkout(grouped);
    } catch (err) {
      console.warn('Failed to load workout history', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDelete = (workout: WorkoutRecord) => {
    Alert.alert('Delete Workout', 'Remove this workout from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await workoutsRepo.delete(workout.id);
          notificationWarning();
          loadHistory();
        },
      },
    ]);
  };

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
          <Text variant="title">Workout History</Text>
        </View>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState iconName="time-outline" message="No logged workouts yet." />}
        renderItem={({ item }) => {
          const wSets = setsByWorkout[item.id] || [];
          const totalVolumeKg = wSets.reduce((sum, s) => {
            if (s.is_warmup || !s.weight_kg || !s.reps) return sum;
            return sum + s.weight_kg * s.reps;
          }, 0);

          const durationMs = item.ended_at ? item.ended_at - item.started_at : 0;
          const durationMin = Math.round(durationMs / 60000);
          const dateStr = format(new Date(item.started_at), 'EEEE, MMM d, yyyy');

          // Group sets by exercise
          const exerciseGroups: { exerciseName: string; setsCount: number; maxWeightKg: number }[] = [];
          const uniqueExIds = Array.from(new Set(wSets.map((s) => s.exercise_id)));
          for (const eId of uniqueExIds) {
            const exSets = wSets.filter((s) => s.exercise_id === eId);
            const ex = exercisesMap[eId];
            const maxW = Math.max(0, ...exSets.map((s) => s.weight_kg || 0));
            exerciseGroups.push({
              exerciseName: ex ? ex.name : 'Exercise',
              setsCount: exSets.length,
              maxWeightKg: maxW,
            });
          }

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                    {item.title || 'Workout'}
                  </Text>
                  <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {dateStr}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteBtn}
                >
                  <AppIcon name="trash-outline" color={colors.textTertiary} size={16} />
                </Pressable>
              </View>

              {/* Stat Pills - Hevy Style */}
              <View style={styles.statPillsRow}>
                <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt }]}>
                  <AppIcon name="timer-outline" size={13} color={colors.textSecondary} />
                  <Text variant="caption" tabular color={colors.textSecondary}>
                    {formatDurationMinutes(durationMin)}
                  </Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt }]}>
                  <AppIcon name="flash-outline" size={13} color={colors.accent} />
                  <Text variant="caption" tabular color={colors.accent} style={{ fontWeight: '700' }}>
                    {formatWeight(totalVolumeKg, settings.unit)}
                  </Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.surfaceAlt }]}>
                  <AppIcon name="layers-outline" size={13} color={colors.textSecondary} />
                  <Text variant="caption" tabular color={colors.textSecondary}>
                    {wSets.length} sets
                  </Text>
                </View>
              </View>

              {/* Performed Exercises Summary */}
              {exerciseGroups.length > 0 ? (
                <View style={[styles.exerciseSummaryBox, { backgroundColor: colors.surfaceAlt }]}>
                  {exerciseGroups.map((grp, idx) => (
                    <View key={idx} style={styles.exerciseSummaryRow}>
                      <Text variant="caption" color={colors.text} style={{ flex: 1 }}>
                        {grp.setsCount}× {grp.exerciseName}
                      </Text>
                      {grp.maxWeightKg > 0 ? (
                        <Text variant="caption" tabular color={colors.textSecondary}>
                          Best: {formatWeight(grp.maxWeightKg, settings.unit)}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
      />
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
  listContent: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exerciseSummaryBox: {
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  exerciseSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
