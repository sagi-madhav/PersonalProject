import React, { useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../../../components';
import { BlockRecord } from '../../../db/types';
import { HOUR_ROW_HEIGHT, timeToY, yToTime, snapMinutes } from './layout';
import { packColumns } from './packing';
import { findFreeGaps } from './gaps';
import { NowLine } from './NowLine';
import { TimelineBlock } from './TimelineBlock';
import { getTodayKey, getNowMinutes, startMinToTimeString, formatDurationMinutes } from '../../../lib/time';

export interface TimelineViewProps {
  date: string;
  blocks: BlockRecord[];
  clockFormat24h?: boolean;
  onPressBlock: (block: BlockRecord) => void;
  onToggleDone: (block: BlockRecord) => void;
  onPressEmptySlot: (startMin: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimelineView({
  date,
  blocks,
  clockFormat24h = false,
  onPressBlock,
  onToggleDone,
  onPressEmptySlot,
}: TimelineViewProps) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView | null>(null);
  const isToday = date === getTodayKey();

  // Scroll to current time minus 1 hour on mount
  useEffect(() => {
    if (isToday) {
      const targetMin = Math.max(0, getNowMinutes() - 60);
      const targetY = timeToY(targetMin, HOUR_ROW_HEIGHT);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: targetY, animated: false });
      }, 50);
    } else {
      // 7 AM on other days
      const targetY = timeToY(7 * 60, HOUR_ROW_HEIGHT);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: targetY, animated: false });
      }, 50);
    }
  }, [date, isToday]);

  const packed = packColumns(blocks);
  const gaps = findFreeGaps(blocks);

  const handleEmptyPress = (e: any) => {
    const y = e.nativeEvent.locationY;
    const min = yToTime(y, HOUR_ROW_HEIGHT);
    const snapped = snapMinutes(min, 15);
    onPressEmptySlot(snapped);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 24 Hour Rows */}
      {HOURS.map((hour) => {
        const timeLabel = startMinToTimeString(hour * 60, clockFormat24h);
        return (
          <View key={hour} style={[styles.hourRow, { height: HOUR_ROW_HEIGHT }]}>
            <View style={styles.gutter}>
              <Text variant="caption" color={colors.textTertiary} tabular style={styles.hourLabel}>
                {timeLabel}
              </Text>
            </View>
            <View style={[styles.hourLine, { backgroundColor: colors.hairline }]} />
          </View>
        );
      })}

      {/* Touch capture layer for tapping empty slots */}
      <Pressable
        onPress={handleEmptyPress}
        style={styles.touchArea}
        accessibilityLabel="Timeline grid. Tap empty slot to add block."
      />

      {/* Free Gap Indicators */}
      {gaps.map((gap, idx) => {
        const top = timeToY(gap.startMin, HOUR_ROW_HEIGHT);
        const height = timeToY(gap.durationMin, HOUR_ROW_HEIGHT);
        return (
          <View
            key={`gap-${idx}`}
            style={[styles.gapMarker, { top, height }]}
            pointerEvents="none"
          >
            <Text variant="caption" color={colors.textTertiary}>
              · {formatDurationMinutes(gap.durationMin)} free ·
            </Text>
          </View>
        );
      })}

      {/* Blocks Container */}
      <View style={styles.blocksLayer} pointerEvents="box-none">
        {packed.map((p) => (
          <TimelineBlock
            key={p.block.id}
            block={p.block}
            column={p.column}
            totalColumns={p.totalColumns}
            clockFormat24h={clockFormat24h}
            onPress={onPressBlock}
            onToggleDone={onToggleDone}
          />
        ))}
      </View>

      {/* Now Line */}
      {isToday ? (
        <NowLine clockFormat24h={clockFormat24h} hourRowHeight={HOUR_ROW_HEIGHT} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    height: 24 * HOUR_ROW_HEIGHT + 40,
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gutter: {
    width: 56,
    paddingRight: 8,
    alignItems: 'flex-end',
    marginTop: -8,
  },
  hourLabel: {
    fontSize: 11,
  },
  hourLine: {
    flex: 1,
    height: 0.5,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 56,
    right: 12,
    bottom: 0,
    zIndex: 1,
  },
  gapMarker: {
    position: 'absolute',
    left: 56,
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  blocksLayer: {
    position: 'absolute',
    top: 0,
    left: 56,
    right: 12,
    bottom: 0,
    zIndex: 2,
  },
});
