import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Screen, Text, Chip, EmptyState, AppIcon } from '../../../../src/components';
import { useTheme } from '../../../../src/theme';
import { exercisesRepo } from '../../../../src/db/repos/exercisesRepo';
import { ExerciseRecord, MuscleGroup } from '../../../../src/db/types';
import { checkAndSeedExercises } from '../../../../src/features/train/seedExercises';
import { lightHaptic } from '../../../../src/lib/haptics';

const MUSCLE_FILTERS: { label: string; group: MuscleGroup | 'all' }[] = [
  { label: 'All', group: 'all' },
  { label: 'Chest', group: 'chest' },
  { label: 'Back', group: 'back' },
  { label: 'Arms', group: 'arms' },
  { label: 'Shoulders', group: 'shoulders' },
  { label: 'Legs', group: 'legs' },
];

export default function ExercisesListScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | 'all'>('all');

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

  const handleCreateExercise = () => {
    Alert.prompt(
      'New Exercise',
      'Enter the exercise name:',
      async (text) => {
        if (!text || !text.trim()) return;
        const newId = Crypto.randomUUID();
        await exercisesRepo.insert({
          id: newId,
          name: text.trim(),
          muscle_group: selectedGroup === 'all' ? 'arms' : selectedGroup,
          equipment: 'machine',
          setup: null,
          notes: null,
          default_rest_sec: 90,
          archived: 0,
          created_at: Date.now(),
        });
        lightHaptic();
        loadExercises();
        router.push(`/(tabs)/train/exercises/${newId}`);
      }
    );
  };

  const filtered = exercises.filter((ex) => {
    const matchGroup = selectedGroup === 'all' || ex.muscle_group === selectedGroup;
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
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
          onPress={handleCreateExercise}
          style={styles.addBtn}
          accessibilityLabel="Create exercise"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="add" color={colors.accent} size={22} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceAlt }]}>
        <AppIcon name="search-outline" size={16} color={colors.textTertiary} style={{ marginLeft: 10 }} />
        <TextInput
          placeholder="Search exercises..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text, flex: 1 }]}
        />
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

      {/* Exercises List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState iconName="barbell-outline" message="No exercises found." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tabs)/train/exercises/${item.id}`)}
            style={[styles.itemRow, { borderBottomColor: colors.hairline }]}
          >
            <View style={styles.itemInfo}>
              <Text variant="bodyStrong" color={colors.text}>
                {item.name}
              </Text>
              <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                {item.muscle_group ? item.muscle_group.toUpperCase() : 'OTHER'} ·{' '}
                {item.equipment ? item.equipment : 'machine'}
                {item.setup ? ` · ${item.setup}` : ''}
              </Text>
            </View>
            <AppIcon name="chevron-forward" color={colors.textTertiary} size={14} />
          </Pressable>
        )}
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
  addBtn: {
    padding: 4,
  },
  searchRow: {
    paddingVertical: 6,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  filtersWrapper: {
    paddingVertical: 10,
  },
  filterList: {
    gap: 8,
  },
  listContent: {
    paddingBottom: 30,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
});
