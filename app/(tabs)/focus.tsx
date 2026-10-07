import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Text, Button, Segmented, ProgressBar, Chip, AppIcon } from '../../src/components';
import { useTheme } from '../../src/theme';
import { useTimer } from '../../src/lib/useTimer';
import { TimerMode } from '../../src/lib/timerEngine';
import { LabelPickerSheet } from '../../src/features/focus/LabelPickerSheet';
import { FocusStats } from '../../src/features/focus/FocusStats';

function formatTimerDigits(ms: number, isStopwatch: boolean): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0 || (isStopwatch && hours > 0)) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function FocusScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ label?: string; topicId?: string }>();
  const [labelPickerVisible, setLabelPickerVisible] = useState(false);

  const {
    state,
    remainingMs,
    elapsedMs,
    start,
    pause,
    resume,
    stop,
    setMode,
    setLabel,
    advance,
  } = useTimer('pomodoro');

  // Handle incoming params (e.g. from Learn or Today)
  useEffect(() => {
    if (params.label) {
      setLabel(params.label, params.topicId ?? null);
    }
  }, [params.label, params.topicId, setLabel]);

  const isStopwatch = state.mode === 'stopwatch';
  const displayMs = isStopwatch ? elapsedMs : remainingMs;
  const digits = formatTimerDigits(displayMs, isStopwatch);

  // Progress computation
  let progress = 0;
  if (!isStopwatch && state.plannedMs && state.plannedMs > 0) {
    progress = Math.max(0, Math.min(1, elapsedMs / state.plannedMs));
  }

  const phaseLabel =
    state.mode === 'pomodoro'
      ? state.phase === 'focus'
        ? `FOCUS ${state.round}/4`
        : state.phase === 'short_break'
        ? 'SHORT BREAK'
        : 'LONG BREAK'
      : state.mode.toUpperCase();

  return (
    <Screen edges={['top', 'bottom']} padHorizontal>
      <View style={styles.topBar}>
        <Segmented<TimerMode>
          options={[
            { value: 'pomodoro', label: 'Pomodoro' },
            { value: 'countdown', label: 'Countdown' },
            { value: 'stopwatch', label: 'Stopwatch' },
          ]}
          value={state.mode}
          onChange={(newMode) => setMode(newMode)}
        />
      </View>

      <View style={styles.centerContainer}>
        <Text variant="micro" color={colors.textSecondary} style={styles.phaseLabel}>
          {phaseLabel}
        </Text>

        <Text variant="display" color={colors.text} tabular style={styles.timerDigits}>
          {digits}
        </Text>

        {!isStopwatch ? (
          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} height={2.5} color={colors.accent} />
          </View>
        ) : null}

        <View style={styles.chipRow}>
          <Chip
            label={state.label || 'Add Label'}
            icon={
              <AppIcon
                name={state.label ? 'pricetag' : 'pricetag-outline'}
                size={14}
                color={state.label ? colors.inkText : colors.accent}
              />
            }
            selected={!!state.label}
            onPress={() => setLabelPickerVisible(true)}
          />
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          {state.status === 'idle' ? (
            <Button
              title="Start"
              variant="primary"
              size="lg"
              icon={<AppIcon name="play" size={18} color={colors.inkText} />}
              onPress={start}
              style={styles.mainButton}
            />
          ) : state.status === 'running' ? (
            <View style={styles.runningButtons}>
              <Button
                title="Pause"
                variant="primary"
                size="lg"
                icon={<AppIcon name="pause" size={18} color={colors.inkText} />}
                onPress={pause}
                style={styles.halfButton}
              />
              <Button
                title="Stop"
                variant="secondary"
                size="lg"
                icon={<AppIcon name="square" size={16} color={colors.text} />}
                onPress={stop}
                style={styles.halfButton}
              />
            </View>
          ) : state.status === 'paused' ? (
            <View style={styles.runningButtons}>
              <Button
                title="Resume"
                variant="primary"
                size="lg"
                icon={<AppIcon name="play" size={18} color={colors.inkText} />}
                onPress={resume}
                style={styles.halfButton}
              />
              <Button
                title="Stop"
                variant="secondary"
                size="lg"
                icon={<AppIcon name="square" size={16} color={colors.text} />}
                onPress={stop}
                style={styles.halfButton}
              />
            </View>
          ) : (
            // Finished
            <Button
              title="Next Round"
              variant="primary"
              size="lg"
              icon={<AppIcon name="play-skip-forward" size={18} color={colors.inkText} />}
              onPress={advance}
              style={styles.mainButton}
            />
          )}
        </View>
      </View>

      <FocusStats />

      <LabelPickerSheet
        visible={labelPickerVisible}
        currentLabel={state.label}
        onSelect={(newLabel, topicId) => setLabel(newLabel, topicId)}
        onClose={() => setLabelPickerVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    marginBottom: 8,
    letterSpacing: 1,
  },
  timerDigits: {
    textAlign: 'center',
    marginVertical: 4,
  },
  progressContainer: {
    width: '60%',
    marginVertical: 16,
  },
  chipRow: {
    marginTop: 8,
    marginBottom: 28,
  },
  controlsRow: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  mainButton: {
    width: 200,
  },
  runningButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  halfButton: {
    width: 130,
  },
});
