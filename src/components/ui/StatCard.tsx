import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  className?: string;
}

const VARIANT_STYLES = {
  blue: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/15 text-blue-400',
    glow: 'hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.25)]',
  },
  emerald: {
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    glow: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]',
  },
  amber: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    iconBg: 'bg-amber-500/15 text-amber-400',
    glow: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]',
  },
  purple: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    iconBg: 'bg-purple-500/15 text-purple-400',
    glow: 'hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.25)]',
  },
  rose: {
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    iconBg: 'bg-rose-500/15 text-rose-400',
    glow: 'hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)]',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'blue',
  className,
}) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300',
        styles.bg,
        styles.border,
        styles.glow,
        'group',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-white font-mono">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            styles.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/5 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-medium px-1.5 py-0.5 rounded',
                trend.isPositive !== false
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
