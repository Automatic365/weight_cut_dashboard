import React from 'react';
import type { ChartDayEntry } from '../types';

interface CustomWeightDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDayEntry;
}

// Custom dot for the weight LineChart — color-codes each point by training tier and adherence status.
const CustomWeightDot: React.FC<CustomWeightDotProps> = ({ cx, cy, payload }) => {
  if (!cx || !cy) return null;

  let fill = "#5ca6ff"; // Default Blue (Linear/Tier 2)
  const stroke = "#fff";

  if (payload?.status === 'Fail') {
    fill = "#f0a93e"; // Accent for slips
  } else if (payload?.tier === 'Tier 1') {
    fill = "#e56b6f"; // Danger for Hard Muay Thai
  } else if (payload?.tier === 'Tier 3') {
    fill = "#41c48a"; // Success for Fasting
  }

  return (
    <circle cx={cx} cy={cy} r={5} fill={fill} stroke={stroke} strokeWidth={2} />
  );
};

export default CustomWeightDot;
