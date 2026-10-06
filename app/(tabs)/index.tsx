import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { format } from 'date-fns';
import { Screen, Text } from '../../src/components';
import { useTheme } from '../../src/theme';
import { useSettingsStore } from '../../src/lib/settingsStore';
import { blocksRepo } from '../../src/db/repos/blocksRepo';
import { BlockRecord } from '../../src/db/types';
import { getTodayKey, getOffsetDayKey, parseKeyToDate } from '../../src/lib/time';
import { TimelineView } from '../../src/features/today/timeline/TimelineView';
import { RolloverBanner } from '../../src/features/blocks/RolloverBanner';

export default function TodayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();

  const [currentDateKey, setCurrentDateKey] = useState(getTodayKey);
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [unfinishedYesterday, setUnfinishedYesterday] = useState<BlockRecord[]>([]);
  const [showRollover, setShowRollover] = useState(true);

  const isToday = currentDateKey === getTodayKey();
  const currentDate = parseKeyToDate(currentDateKey);
  const formattedHeaderDate = format(currentDate, 'EEE, MMM d');

  const fetchBlocks = useCallback(async () => {
    try {
      const dayBlocks = await blocksRepo.getByDate(currentDateKey);
      setBlocks(dayBlocks);

      const inbox = await blocksRepo.getInbox();
      setInboxCount(inbox.length);

      const yesterdayKey = getOffsetDayKey(getTodayKey(), -1);
      const yesterdayBlocks = await blocksRepo.getByDate(yesterdayKey);
      const undone = yesterdayBlocks.filter((b) => b.kind === 'task' && b.done_at == null);
      setUnfinishedYesterday(undone);
    } catch (err) {
      console.warn('Failed to load blocks', err);
    }
  }, [currentDateKey]);

  useFocusEffect(
    useCallback(() => {
      fetchBlocks();
    }, [fetchBlocks])
  );

  const handleToggleDone = async (block: BlockRecord) => {
    const isDone = block.done_at != null;
    await blocksRepo.update({
      id: block.id,
      done_at: isDone ? null : Date.now(),
    });
    fetchBlocks();
  };

  const handlePrevDay = () => {
    setCurrentDateKey((prev) => getOffsetDayKey(prev, -1));
  };

  const handleNextDay = () => {
    setCurrentDateKey((prev) => getOffsetDayKey(prev, 1));
  };

  const handleRollToToday = async () => {
    for (const task of unfinishedYesterday) {
      await blocksRepo.update({ id: task.id, date: getTodayKey() });
    }
    setShowRollover(false);
    fetchBlocks();
  };

  const handleRollToInbox = async () => {
    for (const task of unfinishedYesterday) {
      await blocksRepo.update({ id: task.id, date: null, start_min: null });
    }
    setShowRollover(false);
    fetchBlocks();
  };

  return (
    <Screen edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="title">{formattedHeaderDate}</Text>
          {!isToday ? (
            <Pressable
              onPress={() => setCurrentDateKey(getTodayKey())}
              style={[styles.todayPill, { backgroundColor: colors.surfaceAlt }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text variant="caption" color={colors.accent} style={{ fontWeight: '600' }}>
                Today
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="Inbox"
            onPress={() => router.push('/inbox')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="tray" tintColor={colors.text} size={20} />
            {inboxCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text variant="micro" color="#FFF" style={styles.badgeText}>
                  {inboxCount}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityLabel="Add Block"
            onPress={() => router.push(`/block/new?date=${currentDateKey}`)}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="plus" tintColor={colors.text} size={20} />
          </Pressable>

          <Pressable
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="gearshape" tintColor={colors.text} size={20} />
          </Pressable>
        </View>
      </View>

      {/* Day Pager */}
      <View style={[styles.pagerRow, { borderBottomColor: colors.hairline }]}>
        <Pressable
          onPress={handlePrevDay}
          style={styles.pagerChevron}
          accessibilityLabel="Previous day"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="chevron.left" tintColor={colors.textSecondary} size={16} />
        </Pressable>

        <Text variant="caption" color={colors.textSecondary}>
          {isToday ? 'Today' : formattedHeaderDate}
        </Text>

        <Pressable
          onPress={handleNextDay}
          style={styles.pagerChevron}
          accessibilityLabel="Next day"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SymbolView name="chevron.right" tintColor={colors.textSecondary} size={16} />
        </Pressable>
      </View>

      {/* Rollover Banner */}
      {isToday && showRollover && unfinishedYesterday.length > 0 ? (
        <RolloverBanner
          unfinishedCount={unfinishedYesterday.length}
          onMoveToToday={handleRollToToday}
          onMoveToInbox={handleRollToInbox}
          onDismiss={() => setShowRollover(false)}
        />
      ) : null}

      {/* Timeline View */}
      <TimelineView
        date={currentDateKey}
        blocks={blocks}
        clockFormat24h={settings.clockFormat === '24h'}
        onPressBlock={(block) => router.push(`/block/${block.id}`)}
        onToggleDone={handleToggleDone}
        onPressEmptySlot={(startMin) =>
          router.push(`/block/new?date=${currentDateKey}&startMin=${startMin}`)
        }
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
    paddingTop: 8,
    paddingBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  pagerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
  },
  pagerChevron: {
    padding: 6,
  },
});
