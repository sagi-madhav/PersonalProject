import React from 'react';
import { View, StyleSheet, ViewProps, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

export interface ScreenProps extends ViewProps {
  children?: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  padHorizontal?: boolean;
}

export function Screen({
  children,
  edges = ['top'],
  padHorizontal = false,
  style,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();

  const edgePadding = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: (edges.includes('left') ? insets.left : 0) + (padHorizontal ? 20 : 0),
    paddingRight: (edges.includes('right') ? insets.right : 0) + (padHorizontal ? 20 : 0),
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, edgePadding, style]} {...rest}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
