import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Button } from './Button';
import { AppIcon, IconFamily } from './AppIcon';

export interface EmptyStateProps {
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  iconName?: string;
  iconFamily?: IconFamily;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  message,
  actionTitle,
  onAction,
  iconName,
  iconFamily,
  icon,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
          {icon}
        </View>
      ) : iconName ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
          <AppIcon
            name={iconName}
            family={iconFamily}
            size={24}
            color={colors.textSecondary}
          />
        </View>
      ) : null}
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
  },
  action: {
    marginTop: 16,
  },
});
