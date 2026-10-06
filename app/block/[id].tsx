import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Crypto from 'expo-crypto';
import { Screen, Text, Button, Chip, Stepper } from '../../src/components';
import { useTheme, BlockCategory } from '../../src/theme';
import { blocksRepo } from '../../src/db/repos/blocksRepo';
import { BlockRecord, BlockKind } from '../../src/db/types';
import {
  getTodayKey,
  getOffsetDayKey,
  startMinToTimeString,
  formatDurationMinutes,
} from '../../src/lib/time';
import { lightHaptic, notificationWarning } from '../../src/lib/haptics';

import { getLessonById } from '../../content';

const KINDS: { label: string; kind: BlockKind }[] = [
  { label: 'Task', kind: 'task' },
  { label: 'Event', kind: 'event' },
  { label: 'Focus', kind: 'focus' },
  { label: 'Workout', kind: 'workout' },
  { label: 'Study', kind: 'study' },
];

const CATEGORIES: { label: string; cat: BlockCategory }[] = [
  { label: 'Work', cat: 'work' },
  { label: 'Study', cat: 'study' },
  { label: 'Health', cat: 'health' },
  { label: 'Life', cat: 'life' },
  { label: 'Other', cat: 'other' },
];

export default function BlockEditorScreen() {
  const router = useRouter();
  const { colors, category } = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    date?: string;
    startMin?: string;
    title?: string;
    kind?: BlockKind;
    linkType?: 'topic' | 'workout';
    linkId?: string;
  }>();

  const isNew = params.id === 'new';

  const [title, setTitle] = useState(params.title || '');
  const [kind, setKind] = useState<BlockKind>(params.kind || 'task');
  const [selectedCat, setSelectedCat] = useState<BlockCategory>(() => {
    if (params.kind === 'study') return 'study';
    if (params.kind === 'workout') return 'health';
    return 'other';
  });
  const [whenMode, setWhenMode] = useState<'inbox' | 'today' | 'tomorrow' | 'other'>(() => {
    if (params.date === undefined && isNew) return 'today';
    if (params.date === null || params.date === '') return 'inbox';
    return 'today';
  });
  const [dateKey, setDateKey] = useState<string | null>(params.date || getTodayKey());
  const [startMin, setStartMin] = useState<number>(() => {
    return params.startMin ? parseInt(params.startMin, 10) : 540; // 9:00 AM default
  });
  const [durationMin, setDurationMin] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const [existingBlock, setExistingBlock] = useState<BlockRecord | null>(null);

  // Load existing block if editing
  useEffect(() => {
    if (!isNew && params.id) {
      blocksRepo.getById(params.id).then((b) => {
        if (b) {
          setExistingBlock(b);
          setTitle(b.title);
          setKind(b.kind);
          setSelectedCat(b.category);
          setDateKey(b.date);
          if (b.date === null) {
            setWhenMode('inbox');
          } else if (b.date === getTodayKey()) {
            setWhenMode('today');
          } else if (b.date === getOffsetDayKey(getTodayKey(), 1)) {
            setWhenMode('tomorrow');
          } else {
            setWhenMode('other');
          }
          if (b.start_min != null) setStartMin(b.start_min);
          if (b.duration_min != null) setDurationMin(b.duration_min);
          if (b.notes) setNotes(b.notes);
        }
      });
    }
  }, [isNew, params.id]);

  const handleWhenChange = (mode: 'inbox' | 'today' | 'tomorrow') => {
    setWhenMode(mode);
    if (mode === 'inbox') {
      setDateKey(null);
    } else if (mode === 'today') {
      setDateKey(getTodayKey());
    } else if (mode === 'tomorrow') {
      setDateKey(getOffsetDayKey(getTodayKey(), 1));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for the block.');
      return;
    }

    const now = Date.now();
    const finalDate = whenMode === 'inbox' ? null : dateKey;
    const finalStartMin = whenMode === 'inbox' ? null : startMin;
    const finalDuration = whenMode === 'inbox' ? null : durationMin;

    if (isNew) {
      await blocksRepo.insert({
        id: Crypto.randomUUID(),
        title: title.trim(),
        kind,
        category: selectedCat,
        date: finalDate,
        start_min: finalStartMin,
        duration_min: finalDuration,
        done_at: null,
        notes: notes.trim() || null,
        link_type: params.linkType || null,
        link_id: params.linkId || null,
        created_at: now,
        updated_at: now,
      });
    } else if (existingBlock) {
      await blocksRepo.update({
        id: existingBlock.id,
        title: title.trim(),
        kind,
        category: selectedCat,
        date: finalDate,
        start_min: finalStartMin,
        duration_min: finalDuration,
        notes: notes.trim() || null,
      });
    }

    lightHaptic();
    router.back();
  };

  const handleDelete = () => {
    if (!existingBlock) return;
    Alert.alert('Delete Block', 'Are you sure you want to delete this block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await blocksRepo.delete(existingBlock.id);
          notificationWarning();
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text variant="title">{isNew ? 'New Block' : 'Edit Block'}</Text>
          <Pressable
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="xmark" tintColor={colors.textSecondary} size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Title input */}
          <TextInput
            autoFocus={isNew}
            placeholder="Title"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            style={[styles.titleInput, { color: colors.text, borderColor: colors.hairline }]}
          />

          {/* Kind Chips */}
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
              KIND
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {KINDS.map((k) => (
                <Chip
                  key={k.kind}
                  label={k.label}
                  selected={kind === k.kind}
                  onPress={() => setKind(k.kind)}
                />
              ))}
            </ScrollView>
          </View>

          {/* When Chips */}
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
              WHEN
            </Text>
            <View style={styles.chipRow}>
              <Chip
                label="Inbox"
                selected={whenMode === 'inbox'}
                onPress={() => handleWhenChange('inbox')}
              />
              <Chip
                label="Today"
                selected={whenMode === 'today'}
                onPress={() => handleWhenChange('today')}
              />
              <Chip
                label="Tomorrow"
                selected={whenMode === 'tomorrow'}
                onPress={() => handleWhenChange('tomorrow')}
              />
            </View>
          </View>

          {/* Time & Duration Steppers (Only when scheduled) */}
          {whenMode !== 'inbox' ? (
            <View style={styles.timeSection}>
              <View style={styles.stepperCol}>
                <Stepper
                  label="START TIME"
                  value={startMin}
                  step={15}
                  min={0}
                  max={1425}
                  format={(val) => startMinToTimeString(val, false)}
                  onChange={setStartMin}
                />
              </View>
              <View style={styles.stepperCol}>
                <Stepper
                  label="DURATION"
                  value={durationMin}
                  step={15}
                  min={15}
                  max={480}
                  format={(val) => formatDurationMinutes(val)}
                  onChange={setDurationMin}
                />
              </View>
            </View>
          ) : null}

          {/* Category Chips */}
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
              CATEGORY
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {CATEGORIES.map((c) => {
                const catInfo = category(c.cat);
                return (
                  <Chip
                    key={c.cat}
                    label={c.label}
                    dotColor={catInfo.solid}
                    selected={selectedCat === c.cat}
                    onPress={() => setSelectedCat(c.cat)}
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionLabel}>
              NOTES
            </Text>
            <TextInput
              placeholder="Add details, links, or notes..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={[
                styles.notesInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.hairline,
                },
              ]}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button title="Save" variant="primary" onPress={handleSave} style={{ marginBottom: 12 }} />
            {!isNew ? (
              <Button
                title="Start Focus Session"
                variant="secondary"
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/focus',
                    params: { label: title },
                  });
                }}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            {!isNew && existingBlock?.link_type === 'topic' && existingBlock.link_id ? (
              <Button
                title="Open Linked Lesson"
                variant="secondary"
                onPress={() => {
                  const lesson = getLessonById(existingBlock.link_id!);
                  const track = lesson ? lesson.track : 'python';
                  router.push(`/(tabs)/learn/${track}/${existingBlock.link_id}` as any);
                }}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            {!isNew && existingBlock?.link_type === 'workout' ? (
              <Button
                title="View Workout History"
                variant="secondary"
                onPress={() => {
                  router.push('/(tabs)/train/history');
                }}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            {!isNew ? (
              <Button title="Delete Block" variant="quiet" onPress={handleDelete} />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  stepperCol: {
    flex: 1,
  },
  notesInput: {
    minHeight: 90,
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  actionButtons: {
    marginTop: 20,
  },
});
