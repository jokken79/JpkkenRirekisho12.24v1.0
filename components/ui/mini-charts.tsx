import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeProvider';

/**
 * Compact donut chart for status breakdowns
 */
interface DonutChartProps {
  segments: Array<{
    value: number;
    color: string;
    label: string;
  }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 120,
  thickness = 12,
  centerLabel,
  centerValue
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!segments || segments.length === 0) {
    return null;
  }

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Start from top

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? '#334155' : '#F1F5F9'}
          strokeWidth={thickness}
        />

        {/* Segment arcs */}
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          const segmentLength = (percentage / 100) * circumference;
          const offset = circumference - segmentLength;

          const result = (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-currentAngle * (circumference / 360)}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${segmentLength} ${circumference - segmentLength}` }}
              transition={{ duration: 1, delay: index * 0.1, ease: 'easeOut' }}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }}
            />
          );

          currentAngle += (percentage / 100) * 360;
          return result;
        })}
      </svg>

      {/* Center content */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-2xl font-black text-slate-900 dark:text-slate-100"
            >
              {centerValue}
            </motion.span>
          )}
          {centerLabel && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Horizontal bar for comparing two values
 */
interface ComparisonBarProps {
  label1: string;
  value1: number;
  label2: string;
  value2: number;
  color1?: string;
  color2?: string;
  height?: number;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label1,
  value1,
  label2,
  value2,
  color1 = '#3B82F6',
  color2,
  height = 32
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const actualColor2 = color2 || (isDark ? '#475569' : '#E2E8F0');

  const total = value1 + value2;
  const percentage1 = (value1 / total) * 100;
  const percentage2 = (value2 / total) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color1 }} />
          <span className="font-medium text-slate-600 dark:text-slate-400">{label1}</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{value1}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-100">{value2}</span>
          <span className="font-medium text-slate-600 dark:text-slate-400">{label2}</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: actualColor2 }} />
        </div>
      </div>

      <div className="flex w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700" style={{ height }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage1}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ backgroundColor: color1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage2}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
          style={{ backgroundColor: actualColor2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
        <span>{percentage1.toFixed(1)}%</span>
        <span>{percentage2.toFixed(1)}%</span>
      </div>
    </div>
  );
};

/**
 * Trend indicator with arrow
 */
interface TrendIndicatorProps {
  value: number;
  trend: 'up' | 'down' | 'neutral';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  trend,
  label,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const colors = {
    up: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    down: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const Arrow = () => {
    if (trend === 'up') {
      return (
        <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2L12 6H9V14H7V6H4L8 2Z" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 14L4 10H7V2H9V10H12L8 14Z" />
        </svg>
      );
    }
    return (
      <svg width={iconSizes[size]} height={iconSizes[size]} viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 8H14M14 8L10 4M14 8L10 12" stroke="currentColor" fill="none" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${sizeClasses[size]} ${colors[trend]}`}
    >
      <Arrow />
      <span>{Math.abs(value)}%</span>
      {label && <span className="opacity-70">{label}</span>}
    </motion.div>
  );
};

/**
 * Mini area chart for trends in table cells
 */
interface MiniAreaChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  positive?: boolean;
}

export const MiniAreaChart: React.FC<MiniAreaChartProps> = ({
  data,
  width = 60,
  height = 20,
  color,
  positive = true
}) => {
  if (!data || data.length === 0) return null;

  const strokeColor = color || (positive ? '#10B981' : '#EF4444');
  const fillColor = positive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className="inline-block">
      <motion.path
        d={areaPath}
        fill={fillColor}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
};
