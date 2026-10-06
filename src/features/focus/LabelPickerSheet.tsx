import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Sheet, Text, Button, Chip } from '../../components';
import { useTheme, BlockCategory } from '../../theme';

export interface LabelPickerSheetProps {
  visible: boolean;
  currentLabel: string | null;
  onSelect: (label: string, topicId?: string) => void;
  onClose: () => void;
}

const CATEGORIES: { label: string; cat: BlockCategory }[] = [
  { label: 'Deep Work', cat: 'work' },
  { label: 'Python 101', cat: 'study' },
  { label: 'DSA Practice', cat: 'study' },
  { label: 'System Design', cat: 'study' },
  { label: 'Workout', cat: 'health' },
  { label: 'Reading', cat: 'life' },
  { label: 'Quick Focus', cat: 'other' },
];

export function LabelPickerSheet({
  visible,
  currentLabel,
  onSelect,
  onClose,
}: LabelPickerSheetProps) {
  const { colors, category } = useTheme();
  const [customText, setCustomText] = useState('');

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onSelect(customText.trim());
      setCustomText('');
      onClose();
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text variant="heading" style={styles.title}>
          Focus Label
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="What are you focusing on?"
            placeholderTextColor={colors.textTertiary}
            value={customText}
            onChangeText={setCustomText}
            onSubmitEditing={handleCustomSubmit}
            returnKeyType="done"
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                borderColor: colors.hairline,
              },
            ]}
          />
          {customText.trim() ? (
            <Button
              title="Set"
              size="sm"
              onPress={handleCustomSubmit}
              style={{ marginLeft: 8 }}
            />
          ) : null}
        </View>

        <Text variant="caption" color={colors.textSecondary} style={styles.subtitle}>
          QUICK LABELS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {CATEGORIES.map((item) => {
            const catColors = category(item.cat);
            return (
              <Chip
                key={item.label}
                label={item.label}
                dotColor={catColors.solid}
                selected={currentLabel === item.label}
                onPress={() => {
                  onSelect(item.label);
                  onClose();
                }}
              />
            );
          })}
        </ScrollView>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  subtitle: {
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
});
