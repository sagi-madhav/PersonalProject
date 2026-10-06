import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';

export interface SparklineProps {
  data: number[];
  type?: 'line' | 'bar';
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Sparkline({
  data,
  type = 'line',
  width = 120,
  height = 32,
  color,
  style,
}: SparklineProps) {
  const { colors } = useTheme();
  const strokeColor = color || colors.accent;

  if (!data || data.length === 0) {
    return <View style={[{ width, height }, style]} />;
  }

  const maxVal = Math.max(...data, 1);
  const minVal = type === 'bar' ? 0 : Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  if (type === 'bar') {
    const barWidth = Math.max(2, (width / data.length) - 3);
    return (
      <View style={[{ width, height }, style]}>
        <Svg width={width} height={height}>
          {data.map((val, idx) => {
            const barHeight = Math.max(2, (val / maxVal) * (height - 4));
            const x = idx * (width / data.length) + 1;
            const y = height - barHeight;
            return (
              <Rect
                key={idx}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={1}
                fill={val > 0 ? strokeColor : colors.hairline}
              />
            );
          })}
        </Svg>
      </View>
    );
  }

  // Line sparkline
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((val, idx) => {
    const x = idx * stepX;
    const y = height - 4 - ((val - minVal) / range) * (height - 8);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
