import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import { Screen, Text, Button, Chip, EmptyState, AppIcon } from '../../../src/components';
import { useTheme } from '../../../src/theme';
import { dsaRepo } from '../../../src/db/repos/dsaRepo';
import { learnRepo } from '../../../src/db/repos/learnRepo';
import { DsaProblemRecord, DsaDifficulty, DsaStatus } from '../../../src/db/types';
import { DSA_PATTERNS } from '../../../content';
import { scheduleInitialReview } from '../../../src/features/learn/review';
import { lightHaptic, notificationSuccess } from '../../../src/lib/haptics';

export default function DsaProblemsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [problems, setProblems] = useState<DsaProblemRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DsaStatus | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DsaDifficulty | 'all'>('all');

  // Add Modal State
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPattern, setNewPattern] = useState<string>(DSA_PATTERNS[0]);
  const [newDifficulty, setNewDifficulty] = useState<DsaDifficulty>('medium');

  // Detail Modal State
  const [selectedProblem, setSelectedProblem] = useState<DsaProblemRecord | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const loadProblems = useCallback(async () => {
    try {
      const list = await dsaRepo.getAll();
      setProblems(list);
    } catch (err) {
      console.warn('Failed to load DSA problems', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProblems();
    }, [loadProblems])
  );

  const handleCreateProblem = useCallback(async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a problem title.');
      return;
    }

    const item: DsaProblemRecord = {
      id: Crypto.randomUUID(),
      title: newTitle.trim(),
      url: newUrl.trim() || null,
      pattern: newPattern,
      difficulty: newDifficulty,
      status: 'todo',
      attempts: 0,
      time_spent_ms: 0,
      notes: null,
      solved_at: null,
      created_at: Date.now(),
    };

    await dsaRepo.insert(item);
    notificationSuccess();
    setNewTitle('');
    setNewUrl('');
    setIsAddVisible(false);
    loadProblems();
  }, [newTitle, newUrl, newPattern, newDifficulty, loadProblems]);

  const openDetail = (p: DsaProblemRecord) => {
    setSelectedProblem(p);
    setEditNotes(p.notes ?? '');
  };

  const handleUpdateStatus = useCallback(
    async (newStatus: DsaStatus) => {
      if (!selectedProblem) return;
      lightHaptic();
      const isSolved = newStatus === 'solved';
      const updated: DsaProblemRecord = {
        ...selectedProblem,
        status: newStatus,
        solved_at: isSolved ? Date.now() : selectedProblem.solved_at,
      };
      await dsaRepo.update(updated);
      setSelectedProblem(updated);
      loadProblems();
    },
    [selectedProblem, loadProblems]
  );

  const handleIncrementAttempts = useCallback(async () => {
    if (!selectedProblem) return;
    lightHaptic();
    const updated: DsaProblemRecord = {
      ...selectedProblem,
      attempts: selectedProblem.attempts + 1,
    };
    await dsaRepo.update(updated);
    setSelectedProblem(updated);
    loadProblems();
  }, [selectedProblem, loadProblems]);

  const handleSaveNotes = useCallback(async () => {
    if (!selectedProblem) return;
    await dsaRepo.update({
      id: selectedProblem.id,
      notes: editNotes.trim() || null,
    });
    setSelectedProblem((prev) => (prev ? { ...prev, notes: editNotes.trim() || null } : null));
    loadProblems();
  }, [selectedProblem, editNotes, loadProblems]);

  const handleMarkForReview = useCallback(async () => {
    if (!selectedProblem) return;
    notificationSuccess();
    // 1. Update problem status to review
    await dsaRepo.update({
      id: selectedProblem.id,
      status: 'review',
    });

    // 2. Schedule in learn_progress review queue
    const reviewSchedule = scheduleInitialReview();
    await learnRepo.upsert({
      topic_id: selectedProblem.id,
      status: 'done',
      notes: editNotes.trim() || null,
      review_stage: reviewSchedule.nextStage,
      last_reviewed_at: null,
      next_review_at: reviewSchedule.nextReviewAt,
      time_spent_ms: selectedProblem.time_spent_ms,
    });

    Alert.alert('Queued for Review', 'This problem has been added to your Spaced Review queue!');
    setSelectedProblem((prev) => (prev ? { ...prev, status: 'review' } : null));
    loadProblems();
  }, [selectedProblem, editNotes, loadProblems]);

  const handleDeleteProblem = useCallback(() => {
    if (!selectedProblem) return;
    Alert.alert('Delete Problem', 'Remove this problem from your tracker?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dsaRepo.delete(selectedProblem.id);
          setSelectedProblem(null);
          loadProblems();
        },
      },
    ]);
  }, [selectedProblem, loadProblems]);

  const getDifficultyColor = (diff?: string | null) => {
    if (diff === 'easy') return '#34C759';
    if (diff === 'hard') return '#FF3B30';
    return '#FF9500'; // medium
  };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchDiff = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
    return matchSearch && matchStatus && matchDiff;
  });

  return (
    <Screen edges={['top']} padHorizontal>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="chevron-back" color={colors.text} size={20} />
          </Pressable>
          <Text variant="title">DSA Tracker</Text>
        </View>
        <Pressable
          onPress={() => setIsAddVisible(true)}
          style={styles.addBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="add" color={colors.accent} size={22} />
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceAlt, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }]}>
        <AppIcon name="search-outline" size={16} color={colors.textTertiary} />
        <TextInput
          placeholder="Search problems..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: colors.text, flex: 1, marginLeft: 6 }]}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <Chip label="All" selected={statusFilter === 'all' && difficultyFilter === 'all'} onPress={() => { setStatusFilter('all'); setDifficultyFilter('all'); }} />
          <Chip label="Todo" selected={statusFilter === 'todo'} onPress={() => setStatusFilter('todo')} />
          <Chip label="Attempted" selected={statusFilter === 'attempted'} onPress={() => setStatusFilter('attempted')} />
          <Chip label="Solved" selected={statusFilter === 'solved'} onPress={() => setStatusFilter('solved')} />
          <Chip label="Review" selected={statusFilter === 'review'} onPress={() => setStatusFilter('review')} />
          <Chip label="Easy" selected={difficultyFilter === 'easy'} onPress={() => setDifficultyFilter(difficultyFilter === 'easy' ? 'all' : 'easy')} />
          <Chip label="Med" selected={difficultyFilter === 'medium'} onPress={() => setDifficultyFilter(difficultyFilter === 'medium' ? 'all' : 'medium')} />
          <Chip label="Hard" selected={difficultyFilter === 'hard'} onPress={() => setDifficultyFilter(difficultyFilter === 'hard' ? 'all' : 'hard')} />
        </ScrollView>
      </View>

      {/* Problems List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState message="No problems found in tracker." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openDetail(item)}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemTitleRow}>
                <View
                  style={[
                    styles.diffDot,
                    { backgroundColor: getDifficultyColor(item.difficulty) },
                  ]}
                />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {item.title}
                </Text>
              </View>
              <Text variant="caption" color={colors.textSecondary}>
                {item.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.itemMeta}>
              <Text variant="caption" color={colors.accent}>
                {item.pattern ?? 'general'}
              </Text>
              <Text variant="caption" color={colors.textTertiary}>
                Attempts: {item.attempts}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {/* Add Problem Modal */}
      <Modal visible={isAddVisible} animationType="slide" presentationStyle="pageSheet">
        <Screen edges={['top']} padHorizontal>
          <View style={styles.modalHeader}>
            <Text variant="title">Add DSA Problem</Text>
            <Pressable onPress={() => setIsAddVisible(false)}>
              <AppIcon name="close" color={colors.text} size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              Problem Title
            </Text>
            <TextInput
              placeholder="e.g. 15. 3Sum"
              placeholderTextColor={colors.textTertiary}
              value={newTitle}
              onChangeText={setNewTitle}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
            />

            <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              URL (optional)
            </Text>
            <TextInput
              placeholder="e.g. https://leetcode.com/problems/3sum/"
              placeholderTextColor={colors.textTertiary}
              value={newUrl}
              onChangeText={setNewUrl}
              autoCapitalize="none"
              style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
            />

            <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              Difficulty
            </Text>
            <View style={styles.chipRow}>
              {(['easy', 'medium', 'hard'] as DsaDifficulty[]).map((d) => (
                <Chip
                  key={d}
                  label={d.toUpperCase()}
                  selected={newDifficulty === d}
                  onPress={() => setNewDifficulty(d)}
                />
              ))}
            </View>

            <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              Pattern
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {DSA_PATTERNS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  selected={newPattern === p}
                  onPress={() => setNewPattern(p)}
                />
              ))}
            </ScrollView>

            <Button
              title="Add Problem"
              variant="primary"
              icon={<AppIcon name="add" size={16} color={colors.inkText} />}
              onPress={handleCreateProblem}
              style={{ marginTop: 24 }}
            />
          </ScrollView>
        </Screen>
      </Modal>

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <Modal visible={!!selectedProblem} animationType="slide" presentationStyle="pageSheet">
          <Screen edges={['top']} padHorizontal>
            <View style={styles.modalHeader}>
              <Text variant="title" style={{ flex: 1 }}>
                {selectedProblem.title}
              </Text>
              <Pressable onPress={() => setSelectedProblem(null)}>
                <AppIcon name="close" color={colors.text} size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Meta row */}
              <View style={styles.detailMetaRow}>
                <View style={styles.diffRow}>
                  <View
                    style={[
                      styles.diffDot,
                      { backgroundColor: getDifficultyColor(selectedProblem.difficulty) },
                    ]}
                  />
                  <Text variant="bodyStrong">
                    {(selectedProblem.difficulty ?? 'medium').toUpperCase()}
                  </Text>
                </View>
                <Text variant="caption" color={colors.accent}>
                  {selectedProblem.pattern}
                </Text>
                {selectedProblem.url && (
                  <Pressable
                    onPress={() => Linking.openURL(selectedProblem.url!)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon name="open-outline" color={colors.accent} size={16} />
                  </Pressable>
                )}
              </View>

              {/* Status Stepper */}
              <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                Status
              </Text>
              <View style={styles.chipRow}>
                {(['todo', 'attempted', 'solved', 'review'] as DsaStatus[]).map((st) => (
                  <Chip
                    key={st}
                    label={st.toUpperCase()}
                    selected={selectedProblem.status === st}
                    onPress={() => handleUpdateStatus(st)}
                  />
                ))}
              </View>

              {/* Attempts counter & Time spent */}
              <View style={styles.statsBox}>
                <View>
                  <Text variant="caption" color={colors.textSecondary}>
                    Attempts
                  </Text>
                  <Text variant="title">{selectedProblem.attempts}</Text>
                </View>
                <Button
                  title="+1 Attempt"
                  variant="secondary"
                  size="sm"
                  onPress={handleIncrementAttempts}
                />
              </View>

              {/* Approach & Mistake Notes */}
              <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                Approach, Complexity & Mistakes
              </Text>
              <TextInput
                placeholder="What was the core insight? Space/time complexity? Why did initial attempts fail?"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={5}
                value={editNotes}
                onChangeText={setEditNotes}
                onBlur={handleSaveNotes}
                style={[
                  styles.notesArea,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.hairline,
                  },
                ]}
              />

              {/* Review Queue & Delete Actions */}
              <View style={{ marginTop: 20, gap: 12 }}>
                <Button
                  title="★ Add to Spaced Review"
                  variant="primary"
                  onPress={handleMarkForReview}
                />
                <Button
                  title="Delete Problem"
                  variant="danger"
                  onPress={handleDeleteProblem}
                />
              </View>
            </ScrollView>
          </Screen>
        </Modal>
      )}
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
    paddingVertical: 8,
  },
  filterList: {
    gap: 8,
  },
  listContent: {
    paddingBottom: 30,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  diffDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalContent: {
    paddingBottom: 40,
  },
  fieldLabel: {
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  notesArea: {
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 12,
    minHeight: 110,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
