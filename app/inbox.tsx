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
import { Screen, Text, EmptyState, AppIcon } from '../src/components';
import { useTheme } from '../src/theme';
import { blocksRepo } from '../src/db/repos/blocksRepo';
import { BlockRecord } from '../src/db/types';
import { getTodayKey } from '../src/lib/time';
import { lightHaptic, notificationWarning } from '../src/lib/haptics';

export default function InboxScreen() {
  const router = useRouter();
  const { colors, category } = useTheme();

  const [inboxBlocks, setInboxBlocks] = useState<BlockRecord[]>([]);
  const [quickInput, setQuickInput] = useState('');

  const loadInbox = useCallback(async () => {
    try {
      const items = await blocksRepo.getInbox();
      setInboxBlocks(items);
    } catch (err) {
      console.warn('Failed to load inbox', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [loadInbox])
  );

  const handleQuickAdd = useCallback(async () => {
    if (!quickInput.trim()) return;
    const now = Date.now();
    await blocksRepo.insert({
      id: Crypto.randomUUID(),
      title: quickInput.trim(),
      kind: 'task',
      category: 'other',
      date: null,
      start_min: null,
      duration_min: null,
      done_at: null,
      notes: null,
      link_type: null,
      link_id: null,
      created_at: now,
      updated_at: now,
    });
    setQuickInput('');
    lightHaptic();
    loadInbox();
  }, [quickInput, loadInbox]);

  const handleToggleDone = useCallback(async (block: BlockRecord) => {
    const isDone = block.done_at != null;
    const now = Date.now();
    await blocksRepo.update({
      id: block.id,
      done_at: isDone ? null : now,
    });
    lightHaptic();
    loadInbox();
  }, [loadInbox]);

  const handleScheduleForToday = useCallback(async (block: BlockRecord) => {
    await blocksRepo.update({
      id: block.id,
      date: getTodayKey(),
      start_min: 540, // 9:00 AM
      duration_min: 30,
    });
    lightHaptic();
    loadInbox();
  }, [loadInbox]);

  const handleDelete = (block: BlockRecord) => {
    Alert.alert('Delete Task', 'Remove from inbox?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await blocksRepo.delete(block.id);
          notificationWarning();
          loadInbox();
        },
      },
    ]);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="title">Inbox</Text>
          <Text variant="caption" color={colors.textSecondary} style={styles.countText}>
            {inboxBlocks.length}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Close"
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="close" color={colors.textSecondary} size={20} />
        </Pressable>
      </View>

      {/* Quick capture input */}
      <View style={[styles.captureContainer, { borderBottomColor: colors.hairline }]}>
        <TextInput
          autoFocus
          placeholder="Capture thought, task, or note..."
          placeholderTextColor={colors.textTertiary}
          value={quickInput}
          onChangeText={setQuickInput}
          onSubmitEditing={handleQuickAdd}
          returnKeyType="done"
          style={[styles.captureInput, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
        />
      </View>

      {/* Inbox List */}
      <FlatList
        data={inboxBlocks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            iconName="file-tray-outline"
            message="Inbox is clear. Capture thoughts quickly above."
          />
        }
        renderItem={({ item }) => {
          const catInfo = category(item.category);
          const isDone = item.done_at != null;

          return (
            <View style={[styles.itemRow, { borderBottomColor: colors.hairline }]}>
              {/* Checkbox */}
              <Pressable
                onPress={() => handleToggleDone(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.checkBtn}
              >
                <View
                  style={[
                    styles.circle,
                    { borderColor: catInfo.solid },
                    isDone && { backgroundColor: catInfo.solid },
                  ]}
                />
              </Pressable>

              {/* Title */}
              <Pressable
                style={styles.titleArea}
                onPress={() => router.push(`/block/${item.id}`)}
              >
                <Text
                  variant="body"
                  color={colors.text}
                  style={[isDone && styles.strikethrough]}
                >
                  {item.title}
                </Text>
              </Pressable>

              {/* Actions: Schedule to Today & Delete */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => handleScheduleForToday(item)}
                  style={styles.actionBtn}
                  accessibilityLabel="Schedule for Today"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="calendar-outline" color={colors.accent} size={18} />
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(item)}
                  style={styles.actionBtn}
                  accessibilityLabel="Delete item"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppIcon name="trash-outline" color={colors.textTertiary} size={16} />
                </Pressable>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  captureContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  captureInput: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  checkBtn: {
    marginRight: 12,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  titleArea: {
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
  },
});
