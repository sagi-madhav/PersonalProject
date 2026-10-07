import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen, Text, Button, Chip, EmptyState, AppIcon } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';
import { exercisesRepo } from '../../../../src/db/repos/exercisesRepo';
import { ExerciseRecord, MuscleGroup, EquipmentType } from '../../../../src/db/types';
import { checkAndSeedExercises } from '../../../../src/features/train/seedExercises';
import { lightHaptic, notificationSuccess } from '../../../../src/lib/haptics';

const MUSCLE_FILTERS: { label: string; group: MuscleGroup | 'all' }[] = [
  { label: 'All', group: 'all' },
  { label: 'Chest', group: 'chest' },
  { label: 'Back', group: 'back' },
  { label: 'Arms', group: 'arms' },
  { label: 'Shoulders', group: 'shoulders' },
  { label: 'Legs', group: 'legs' },
  { label: 'Core', group: 'core' },
];

export default function ExercisesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('chest');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('dumbbell');

  const loadExercises = useCallback(async () => {
    try {
      await checkAndSeedExercises();
      const list = await exercisesRepo.getAll(false);
      setExercises(list);
    } catch (err) {
      console.warn('Failed to load exercises', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  const handleSaveNewExercise = async () => {
    if (!newExName.trim()) return;
    const newId = Crypto.randomUUID();
    await exercisesRepo.insert({
      id: newId,
      name: newExName.trim(),
      muscle_group: newExMuscle,
      equipment: newExEquipment,
      setup: null,
      notes: null,
      default_rest_sec: 90,
      archived: 0,
      created_at: Date.now(),
    });

    notificationSuccess();
    setIsCreateModalOpen(false);
    setNewExName('');
    loadExercises();
    router.push(`/(tabs)/train/exercises/${newId}`);
  };

  const filtered = exercises.filter((ex) => {
    const matchGroup = selectedGroup === 'all' || ex.muscle_group === selectedGroup;
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.muscle_group ? ex.muscle_group.toLowerCase().includes(search.toLowerCase()) : false);
    return matchGroup && matchSearch;
  });

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
          <Text variant="title">Exercises</Text>
        </View>

        <Pressable
          onPress={() => {
            lightHaptic();
            setIsCreateModalOpen(true);
          }}
          style={styles.addBtn}
          accessibilityLabel="Create exercise"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="add" color={colors.accent} size={22} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.hairline }]}>
        <AppIcon name="search-outline" size={16} color={colors.textTertiary} style={{ marginLeft: 8 }} />
        <TextInput
          placeholder="Search exercises, muscles..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <AppIcon name="close" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
          </Pressable>
        ) : null}
      </View>

      {/* Muscle Group Filters */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MUSCLE_FILTERS}
          keyExtractor={(item) => item.group}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              selected={selectedGroup === item.group}
              onPress={() => setSelectedGroup(item.group)}
            />
          )}
        />
      </View>

      {/* Exercises List - Hevy Style */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState iconName="barbell-outline" message="No exercises found." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/train/exercises/${item.id}`)}
            style={[styles.itemRow, { borderBottomColor: colors.hairline }]}
          >
            <View style={styles.itemInfo}>
              <View style={styles.exerciseNameRow}>
                <Text variant="bodyStrong" color={colors.text}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.tagsRow}>
                <View style={[styles.miniBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Text variant="micro" color={colors.accent} style={{ fontWeight: '700' }}>
                    {(item.muscle_group || 'OTHER').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.miniBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Text variant="micro" color={colors.textTertiary}>
                    {(item.equipment || 'MACHINE').toUpperCase()}
                  </Text>
                </View>
                {item.setup ? (
                  <Text variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ flex: 1, marginLeft: 4 }}>
                    ⚙️ {item.setup}
                  </Text>
                ) : null}
              </View>
            </View>
            <AppIcon name="chevron-forward" color={colors.textTertiary} size={14} />
          </Pressable>
        )}
      />

      {/* Cross-Platform Create Exercise Modal */}
      <Modal visible={isCreateModalOpen} animationType="slide" onRequestClose={() => setIsCreateModalOpen(false)}>
        <Screen edges={['top', 'bottom']} padHorizontal>
          <View style={styles.modalHeader}>
            <Text variant="title">New Exercise</Text>
            <Pressable onPress={() => setIsCreateModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppIcon name="close" color={colors.textSecondary} size={22} />
            </Pressable>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
              Exercise Name
            </Text>
            <TextInput
              placeholder="e.g. Incline Cable Fly"
              placeholderTextColor={colors.textTertiary}
              value={newExName}
              onChangeText={setNewExName}
              style={[
                styles.modalInput,
                { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.hairline },
              ]}
            />

            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 16, marginBottom: 8 }}>
              Target Muscle Group
            </Text>
            <View style={styles.chipsWrap}>
              {(['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as MuscleGroup[]).map((mg) => (
                <Chip
                  key={mg}
                  label={mg.toUpperCase()}
                  selected={newExMuscle === mg}
                  onPress={() => setNewExMuscle(mg)}
                />
              ))}
            </View>

            <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 16, marginBottom: 8 }}>
              Equipment
            </Text>
            <View style={styles.chipsWrap}>
              {(['dumbbell', 'barbell', 'cable', 'machine', 'bodyweight'] as EquipmentType[]).map((eq) => (
                <Chip
                  key={eq}
                  label={eq.toUpperCase()}
                  selected={newExEquipment === eq}
                  onPress={() => setNewExEquipment(eq)}
                />
              ))}
            </View>

            <Button
              title="Save Exercise"
              variant="primary"
              size="lg"
              onPress={handleSaveNewExercise}
              style={{ marginTop: 28 }}
            />
          </View>
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
  addBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  searchInput: {
    height: 38,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 6,
  },
  filtersWrapper: {
    paddingVertical: 10,
  },
  filterList: {
    gap: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseNameRow: {
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
