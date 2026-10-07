import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Crypto from 'expo-crypto';
import { Screen, Text, Button, AppIcon } from '../../src/components';
import { useTheme } from '../../src/theme';
import { useSettingsStore } from '../../src/lib/settingsStore';
import { workoutsRepo } from '../../src/db/repos/workoutsRepo';
import { exercisesRepo } from '../../src/db/repos/exercisesRepo';
import { blocksRepo } from '../../src/db/repos/blocksRepo';
import { format } from 'date-fns';
import { ExerciseRecord, WorkoutSetRecord } from '../../src/db/types';
import { useRestTimer } from '../../src/lib/useTimer';
import { RestBar } from '../../src/features/train/RestBar';
import { findPreviousSet } from '../../src/features/train/previous';
import { getRoutineById } from '../../src/features/train/routines';
import {
  formatWeight,
  getDualWeightDisplay,
  parseInputWeightToKg,
  calculateEstimated1RM,
} from '../../src/lib/units';
import { lightHaptic, notificationSuccess } from '../../src/lib/haptics';

const DRAFT_WORKOUT_KEY = 'planner-draft-workout-v1';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface ActiveSet {
  id: string;
  setNumber: number;
  setType?: SetType;
  weightInput: string;
  repsInput: string;
  isWarmup: boolean;
  completed: boolean;
  isPR?: boolean;
}

