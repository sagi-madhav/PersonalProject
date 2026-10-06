import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../../../components';
import { getNowMinutes, startMinToTimeString } from '../../../lib/time';
import { getNowY, HOUR_ROW_HEIGHT } from './layout';

export interface NowLineProps {
  clockFormat24h?: boolean;
  hourRowHeight?: number;
}

export function NowLine({ clockFormat24h = false, hourRowHeight = HOUR_ROW_HEIGHT }: NowLineProps) {
  const { colors } = useTheme();
  const [nowMin, setNowMin] = useState(getNowMinutes);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMin(getNowMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const top = getNowY(nowMin, hourRowHeight);
  const timeLabel = startMinToTimeString(nowMin, clockFormat24h);

  return (
    <View style={[styles.container, { top }]} pointerEvents="none">
      <View style={[styles.dot, { backgroundColor: colors.accent }]} />
      <View style={[styles.line, { backgroundColor: colors.accent }]} />
      <View style={[styles.labelBadge, { backgroundColor: colors.bg }]}>
        <Text variant="micro" color={colors.accent} tabular style={styles.labelText}>
          {timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 48,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: -3.5,
  },
  line: {
    flex: 1,
    height: 1.5,
  },
  labelBadge: {
    paddingHorizontal: 4,
  },
  labelText: {
    fontWeight: '700',
  },
});
