import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { format, addMonths, subMonths } from 'date-fns';
import { Screen, Text, Button } from '../../src/components';
import { useTheme } from '../../src/theme';
import { useSettingsStore } from '../../src/lib/settingsStore';
import { blocksRepo } from '../../src/db/repos/blocksRepo';
import { workoutsRepo } from '../../src/db/repos/workoutsRepo';
import { BlockRecord } from '../../src/db/types';
import { buildMonthGrid } from '../../src/features/calendar/grid';
import { getTodayKey, startMinToTimeString, formatDateToKey } from '../../src/lib/time';
import { lightHaptic } from '../../src/lib/haptics';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors, category } = useTheme();
  const settings = useSettingsStore();

  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayKey);
  const [monthBlocks, setMonthBlocks] = useState<Record<string, BlockRecord[]>>({});
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [selectedDayBlocks, setSelectedDayBlocks] = useState<BlockRecord[]>([]);

  const loadCalendarData = useCallback(async () => {
    try {
      const allBlocks = await blocksRepo.getAll();
      const grouped: Record<string, BlockRecord[]> = {};
      for (const b of allBlocks) {
        if (b.date) {
          if (!grouped[b.date]) grouped[b.date] = [];
          grouped[b.date].push(b);
        }
      }
      setMonthBlocks(grouped);

      const allWorkouts = await workoutsRepo.getAll();
      const wSet = new Set<string>();
      for (const w of allWorkouts) {
        const key = formatDateToKey(new Date(w.started_at));
        wSet.add(key);
      }
      setWorkoutDates(wSet);

      const dayItems = grouped[selectedDateKey] || [];
      setSelectedDayBlocks(dayItems.sort((a, b) => (a.start_min ?? 0) - (b.start_min ?? 0)));
    } catch (err) {
      console.warn('Failed to load calendar data', err);
    }
  }, [selectedDateKey]);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [loadCalendarData])
  );

  const handlePrevMonth = () => {
    lightHaptic();
    setCurrentMonthDate((d) => subMonths(d, 1));
  };

  const handleNextMonth = () => {
    lightHaptic();
    setCurrentMonthDate((d) => addMonths(d, 1));
  };

  const handleSelectDay = (dateKey: string) => {
    lightHaptic();
    setSelectedDateKey(dateKey);
  };

  const grid = buildMonthGrid(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth(),
    settings.weekStart
  );

  const monthYearTitle = format(currentMonthDate, 'MMMM yyyy');
  const weekDays =
    settings.weekStart === 'mon'
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Screen edges={['top']} padHorizontal>
      {/* Month Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text variant="title">{monthYearTitle}</Text>
          <Pressable
            onPress={() => {
              lightHaptic();
              setCurrentMonthDate(new Date());
              setSelectedDateKey(getTodayKey());
            }}
            style={[styles.todayPill, { backgroundColor: colors.surfaceAlt }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text variant="caption" color={colors.accent} style={{ fontWeight: '600' }}>
              Today
            </Text>
          </Pressable>
        </View>

        <View style={styles.navRow}>
          <Pressable
            onPress={handlePrevMonth}
            style={styles.chevronBtn}
            accessibilityLabel="Previous month"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="chevron.left" tintColor={colors.text} size={18} />
          </Pressable>
          <Pressable
            onPress={handleNextMonth}
            style={styles.chevronBtn}
            accessibilityLabel="Next month"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="chevron.right" tintColor={colors.text} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Weekday initials */}
      <View style={styles.weekDaysRow}>
        {weekDays.map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <Text variant="micro" color={colors.textTertiary}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Month Grid */}
      <View style={styles.gridContainer}>
        {grid.map((cell) => {
          const isSelected = cell.dateKey === selectedDateKey;
          const dayBlocks = monthBlocks[cell.dateKey] || [];
          const hasWorkout = workoutDates.has(cell.dateKey);

          return (
            <Pressable
              key={cell.dateKey}
              onPress={() => handleSelectDay(cell.dateKey)}
              style={styles.dayCol}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <View
                style={[
                  styles.dayCircle,
                  isSelected && { backgroundColor: colors.ink },
                  cell.isToday && !isSelected && { borderColor: colors.accent, borderWidth: 1.5 },
                  !cell.isCurrentMonth && { opacity: 0.3 },
                ]}
              >
                <Text
                  variant="caption"
                  color={isSelected ? colors.inkText : colors.text}
                  style={[styles.dayNum, isSelected && { fontWeight: '700' }]}
                >
                  {cell.dayNumber}
                </Text>
              </View>

              {/* Dots and workout tick */}
              <View style={styles.dotsRow}>
                {dayBlocks.slice(0, 3).map((b) => (
                  <View
                    key={b.id}
                    style={[
                      styles.dot,
                      { backgroundColor: category(b.category).solid },
                    ]}
                  />
                ))}
                {hasWorkout ? (
                  <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.hairline }]} />

      {/* Agenda for Selected Day */}
      <View style={styles.agendaHeader}>
        <Text variant="bodyStrong">
          {format(new Date(selectedDateKey + 'T12:00:00'), 'EEEE, MMMM d')}
        </Text>
        <Button
          title="Open Day"
          variant="quiet"
          size="sm"
          onPress={() => router.push(`/(tabs)?date=${selectedDateKey}`)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.agendaList}>
        {selectedDayBlocks.length === 0 ? (
          <Text variant="body" color={colors.textTertiary} style={styles.emptyText}>
            No plans scheduled for this day.
          </Text>
        ) : (
          selectedDayBlocks.map((b) => {
            const timeStr =
              b.start_min != null ? startMinToTimeString(b.start_min, false) : 'All day';
            const catInfo = category(b.category);

            return (
              <Pressable
                key={b.id}
                onPress={() => router.push(`/block/${b.id}`)}
                style={[styles.agendaItem, { borderBottomColor: colors.hairline }]}
              >
                <View style={[styles.catBar, { backgroundColor: catInfo.solid }]} />
                <View style={styles.agendaTime}>
                  <Text variant="caption" color={colors.textSecondary} tabular>
                    {timeStr}
                  </Text>
                </View>
                <Text variant="body" color={colors.text} style={styles.agendaTitle}>
                  {b.title}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  navRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  chevronBtn: {
    padding: 6,
  },
  weekDaysRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: {
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
    marginTop: 2,
  },
  dot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },
  divider: {
    height: 0.5,
    marginVertical: 12,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agendaList: {
    paddingBottom: 30,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  catBar: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
    marginRight: 8,
  },
  agendaTime: {
    width: 70,
  },
  agendaTitle: {
    flex: 1,
  },
});
