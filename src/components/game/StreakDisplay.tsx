import { cn } from '@/lib/utils';
import { StreakInfo, calculateMultiplier } from '@/hooks/useStreak';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Zap, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface StreakDisplayProps {
  streakInfo: StreakInfo;
  compact?: boolean;
}

export function StreakDisplay({ streakInfo, compact = false }: StreakDisplayProps) {
  const {
    currentStreak,
    multiplier,
    penaltyPoints,
    penaltyReduction,
    isAtRisk,
    todayCompleted,
    weeklyHistory,
  } = streakInfo;

  // Get last 7 days for mini calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = weeklyHistory.find(h => h.date === dateStr);
    return {
      date,
      dateStr,
      completed: entry?.streak_maintained || false,
      percentage: entry?.completion_percentage || 0,
      isToday: i === 6,
    };
  });

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {/* Streak Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          currentStreak > 0 
            ? "bg-warning/10 border border-warning/30" 
            : "bg-muted border border-border/50"
        )}>
          <Flame className={cn(
            "w-4 h-4",
            currentStreak > 0 ? "text-warning" : "text-muted-foreground",
            isAtRisk && "animate-pulse text-destructive"
          )} />
          <span className={cn(
            "text-sm font-mono font-bold",
            currentStreak > 0 ? "text-warning" : "text-muted-foreground"
          )}>
            {currentStreak}
          </span>
        </div>

        {/* Multiplier Badge */}
        {multiplier > 1 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/30">
            <Zap className="w-3 h-3 text-success" />
            <span className="text-xs font-mono text-success">{multiplier.toFixed(1)}x</span>
          </div>
        )}

        {/* Penalty Indicator */}
        {penaltyPoints > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-xs font-mono text-destructive">-{penaltyPoints * 5}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              currentStreak > 0 
                ? "bg-gradient-to-br from-warning to-orange-600 glow-primary" 
                : "bg-muted"
            )}>
              <Flame className={cn(
                "w-6 h-6",
                currentStreak > 0 ? "text-white" : "text-muted-foreground",
                isAtRisk && "animate-pulse"
              )} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground">
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col gap-1 items-end">
            {multiplier > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 border border-success/30">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs font-mono text-success font-bold">{multiplier.toFixed(1)}x XP</span>
              </div>
            )}
            {penaltyPoints > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                <span className="text-xs font-mono text-destructive">-{penaltyPoints * 5}% XP</span>
              </div>
            )}
          </div>
        </div>

        {/* Risk Warning */}
        {isAtRisk && !todayCompleted && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
            <span className="text-xs text-destructive font-medium">
              Streak at risk! Complete your quests before midnight.
            </span>
          </div>
        )}

        {/* Week Calendar */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">This Week</p>
          <div className="grid grid-cols-7 gap-1">
            {last7Days.map((day, i) => (
              <div 
                key={day.dateStr}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                  day.completed 
                    ? "bg-success/20 border border-success/30 text-success" 
                    : day.isToday 
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "bg-muted/30 border border-border/30 text-muted-foreground"
                )}
              >
                <span className="text-[10px] opacity-70">
                  {format(day.date, 'EEE')[0]}
                </span>
                <span className="font-bold">{format(day.date, 'd')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Multiplier Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Next Multiplier Level</span>
            <span className="font-mono text-primary">
              {currentStreak % 10 === 0 && currentStreak > 0 
                ? 'MAX 2.0x' 
                : `${calculateMultiplier(currentStreak + (10 - (currentStreak % 10))).toFixed(1)}x`
              }
            </span>
          </div>
          <Progress 
            value={multiplier >= 2 ? 100 : ((currentStreak % 10) / 10) * 100} 
            className="h-2"
          />
          <p className="text-[10px] text-muted-foreground text-center">
            {multiplier >= 2 
              ? 'Maximum multiplier reached!' 
              : `${10 - (currentStreak % 10)} more days to next level`
            }
          </p>
        </div>

        {/* Penalty Recovery Info */}
        {penaltyPoints > 0 && (
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">
                Complete a 7-day streak to remove 1 penalty point
              </span>
            </div>
            <Progress 
              value={(currentStreak / 7) * 100} 
              className="h-1 mt-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
