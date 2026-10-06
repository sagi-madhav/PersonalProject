import React from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface RowProps {
  title: string;
  subtitle?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Row({
  title,
  subtitle,
  leftAccessory,
  rightAccessory,
  onPress,
  showDivider = true,
  style,
}: RowProps) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        showDivider && { borderBottomColor: colors.hairline, borderBottomWidth: 0.5 },
        style,
      ]}
    >
      {leftAccessory ? <View style={styles.left}>{leftAccessory}</View> : null}
      <View style={styles.center}>
        <Text variant="bodyStrong" color={colors.text} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAccessory ? <View style={styles.right}>{rightAccessory}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  left: {
    marginRight: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  right: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
});
