import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  message,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text
        variant="body"
        color={colors.textSecondary}
        style={styles.message}
      >
        {message}
      </Text>
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          variant="secondary"
          size="sm"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  message: {
    textAlign: 'center',
  },
  action: {
    marginTop: 16,
  },
});
