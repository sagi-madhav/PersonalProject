import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../../../components';
import { BlockRecord } from '../../../db/types';
import { timeToY, HOUR_ROW_HEIGHT } from './layout';
import { formatTimeRange } from '../../../lib/time';
import { lightHaptic } from '../../../lib/haptics';

export interface TimelineBlockProps {
  block: BlockRecord;
  column?: number;
  totalColumns?: number;
  hourRowHeight?: number;
  clockFormat24h?: boolean;
  onPress: (block: BlockRecord) => void;
  onToggleDone: (block: BlockRecord) => void;
}

export function TimelineBlock({
  block,
  column = 0,
  totalColumns = 1,
  hourRowHeight = HOUR_ROW_HEIGHT,
  clockFormat24h = false,
  onPress,
  onToggleDone,
}: TimelineBlockProps) {
  const { colors, category } = useTheme();

  const startMin = block.start_min ?? 0;
  const durationMin = block.duration_min ?? 30;

  const top = timeToY(startMin, hourRowHeight);
  const rawHeight = timeToY(durationMin, hourRowHeight);
  const height = Math.max(26, rawHeight);

  const catColors = category(block.category);
  const isDone = block.done_at != null;

  // Compute column width and left position
  const leftPercent = (column / totalColumns) * 100;
  const widthPercent = (1 / totalColumns) * 100;

  const timeCaption = formatTimeRange(startMin, durationMin, clockFormat24h);
  const showTime = height >= 44;

  const handleCheckbox = (e: any) => {
    e.stopPropagation?.();
    lightHaptic();
    onToggleDone(block);
  };

  return (
    <Pressable
      onPress={() => onPress(block)}
      accessibilityRole="button"
      accessibilityLabel={`${block.title}, ${timeCaption}, ${isDone ? 'completed' : 'not completed'}`}
      style={({ pressed }) => [
        styles.container,
        {
          top,
          height,
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          backgroundColor: catColors.tint,
          opacity: isDone ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.colorBar, { backgroundColor: catColors.solid }]} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          {block.kind === 'task' ? (
            <Pressable
              onPress={handleCheckbox}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.checkbox}
            >
              <View
                style={[
                  styles.circle,
                  { borderColor: catColors.solid },
                  isDone && { backgroundColor: catColors.solid },
                ]}
              />
            </Pressable>
          ) : null}

          <Text
            variant="bodyStrong"
            color={colors.text}
            numberOfLines={height < 44 ? 1 : 2}
            style={[styles.title, isDone && styles.strikethrough]}
          >
            {block.title}
          </Text>
        </View>

        {showTime ? (
          <Text variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.timeCaption}>
            {timeCaption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    zIndex: 2,
  },
  colorBar: {
    width: 3.5,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 6,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  timeCaption: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
});
