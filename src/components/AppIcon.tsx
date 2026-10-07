import React from 'react';
import { StyleProp, TextStyle, ColorValue } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../theme';

export type IconFamily = 'ion' | 'mci' | 'feather';

export interface AppIconProps {
  family?: IconFamily;
  name: string;
  size?: number;
  color?: string | ColorValue;
  style?: StyleProp<TextStyle>;
}

// Icon mappings for easy, modern semantic usage across the app
export function AppIcon({
  family = 'ion',
  name,
  size = 20,
  color,
  style,
}: AppIconProps) {
  const { colors } = useTheme();
  const iconColor = (color as string) || colors.text;

  if (family === 'mci') {
    return (
      <MaterialCommunityIcons
        name={name as any}
        size={size}
        color={iconColor}
        style={style as any}
      />
    );
  }

  if (family === 'feather') {
    return (
      <Feather
        name={name as any}
        size={size}
        color={iconColor}
        style={style as any}
      />
    );
  }

  return (
    <Ionicons
      name={name as any}
      size={size}
      color={iconColor}
      style={style as any}
    />
  );
}
