import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Screen, Text, Row, Segmented, Stepper, AppIcon } from '../src/components';
import { useTheme } from '../src/theme';
import { useSettingsStore } from '../src/lib/settingsStore';
import { createBackupPayload, wipeAllData } from '../src/lib/backup';
import { lightHaptic, notificationSuccess, notificationWarning } from '../src/lib/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const backup = await createBackupPayload();
      const jsonStr = JSON.stringify(backup, null, 2);

      if (Platform.OS === 'web') {
        Alert.alert('Export', 'JSON Backup generated. Copy from console.');
        console.log(jsonStr);
        return;
      }

      const filePath = `${FileSystem.documentDirectory}planner-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(filePath, jsonStr);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Planner Backup',
          UTI: 'public.json',
        });
        notificationSuccess();
      } else {
        Alert.alert('Export', `Backup saved to ${filePath}`);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWipeData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your blocks, workouts, focus sessions, and notes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This cannot be undone. Confirm deletion?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await wipeAllData();
                      notificationWarning();
                      Alert.alert('Deleted', 'All app data has been cleared.');
                    } catch (e: any) {
                      Alert.alert('Error', e.message);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.hairline }]}>
        <Pressable
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <Text variant="heading" style={{ marginLeft: 12 }}>
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="color-palette-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
              APPEARANCE
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Theme</Text>
              <Segmented
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
                value={settings.theme}
                onChange={(theme) => settings.updateSettings({ theme })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Clock Format</Text>
              <Segmented
                options={[
                  { value: '12h', label: '12-Hour' },
                  { value: '24h', label: '24-Hour' },
                ]}
                value={settings.clockFormat}
                onChange={(clockFormat) => settings.updateSettings({ clockFormat })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Week Starts On</Text>
              <Segmented
                options={[
                  { value: 'sun', label: 'Sunday' },
                  { value: 'mon', label: 'Monday' },
                ]}
                value={settings.weekStart}
                onChange={(weekStart) => settings.updateSettings({ weekStart })}
              />
            </View>
          </View>
        </View>

        {/* Focus */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="timer-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
              FOCUS & TIMER
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Focus Duration</Text>
              <Stepper
                value={settings.pomodoroFocusMin}
                step={5}
                min={5}
                max={120}
                format={(v) => `${v}m`}
                onChange={(v) => settings.updateSettings({ pomodoroFocusMin: v })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Short Break</Text>
              <Stepper
                value={settings.pomodoroShortBreakMin}
                step={1}
                min={1}
                max={30}
                format={(v) => `${v}m`}
                onChange={(v) => settings.updateSettings({ pomodoroShortBreakMin: v })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Long Break</Text>
              <Stepper
                value={settings.pomodoroLongBreakMin}
                step={5}
                min={5}
                max={60}
                format={(v) => `${v}m`}
                onChange={(v) => settings.updateSettings({ pomodoroLongBreakMin: v })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Keep Screen Awake</Text>
              <Switch
                value={settings.keepScreenAwake}
                onValueChange={(val) => {
                  lightHaptic();
                  settings.updateSettings({ keepScreenAwake: val });
                }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Haptic Feedback</Text>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(val) => {
                  lightHaptic();
                  settings.updateSettings({ hapticsEnabled: val });
                }}
              />
            </View>
          </View>
        </View>

        {/* Train */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="barbell-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
              WORKOUT & TRAINING
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Weight Unit</Text>
              <Segmented
                options={[
                  { value: 'lb', label: 'lbs (Pounds)' },
                  { value: 'kg', label: 'kg (Kilos)' },
                ]}
                value={settings.unit}
                onChange={(unit) => settings.updateSettings({ unit })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Default Rest Timer</Text>
              <Stepper
                value={settings.defaultRestSec}
                step={15}
                min={15}
                max={300}
                format={(v) => `${v}s`}
                onChange={(v) => settings.updateSettings({ defaultRestSec: v })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <Text variant="bodyStrong">Show RPE Column</Text>
              <Switch
                value={settings.showRpe}
                onValueChange={(val) => {
                  lightHaptic();
                  settings.updateSettings({ showRpe: val });
                }}
              />
            </View>
          </View>
        </View>

        {/* Data & Backup */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="cloud-upload-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
              DATA & BACKUP
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Row
              title="Export Backup (JSON)"
              subtitle={isExporting ? 'Exporting...' : 'Export all tasks, workouts, and notes'}
              onPress={handleExportBackup}
              rightAccessory={<AppIcon name="share-outline" color={colors.accent} size={18} />}
            />
            <View style={styles.divider} />
            <Row
              title="Delete All Data"
              subtitle="Clear SQLite database and reset"
              onPress={handleWipeData}
              rightAccessory={<AppIcon name="trash-outline" color={colors.danger} size={18} />}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppIcon name="information-circle-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
              ABOUT
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Row
              title="Minimalist Planner"
              subtitle="Version 1.0.0 · Local-first & offline"
              showDivider={false}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    marginBottom: 0,
    marginLeft: 0,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 48,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E6E6E2',
  },
});