export interface ActiveExerciseItem {
  exercise: ExerciseRecord;
  sets: ActiveSet[];
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams<{ routineId?: string | string[] }>();
  const routineId = Array.isArray(rawParams.routineId) ? rawParams.routineId[0] : rawParams.routineId;

  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [workoutTitle, setWorkoutTitle] = useState('Workout');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exerciseItems, setExerciseItems] = useState<ActiveExerciseItem[]>([]);
  const [historicalSets, setHistoricalSets] = useState<WorkoutSetRecord[]>([]);

  // Add Exercise picker modal
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [allExercises, setAllExercises] = useState<ExerciseRecord[]>([]);

  // Rest timer
  const { isRunning: isRestRunning, remainingSeconds: restSeconds, startRest, adjustRest, stopRest } =
    useRestTimer(settings.defaultRestSec);

  // Keep screen awake during active workout
  useEffect(() => {
    activateKeepAwakeAsync('active-workout').catch(() => {});
    return () => {
      deactivateKeepAwake('active-workout').catch(() => {});
    };
  }, []);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load exercises, historical sets & handle routine / draft init
  useEffect(() => {
    async function init() {
      const exs = await exercisesRepo.getAll(false);
      setAllExercises(exs);

      const pastSets = await workoutsRepo.getAllSets();
      setHistoricalSets(pastSets);

      // If user selected a specific routine, initialize it!
      if (routineId) {
        const routine = getRoutineById(routineId);
        if (routine) {
          setWorkoutTitle(routine.title);

          const items: ActiveExerciseItem[] = [];
          for (const tpl of routine.exercises) {
            // Find or create exercise in DB
            let matched = exs.find((e) => e.name.toLowerCase() === tpl.name.toLowerCase());
            if (!matched) {
              const newExId = Crypto.randomUUID();
              matched = {
                id: newExId,
                name: tpl.name,
                muscle_group: tpl.muscle_group,
                equipment: tpl.equipment,
                setup: tpl.setup || null,
                notes: tpl.notes || null,
                default_rest_sec: 90,
                archived: 0,
                created_at: Date.now(),
              };
              await exercisesRepo.insert(matched);
            }

            const sets: ActiveSet[] = [];
            for (let sIdx = 1; sIdx <= tpl.targetSets; sIdx++) {
              // Check if user previously logged this exercise
              const pastSet = findPreviousSet(pastSets, matched.id, sIdx);
              let wInput = String(tpl.defaultWeightLb);
              let rInput = String(tpl.defaultReps);

              if (pastSet?.weightKg != null) {
                const val = settings.unit === 'lb' ? pastSet.weightKg * 2.20462 : pastSet.weightKg;
                wInput = Math.round(val).toString();
              }
              if (pastSet?.reps != null) {
                rInput = pastSet.reps.toString();
              }

              sets.push({
                id: Crypto.randomUUID(),
                setNumber: sIdx,
                setType: 'normal',
                weightInput: wInput,
                repsInput: rInput,
                isWarmup: false,
                completed: false,
              });
            }

            items.push({
              exercise: matched,
              sets,
            });
          }

          setExerciseItems(items);
          return;
        }
      }

      // Check draft from storage
      const rawDraft = await AsyncStorage.getItem(DRAFT_WORKOUT_KEY);
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft);
          setWorkoutTitle(draft.title || 'Workout');
          setStartedAt(draft.startedAt || Date.now());
          setExerciseItems(draft.items || []);
          return;
        } catch {}
      }

      // Default starter exercise if fresh
      if (exs.length >= 2) {
        setWorkoutTitle('Upper Body');
        setExerciseItems([
          {
            exercise: exs[0],
            sets: [
              { id: Crypto.randomUUID(), setNumber: 1, setType: 'normal', weightInput: '135', repsInput: '10', isWarmup: false, completed: false },
              { id: Crypto.randomUUID(), setNumber: 2, setType: 'normal', weightInput: '135', repsInput: '8', isWarmup: false, completed: false },
              { id: Crypto.randomUUID(), setNumber: 3, setType: 'normal', weightInput: '135', repsInput: '8', isWarmup: false, completed: false },
            ],
          },
          {
            exercise: exs[1],
            sets: [
              { id: Crypto.randomUUID(), setNumber: 1, setType: 'normal', weightInput: '120', repsInput: '10', isWarmup: false, completed: false },
              { id: Crypto.randomUUID(), setNumber: 2, setType: 'normal', weightInput: '120', repsInput: '10', isWarmup: false, completed: false },
            ],
          },
        ]);
      }
    }
    init();
  }, [routineId, settings.unit]);

  // Persist draft to storage continuously
  useEffect(() => {
    if (exerciseItems.length > 0) {
      AsyncStorage.setItem(
        DRAFT_WORKOUT_KEY,
        JSON.stringify({
          title: workoutTitle,
          startedAt,
          items: exerciseItems,
        })
      ).catch(() => {});
    }
  }, [workoutTitle, startedAt, exerciseItems]);

  // Live workout stats calculations
  const { totalVolumeKg, totalCompletedSets, totalSetsCount } = useMemo(() => {
    let vol = 0;
    let completed = 0;
    let total = 0;

    for (const item of exerciseItems) {
      for (const s of item.sets) {
        total++;
        if (s.completed) {
          completed++;
          if (!s.isWarmup) {
            const wKg = parseInputWeightToKg(parseFloat(s.weightInput) || 0, settings.unit);
            const r = parseInt(s.repsInput, 10) || 0;
            vol += wKg * r;
          }
        }
      }
    }
    return { totalVolumeKg: vol, totalCompletedSets: completed, totalSetsCount: total };
  }, [exerciseItems, settings.unit]);

  const handleAddSet = (exerciseIndex: number) => {
    lightHaptic();
    setExerciseItems((prev) => {
      const copy = [...prev];
      const target = copy[exerciseIndex];
      const nextNum = target.sets.length + 1;
      const lastSet = target.sets[target.sets.length - 1];

      target.sets.push({
        id: Crypto.randomUUID(),
        setNumber: nextNum,
        setType: 'normal',
        weightInput: lastSet?.weightInput || '100',
        repsInput: lastSet?.repsInput || '10',
        isWarmup: false,
        completed: false,
      });
      return copy;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    lightHaptic();
    setExerciseItems((prev) => {
      const copy = [...prev];
      const target = copy[exerciseIndex];
      target.sets.splice(setIndex, 1);
      // Re-number remaining sets
      target.sets.forEach((s, idx) => {
        s.setNumber = idx + 1;
      });
      return copy;
    });
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          lightHaptic();
          setExerciseItems((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
        },
      },
    ]);
  };

  const handleCycleSetType = (exerciseIndex: number, setIndex: number) => {
    lightHaptic();
    setExerciseItems((prev) => {
      const copy = [...prev];
      const s = copy[exerciseIndex].sets[setIndex];
      const current = s.setType || (s.isWarmup ? 'warmup' : 'normal');

      let next: SetType = 'normal';
      if (current === 'normal') next = 'warmup';
      else if (current === 'warmup') next = 'drop';
      else if (current === 'drop') next = 'failure';
      else next = 'normal';

      s.setType = next;
      s.isWarmup = next === 'warmup';
      return copy;
    });
  };

  const handleToggleComplete = (exerciseIndex: number, setIndex: number) => {
    lightHaptic();
    setExerciseItems((prev) => {
      const copy = [...prev];
      const item = copy[exerciseIndex];
      const s = item.sets[setIndex];
      const nextCompleted = !s.completed;
      s.completed = nextCompleted;

      if (nextCompleted) {
        // Start rest timer automatically!
        const restDuration = item.exercise.default_rest_sec || settings.defaultRestSec;
        startRest(restDuration);

        // PR Check
        const wKg = parseInputWeightToKg(parseFloat(s.weightInput) || 0, settings.unit);
        const reps = parseInt(s.repsInput, 10) || 0;
        const est1RM = calculateEstimated1RM(wKg, reps) ?? 0;

        const priorSets = historicalSets.filter((h) => h.exercise_id === item.exercise.id);
        const priorMaxWeight = Math.max(0, ...priorSets.map((h) => h.weight_kg ?? 0));
        const priorMax1RM = Math.max(
          0,
          ...priorSets.map((h) => calculateEstimated1RM(h.weight_kg ?? 0, h.reps ?? 0) ?? 0)
        );

        if (wKg > priorMaxWeight || (est1RM > priorMax1RM && priorSets.length > 0)) {
          s.isPR = true;
          notificationSuccess();
        }
      }

      return copy;
    });
  };

  const handleAddExercise = (ex: ExerciseRecord) => {
    lightHaptic();
    setExerciseItems((prev) => [
      ...prev,
      {
        exercise: ex,
        sets: [
          {
            id: Crypto.randomUUID(),
            setNumber: 1,
            setType: 'normal',
            weightInput: '100',
            repsInput: '10',
            isWarmup: false,
            completed: false,
          },
          {
            id: Crypto.randomUUID(),
            setNumber: 2,
            setType: 'normal',
            weightInput: '100',
            repsInput: '10',
            isWarmup: false,
            completed: false,
          },
          {
            id: Crypto.randomUUID(),
            setNumber: 3,
            setType: 'normal',
            weightInput: '100',
            repsInput: '10',
            isWarmup: false,
            completed: false,
          },
        ],
      },
    ]);
    setPickerVisible(false);
  };

  const handleFinish = async () => {
    Alert.alert('Finish Workout', 'Ready to log this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish & Save',
        onPress: async () => {
          try {
            const endedAt = Date.now();
            const workoutId = Crypto.randomUUID();

            await workoutsRepo.insert({
              id: workoutId,
              title: workoutTitle || 'Workout',
              started_at: startedAt,
              ended_at: endedAt,
              notes: null,
            });

            let pos = 0;
            for (const item of exerciseItems) {
              for (const s of item.sets) {
                if (s.completed) {
                  const wKg = parseInputWeightToKg(parseFloat(s.weightInput) || 0, settings.unit);
                  const reps = parseInt(s.repsInput, 10) || 0;

                  await workoutsRepo.insertSet({
                    id: s.id,
                    workout_id: workoutId,
                    exercise_id: item.exercise.id,
                    position: pos++,
                    set_number: s.setNumber,
                    weight_kg: wKg,
                    reps,
                    rpe: null,
                    is_warmup: s.isWarmup ? 1 : 0,
                    completed_at: Date.now(),
                  });
                }
              }
            }

            // Sync with Today timeline
            const startDate = new Date(startedAt);
            const dateKey = format(startDate, 'yyyy-MM-dd');
            const startMin = startDate.getHours() * 60 + startDate.getMinutes();
            const durationMin = Math.max(10, Math.round((endedAt - startedAt) / 60000));

            await blocksRepo.insert({
              id: Crypto.randomUUID(),
              title: workoutTitle || 'Workout',
              kind: 'workout',
              category: 'health',
              date: dateKey,
              start_min: startMin,
              duration_min: durationMin,
              done_at: endedAt,
              notes: null,
              link_type: 'workout',
              link_id: workoutId,
              created_at: Date.now(),
              updated_at: Date.now(),
            });

            // Clear draft
            await AsyncStorage.removeItem(DRAFT_WORKOUT_KEY);
            notificationSuccess();
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'Are you sure you want to discard this workout? All progress will be lost.', [
      { text: 'Keep Lifting', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(DRAFT_WORKOUT_KEY);
          router.back();
        },
      },
    ]);
  };

  const formatElapsed = () => {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const filteredPickerExercises = useMemo(() => {
    if (!pickerSearch.trim()) return allExercises;
    return allExercises.filter(
      (e) =>
        e.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        (e.muscle_group ? e.muscle_group.toLowerCase().includes(pickerSearch.toLowerCase()) : false)
    );
  }, [allExercises, pickerSearch]);

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Top Header - Hevy Style */}
      <View style={[styles.header, { borderBottomColor: colors.hairline, backgroundColor: colors.surface }]}>
        <Pressable
          accessibilityLabel="Discard workout"
          onPress={handleDiscard}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="close" color={colors.textSecondary} size={22} />
        </Pressable>

        <View style={styles.headerCenter}>
          <TextInput
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
            style={[styles.headerTitleInput, { color: colors.text }]}
            placeholder="Workout Title"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.timerPill}>
            <View style={[styles.pulsingDot, { backgroundColor: '#10B981' }]} />
            <Text variant="caption" tabular color={colors.textSecondary} style={{ fontWeight: '600' }}>
              {formatElapsed()}
            </Text>
          </View>
        </View>

        <Button
          title="Finish"
          size="sm"
          icon={<AppIcon name="checkmark" size={15} color="#FFF" />}
          style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
          onPress={handleFinish}
        />
      </View>

      {/* Hevy Live Stats Bar */}
      <View style={[styles.liveStatsBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline }]}>
        <View style={styles.statMetric}>
          <Text variant="micro" color={colors.textTertiary}>
            VOLUME
          </Text>
          <Text variant="caption" tabular color={colors.accent} style={{ fontWeight: '700' }}>
            {formatWeight(totalVolumeKg, settings.unit)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statMetric}>
          <Text variant="micro" color={colors.textTertiary}>
            SETS
          </Text>
          <Text variant="caption" tabular color={colors.text} style={{ fontWeight: '700' }}>
            {totalCompletedSets} / {totalSetsCount}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statMetric}>
          <Text variant="micro" color={colors.textTertiary}>
            EXERCISES
          </Text>
          <Text variant="caption" tabular color={colors.text} style={{ fontWeight: '700' }}>
            {exerciseItems.length}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {exerciseItems.map((item, exIdx) => {
          const restDuration = item.exercise.default_rest_sec || settings.defaultRestSec;

          return (
            <View
              key={item.exercise.id + exIdx}
              style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            >
              {/* Exercise Card Header - Hevy Style */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.musclePill, { backgroundColor: colors.surfaceAlt }]}>
                      <Text variant="micro" color={colors.accent} style={{ fontWeight: '700' }}>
                        {(item.exercise.muscle_group || 'OTHER').toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.musclePill, { backgroundColor: colors.surfaceAlt }]}>
                      <Text variant="micro" color={colors.textTertiary}>
                        {(item.exercise.equipment || 'MACHINE').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodyStrong" style={styles.exerciseNameText}>
                    {item.exercise.name}
                  </Text>
                  {item.exercise.setup ? (
                    <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                      ⚙️ {item.exercise.setup}
                    </Text>
                  ) : null}
                </View>

                {/* Right Header Actions */}
                <View style={styles.exerciseHeaderRight}>
                  <Pressable
                    onPress={() => startRest(restDuration)}
                    style={[styles.restTimerChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline }]}
                  >
                    <AppIcon name="timer-outline" size={13} color={colors.textSecondary} />
                    <Text variant="micro" color={colors.textSecondary}>
                      {restDuration}s
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveExercise(exIdx)}
                    style={styles.trashExerciseBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon name="trash-outline" size={16} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: colors.hairline }]}>
                <Text variant="micro" color={colors.textTertiary} style={styles.colSet}>
                  SET
                </Text>
                <Text variant="micro" color={colors.textTertiary} style={styles.colPrev}>
                  PREVIOUS
                </Text>
                <Text variant="micro" color={colors.textTertiary} style={styles.colWeight}>
                  {settings.unit.toUpperCase()}
                </Text>
                <Text variant="micro" color={colors.textTertiary} style={styles.colReps}>
                  REPS
                </Text>
                <Text variant="micro" color={colors.textTertiary} style={styles.colCheck}>
                  ✓
                </Text>
              </View>

              {/* Set Rows */}
              {item.sets.map((s, sIdx) => {
                const prev = findPreviousSet(historicalSets, item.exercise.id, s.setNumber);
                const prevText = prev
                  ? `${formatWeight(prev.weightKg, settings.unit)} × ${prev.reps}`
                  : '—';

                const currentValKg = parseInputWeightToKg(parseFloat(s.weightInput) || 0, settings.unit);
                const dual = getDualWeightDisplay(currentValKg, settings.unit);
                const setType = s.setType || (s.isWarmup ? 'warmup' : 'normal');

                return (
                  <View
                    key={s.id}
                    style={[
                      styles.setRow,
                      { borderBottomColor: colors.hairline },
                      s.completed && { backgroundColor: '#10B98110' },
                    ]}
                  >
                    {/* Set Badge (Tap to cycle Set Type: 1 -> W -> D -> F) */}
                    <Pressable
                      style={styles.colSet}
                      onPress={() => handleCycleSetType(exIdx, sIdx)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <View
                        style={[
                          styles.setTypePill,
                          setType === 'normal' && { backgroundColor: colors.surfaceAlt },
                          setType === 'warmup' && { backgroundColor: '#F59E0B20' },
                          setType === 'drop' && { backgroundColor: '#8B5CF620' },
                          setType === 'failure' && { backgroundColor: '#EF444420' },
                        ]}
                      >
                        <Text
                          variant="caption"
                          tabular
                          style={[
                            styles.setTypeText,
                            setType === 'normal' && { color: colors.text },
                            setType === 'warmup' && { color: '#F59E0B' },
                            setType === 'drop' && { color: '#8B5CF6' },
                            setType === 'failure' && { color: '#EF4444' },
                          ]}
                        >
                          {setType === 'normal'
                            ? s.setNumber
                            : setType === 'warmup'
                            ? 'W'
                            : setType === 'drop'
                            ? 'D'
                            : 'F'}
                        </Text>
                      </View>
                      {s.isPR ? (
                        <View style={[styles.prBadge, { backgroundColor: colors.accent }]}>
                          <AppIcon name="flame" size={8} color="#FFF" />
                          <Text variant="micro" color="#FFF" style={styles.prText}>
                            PR
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>

                    {/* Previous (Tap to copy) */}
                    <Pressable
                      style={styles.colPrev}
                      onPress={() => {
                        if (prev) {
                          lightHaptic();
                          setExerciseItems((prevItems) => {
                            const copy = [...prevItems];
                            const target = copy[exIdx].sets[sIdx];
                            if (prev.weightKg != null) {
                              const val = settings.unit === 'lb' ? prev.weightKg * 2.20462 : prev.weightKg;
                              target.weightInput = Math.round(val).toString();
                            }
                            if (prev.reps != null) target.repsInput = prev.reps.toString();
                            return copy;
                          });
                        }
                      }}
                    >
                      <Text variant="caption" color={colors.textTertiary} tabular numberOfLines={1}>
                        {prevText}
                      </Text>
                    </Pressable>

                    {/* Weight Input + Live Grayed-out Conversion */}
                    <View style={styles.colWeight}>
                      <TextInput
                        keyboardType="numeric"
                        value={s.weightInput}
                        onChangeText={(val) => {
                          setExerciseItems((prevItems) => {
                            const copy = [...prevItems];
                            copy[exIdx].sets[sIdx].weightInput = val;
                            return copy;
                          });
                        }}
                        style={[
                          styles.numericInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.surfaceAlt,
                            borderColor: colors.hairline,
                          },
                        ]}
                      />
                      {dual.secondary ? (
                        <Text variant="micro" color={colors.textTertiary} style={styles.secondaryUnitText}>
                          {dual.secondary}
                        </Text>
                      ) : null}
                    </View>

                    {/* Reps Input */}
                    <View style={styles.colReps}>
                      <TextInput
                        keyboardType="numeric"
                        value={s.repsInput}
                        onChangeText={(val) => {
                          setExerciseItems((prevItems) => {
                            const copy = [...prevItems];
                            copy[exIdx].sets[sIdx].repsInput = val;
                            return copy;
                          });
                        }}
                        style={[
                          styles.numericInput,
                          {
                            color: colors.text,
                            backgroundColor: colors.surfaceAlt,
                            borderColor: colors.hairline,
                          },
                        ]}
                      />
                    </View>

                    {/* Check Button (Hevy style checkmark) */}
                    <Pressable
                      onPress={() => handleToggleComplete(exIdx, sIdx)}
                      style={styles.colCheck}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View
                        style={[
                          styles.checkCircle,
                          { borderColor: colors.hairline },
                          s.completed && {
                            backgroundColor: '#10B981',
                            borderColor: '#10B981',
                          },
                        ]}
                      >
                        {s.completed ? (
                          <AppIcon name="checkmark" color="#FFF" size={16} />
                        ) : null}
                      </View>
                    </Pressable>

                    {/* Delete Set option */}
                    {item.sets.length > 1 ? (
                      <Pressable
                        onPress={() => handleRemoveSet(exIdx, sIdx)}
                        style={styles.colTrash}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <AppIcon name="close" size={13} color={colors.textTertiary} />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}

              {/* Add Set Button */}
              <Pressable
                onPress={() => handleAddSet(exIdx)}
                style={[styles.addSetRow, { borderTopColor: colors.hairline }]}
              >
                <AppIcon name="add" size={15} color={colors.accent} />
                <Text variant="caption" color={colors.accent} style={{ fontWeight: '600', marginLeft: 4 }}>
                  Add Set
                </Text>
              </Pressable>
            </View>
          );
        })}

        {/* Big Add Exercise CTA Button */}
        <Button
          title="Add Exercise"
          variant="secondary"
          size="lg"
          icon={<AppIcon name="add-circle-outline" size={20} color={colors.text} />}
          onPress={() => setPickerVisible(true)}
          style={styles.addExerciseBtn}
        />
      </ScrollView>

      {/* Floating Rest Bar */}
      {isRestRunning ? (
        <RestBar
          remainingSeconds={restSeconds}
          totalDuration={settings.defaultRestSec}
          onAdjust={adjustRest}
          onSkip={stopRest}
        />
      ) : null}

      {/* Exercise Picker Modal - Hevy Search Style */}
      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <Screen edges={['top', 'bottom']} padHorizontal>
          <View style={styles.pickerHeader}>
            <Text variant="title">Add Exercise</Text>
            <Pressable onPress={() => setPickerVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="close" color={colors.textSecondary} size={22} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline }]}>
            <AppIcon name="search-outline" color={colors.textTertiary} size={18} />
            <TextInput
              placeholder="Search exercise or muscle..."
              placeholderTextColor={colors.textTertiary}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {filteredPickerExercises.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => handleAddExercise(ex)}
                style={[styles.pickerItem, { borderBottomColor: colors.hairline }]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{ex.name}</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    {ex.muscle_group?.toUpperCase()} · {ex.equipment}
                  </Text>
                </View>
                <AppIcon name="add" color={colors.accent} size={20} />
              </Pressable>
            ))}
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    padding: 6,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitleInput: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStatsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  statMetric: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#8882',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 90,
  },
  exerciseCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  musclePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseNameText: {
    fontSize: 16,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restTimerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  trashExerciseBtn: {
    padding: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  colSet: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypePill: {
    width: 28,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  prText: {
    fontSize: 7,
    fontWeight: '900',
  },
  colPrev: {
    flex: 1.1,
    paddingHorizontal: 4,
  },
  colWeight: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  secondaryUnitText: {
    fontSize: 9,
    marginTop: 2,
  },
  colReps: {
    width: 58,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  colCheck: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colTrash: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericInput: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    borderWidth: 0.5,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 0.5,
  },
  addExerciseBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 0.5,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
});
