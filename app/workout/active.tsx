import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import {
  formatWeight,
  getDualWeightDisplay,
  parseInputWeightToKg,
  calculateEstimated1RM,
} from '../../src/lib/units';
import { lightHaptic, notificationSuccess } from '../../src/lib/haptics';

const DRAFT_WORKOUT_KEY = 'planner-draft-workout-v1';

interface ActiveSet {
  id: string;
  setNumber: number;
  weightInput: string;
  repsInput: string;
  isWarmup: boolean;
  completed: boolean;
  isPR?: boolean;
}

interface ActiveExerciseItem {
  exercise: ExerciseRecord;
  sets: ActiveSet[];
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [workoutTitle, setWorkoutTitle] = useState('Upper Body');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exerciseItems, setExerciseItems] = useState<ActiveExerciseItem[]>([]);
  const [historicalSets, setHistoricalSets] = useState<WorkoutSetRecord[]>([]);

  // Add Exercise picker modal
  const [pickerVisible, setPickerVisible] = useState(false);
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

  // Load exercises & historical sets & draft
  useEffect(() => {
    async function init() {
      const exs = await exercisesRepo.getAll(false);
      setAllExercises(exs);

      const pastSets = await workoutsRepo.getAllSets();
      setHistoricalSets(pastSets);

      // Check draft
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

      // Default seed with 2 exercises if fresh
      if (exs.length >= 2) {
        setExerciseItems([
          {
            exercise: exs[0],
            sets: [
              { id: Crypto.randomUUID(), setNumber: 1, weightInput: '135', repsInput: '10', isWarmup: false, completed: false },
              { id: Crypto.randomUUID(), setNumber: 2, weightInput: '135', repsInput: '8', isWarmup: false, completed: false },
            ],
          },
          {
            exercise: exs[1],
            sets: [
              { id: Crypto.randomUUID(), setNumber: 1, weightInput: '120', repsInput: '10', isWarmup: false, completed: false },
            ],
          },
        ]);
      }
    }
    init();
  }, []);

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
        weightInput: lastSet?.weightInput || '100',
        repsInput: lastSet?.repsInput || '10',
        isWarmup: false,
        completed: false,
      });
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

        // Compare against historical sets for this exercise
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
    Alert.alert('Finish Workout', 'Ready to save and log this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'default',
        onPress: async () => {
          try {
            const workoutId = Crypto.randomUUID();
            const endedAt = Date.now();

            await workoutsRepo.insert({
              id: workoutId,
              title: workoutTitle,
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

            // Create Today timeline overlay block
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
    Alert.alert('Discard Workout', 'Are you sure you want to discard this workout?', [
      { text: 'Cancel', style: 'cancel' },
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

  return (
    <Screen edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.hairline }]}>
        <Pressable
          accessibilityLabel="Discard workout"
          onPress={handleDiscard}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="close" color={colors.textSecondary} size={20} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text variant="bodyStrong">{workoutTitle}</Text>
          <Text variant="caption" tabular color={colors.accent}>
            {formatElapsed()}
          </Text>
        </View>

        <Button
          title="Finish"
          size="sm"
          icon={<AppIcon name="checkmark" size={15} color={colors.inkText} />}
          onPress={handleFinish}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {exerciseItems.map((item, exIdx) => (
          <View key={item.exercise.id + exIdx} style={[styles.exerciseCard, { backgroundColor: colors.surface }]}>
            {/* Exercise Header */}
            <View style={styles.cardHeader}>
              <View>
                <Text variant="bodyStrong">{item.exercise.name}</Text>
                {item.exercise.setup ? (
                  <Text variant="caption" color={colors.textSecondary}>
                    {item.exercise.setup}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
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

              return (
                <View
                  key={s.id}
                  style={[
                    styles.setRow,
                    s.completed && { backgroundColor: colors.surfaceAlt, opacity: 0.9 },
                  ]}
                >
                  <View style={styles.colSet}>
                    <Text variant="bodyStrong" tabular>
                      {s.setNumber}
                    </Text>
                    {s.isPR ? (
                      <View style={[styles.prBadge, { backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center' }]}>
                        <AppIcon name="flame" size={9} color="#FFF" style={{ marginRight: 2 }} />
                        <Text variant="micro" color="#FFF" style={styles.prText}>
                          PR
                        </Text>
                      </View>
                    ) : null}
                  </View>

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
                      style={[styles.numericInput, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
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
                      style={[styles.numericInput, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
                    />
                  </View>

                  {/* Check button */}
                  <Pressable
                    onPress={() => handleToggleComplete(exIdx, sIdx)}
                    style={styles.colCheck}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <View
                      style={[
                        styles.checkCircle,
                        { borderColor: colors.hairline },
                        s.completed && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      {s.completed ? (
                        <AppIcon name="checkmark" color="#FFF" size={14} />
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}

            <Button
              title="Add Set"
              variant="quiet"
              size="sm"
              icon={<AppIcon name="add" size={15} color={colors.accent} />}
              onPress={() => handleAddSet(exIdx)}
              style={styles.addSetBtn}
            />
          </View>
        ))}

        <Button
          title="Add Exercise"
          variant="secondary"
          icon={<AppIcon name="add-circle-outline" size={18} color={colors.text} />}
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

      {/* Exercise Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <Screen edges={['top', 'bottom']} padHorizontal>
          <View style={styles.pickerHeader}>
            <Text variant="title">Add Exercise</Text>
            <Pressable onPress={() => setPickerVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="close" color={colors.textSecondary} size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
            {allExercises.map((ex) => (
              <Pressable
                key={ex.id}
                onPress={() => handleAddExercise(ex)}
                style={[styles.pickerItem, { borderBottomColor: colors.hairline }]}
              >
                <Text variant="bodyStrong">{ex.name}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {ex.muscle_group?.toUpperCase()} · {ex.equipment}
                </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    padding: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 2,
  },
  colSet: {
    width: 44,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  prBadge: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  prText: {
    fontSize: 8,
    fontWeight: '800',
  },
  colPrev: {
    flex: 1.2,
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
    width: 56,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  colCheck: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericInput: {
    width: '100%',
    height: 36,
    borderRadius: 6,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addExerciseBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
});
