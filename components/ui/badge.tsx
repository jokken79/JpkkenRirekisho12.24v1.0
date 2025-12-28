import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ring-offset-white dark:ring-offset-slate-900',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        outline: 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800',
        // Status-specific
        active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        inactive: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
        pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        terminated: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        suspended: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, size, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            pulse && 'animate-pulse',
            variant === 'success' || variant === 'active' ? 'bg-emerald-500' :
            variant === 'warning' || variant === 'pending' ? 'bg-amber-500' :
            variant === 'danger' || variant === 'terminated' ? 'bg-red-500' :
            variant === 'info' ? 'bg-cyan-500' :
            'bg-current'
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
