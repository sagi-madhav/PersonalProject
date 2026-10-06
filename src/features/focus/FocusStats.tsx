import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Sheet, Sparkline } from '../../components';
import { useTheme } from '../../theme';
import { focusRepo } from '../../db/repos/focusRepo';
import { formatDurationMinutes } from '../../lib/time';

export function FocusStats() {
  const { colors } = useTheme();
  const [todayMs, setTodayMs] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const sessions = await focusRepo.getByDateRange(
          startOfToday.getTime(),
          endOfToday.getTime()
        );

        let total = 0;
        for (const s of sessions) {
          total += s.actual_ms;
        }

        setTodayMs(total);
        setSessionCount(sessions.length);

        // Past 7 days
        const weekTotals: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const nextD = new Date(d);
          nextD.setHours(23, 59, 59, 999);

          const daysSessions = await focusRepo.getByDateRange(d.getTime(), nextD.getTime());
          const sum = daysSessions.reduce((acc, curr) => acc + curr.actual_ms, 0);
          weekTotals.push(Math.round(sum / (60 * 1000))); // in minutes
        }
        setWeekData(weekTotals);
      } catch (err) {
        console.warn('Failed to load focus stats', err);
      }
    }

    loadStats();
  }, []);

  const todayMin = Math.round(todayMs / (60 * 1000));
  const timeFormatted = formatDurationMinutes(todayMin);

  return (
    <>
      <Pressable
        onPress={() => setSheetVisible(true)}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel="View focus stats"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text variant="caption" color={colors.textSecondary} style={styles.text}>
          Today {timeFormatted} · {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
        </Text>
      </Pressable>

      <Sheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
        <View style={styles.sheetContent}>
          <Text variant="heading" style={styles.sheetTitle}>
            Focus Stats
          </Text>

          <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text variant="caption" color={colors.textSecondary}>
              PAST 7 DAYS (MINUTES)
            </Text>
            <View style={styles.sparklineContainer}>
              <Sparkline data={weekData} type="bar" width={240} height={44} color={colors.accent} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.metric}>
              <Text variant="display" style={styles.metricNumber}>
                {todayMin}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Minutes Today
              </Text>
            </View>
            <View style={styles.metric}>
              <Text variant="display" style={styles.metricNumber}>
                {sessionCount}
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                Sessions
              </Text>
            </View>
          </View>
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
  },
  sheetContent: {
    paddingVertical: 12,
  },
  sheetTitle: {
    marginBottom: 16,
  },
  statBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  sparklineContainer: {
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 48,
    lineHeight: 52,
  },
});
