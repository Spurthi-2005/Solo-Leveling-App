import { cn } from '@/lib/utils';
import { StatType, STAT_CONFIG, getStatLevel } from '@/types/game';
import { Progress } from '@/components/ui/progress';

interface StatBarProps {
  statType: StatType;
  level: number;
  xp: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatBar({ statType, level, xp, showLabel = true, size = 'md' }: StatBarProps) {
  const config = STAT_CONFIG[statType];
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const xpProgress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className={cn("font-medium", config.colorClass)}>
              {config.label}
            </span>
          </div>
          <span className="text-sm font-mono text-muted-foreground">
            Lv.{level}
          </span>
        </div>
      )}
      <div className="relative">
        <Progress 
          value={xpProgress} 
          className={cn(
            "bg-muted",
            sizeClasses[size]
          )}
          style={{
            '--progress-color': `hsl(var(--stat-${statType}))`,
          } as React.CSSProperties}
        />
        <div 
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            width: `${xpProgress}%`,
            background: `hsl(var(--stat-${statType}))`,
            boxShadow: `0 0 10px hsl(var(--stat-${statType}) / 0.5)`,
          }}
        />
      </div>
    </div>
  );
}
