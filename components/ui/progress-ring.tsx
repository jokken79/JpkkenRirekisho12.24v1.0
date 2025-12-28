import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'red';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: { diameter: 48, fontSize: 'text-xs' },
  md: { diameter: 64, fontSize: 'text-sm' },
  lg: { diameter: 96, fontSize: 'text-base' },
  xl: { diameter: 128, fontSize: 'text-lg' },
};

const colorMap = {
  blue: {
    stroke: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.3)',
    bg: '#EFF6FF',
  },
  emerald: {
    stroke: '#10B981',
    glow: 'rgba(16, 185, 129, 0.3)',
    bg: '#ECFDF5',
  },
  amber: {
    stroke: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.3)',
    bg: '#FFFBEB',
  },
  red: {
    stroke: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.3)',
    bg: '#FEF2F2',
  },
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'md',
  strokeWidth = 8,
  color = 'blue',
  showLabel = true,
  label,
  className
}) => {
  const { diameter, fontSize } = sizeMap[size];
  const { stroke, glow, bg } = colorMap[color];

  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={diameter} height={diameter} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={bg}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle with animation */}
        <motion.circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${glow})`
          }}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={cn('font-bold text-slate-800', fontSize)}
          >
            {Math.round(progress)}%
          </motion.span>
          {label && (
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Mini sparkline for inline KPIs
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 24,
  color = '#3B82F6',
  fillOpacity = 0.1,
  className
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block', className)}
      preserveAspectRatio="none"
    >
      {/* Fill area */}
      <motion.path
        d={areaPath}
        fill={color}
        fillOpacity={fillOpacity}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
};

// Compact KPI card with sparkline
interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  change,
  trend = 'neutral',
  sparklineData,
  icon
}) => {
  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <h4 className="text-2xl font-black text-slate-900 tracking-tight">
            {value}
          </h4>
        </div>
        {icon && (
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {sparklineData && (
          <Sparkline
            data={sparklineData}
            width={80}
            height={20}
            color={trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#64748B'}
          />
        )}
        {change && (
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            trendColors[trend]
          )}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
