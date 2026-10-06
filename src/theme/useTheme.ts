import { useColorScheme as useRNColorScheme } from 'react-native';
import { colors, categoryColors, BlockCategory, ThemeColors } from './tokens';
import { useSettingsStore } from '../lib/settingsStore';

export function useTheme(): {
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  category: (cat: BlockCategory) => { solid: string; tint: string };
} {
  const systemScheme = useRNColorScheme() ?? 'light';
  const themePref = useSettingsStore((s) => s.theme);

  const activeScheme: 'light' | 'dark' =
    themePref === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePref;

  const currentColors = colors[activeScheme];

  const category = (cat: BlockCategory) => {
    const c = categoryColors[cat] ?? categoryColors.other;
    return {
      solid: c.solid,
      tint: activeScheme === 'dark' ? c.tintDark : c.tintLight,
    };
  };

  return {
    colorScheme: activeScheme,
    colors: currentColors,
    category,
  };
}
