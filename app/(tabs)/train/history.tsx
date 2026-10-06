import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { format } from 'date-fns';
import { Screen, Text, EmptyState } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { useSettingsStore } from '../../../src/lib/settingsStore';
import { workoutsRepo } from '../../../src/db/repos/workoutsRepo';
import { WorkoutRecord, WorkoutSetRecord } from '../../../src/db/types';
import { formatWeight } from '../../../src/lib/units';
import { formatDurationMinutes } from '../../../src/lib/time';
import { notificationWarning } from '../../../src/lib/haptics';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [setsByWorkout, setSetsByWorkout] = useState<Record<string, WorkoutSetRecord[]>>({});

  const loadHistory = useCallback(async () => {
    try {
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
            <SymbolView name="chevron.left" tintColor={colors.text} size={20} />
          </Pressable>
          <Text variant="title">Workout History</Text>
        </View>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message="No logged workouts yet." />}
        renderItem={({ item }) => {
          const wSets = setsByWorkout[item.id] || [];
          const totalVolumeKg = wSets.reduce((sum, s) => {
            if (s.is_warmup || !s.weight_kg || !s.reps) return sum;
            return sum + s.weight_kg * s.reps;
          }, 0);

          const durationMs = item.ended_at ? item.ended_at - item.started_at : 0;
          const durationMin = Math.round(durationMs / 60000);
          const dateStr = format(new Date(item.started_at), 'EEEE, MMM d, yyyy');

          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text variant="bodyStrong">{item.title || 'Workout'}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {dateStr}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SymbolView name="trash" tintColor={colors.textTertiary} size={16} />
                </Pressable>
              </View>

              <View style={styles.statsRow}>
                <Text variant="caption" color={colors.textSecondary}>
                  {formatDurationMinutes(durationMin)} · {wSets.length} sets
                </Text>
                <Text variant="bodyStrong" color={colors.accent}>
                  {formatWeight(totalVolumeKg, settings.unit)} volume
                </Text>
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
    paddingBottom: 30,
  },
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
