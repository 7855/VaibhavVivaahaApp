import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  size?: number;
  strokeWidth?: number;
  percentage: number;
  color?: string;
  bgColor?: string;
}

const ProgressRing = ({
  size = 40,
  strokeWidth = 4,
  percentage,
  color = '#420001',
  bgColor = '#e5e7eb',
}: Props) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset =
    circumference - (circumference * progress) / 100;

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle
        stroke={bgColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />

      {/* Progress circle */}
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

export default ProgressRing;
