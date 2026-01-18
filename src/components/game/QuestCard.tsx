import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Quest, STAT_CONFIG } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Check, Swords, Star, Zap, TrendingUp } from 'lucide-react';
import { useCompleteQuest } from '@/hooks/usePlayerData';
import { useStreakInfo, calculateEffectiveXP } from '@/hooks/useStreak';

interface QuestCardProps {
  quest: Quest;
}

export function QuestCard({ quest }: QuestCardProps) {
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState('');
  const completeQuest = useCompleteQuest();
  const { data: streakInfo } = useStreakInfo();

  const config = STAT_CONFIG[quest.stat_type];

  // Calculate effective XP based on current streak/penalty
  const effectiveXP = streakInfo 
    ? calculateEffectiveXP(quest.xp_reward, streakInfo.currentStreak, streakInfo.penaltyPoints)
    : quest.xp_reward;
  const hasBonus = effectiveXP > quest.xp_reward;
  const hasPenalty = effectiveXP < quest.xp_reward;

  const handleComplete = () => {
    if (showReflection) {
      completeQuest.mutate({ questId: quest.id, reflection });
    } else {
      setShowReflection(true);
    }
  };

  const handleSkipReflection = () => {
    completeQuest.mutate({ questId: quest.id });
  };

  if (quest.is_completed) {
    return (
      <Card className="border-success/30 bg-success/5 opacity-75">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-muted-foreground line-through">
                {quest.title}
              </p>
              <p className="text-xs text-muted-foreground">
                +{quest.xp_reward} XP • Completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-border/50 hover:border-primary/30 transition-all duration-300",
      "hover:glow-primary",
      !quest.is_mandatory && "border-dashed border-accent/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ 
              backgroundColor: `hsl(var(--stat-${quest.stat_type}) / 0.2)`,
            }}
          >
            <span className="text-xl">{config.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {quest.is_mandatory ? (
                <Swords className="w-3 h-3 text-primary" />
              ) : (
                <Star className="w-3 h-3 text-accent" />
              )}
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {quest.is_mandatory ? 'Mandatory' : 'Bonus'}
              </span>
            </div>
            
            <h3 className="font-semibold text-foreground mb-1">
              {quest.title}
            </h3>
            
            {quest.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {quest.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 text-xs">
              <span className={cn("font-medium", config.colorClass)}>
                {config.label}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className={cn(
                "font-mono flex items-center gap-1",
                hasBonus ? "text-success" : hasPenalty ? "text-destructive" : "text-success"
              )}>
                {hasBonus && <TrendingUp className="w-3 h-3" />}
                +{effectiveXP} XP
                {hasBonus && (
                  <span className="text-[10px] text-success/70">
                    ({quest.xp_reward} + streak)
                  </span>
                )}
                {hasPenalty && (
                  <span className="text-[10px] text-destructive/70">
                    (penalty)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {showReflection ? (
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder="Brief reflection (optional)..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[60px] bg-muted/50"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleComplete}
                disabled={completeQuest.isPending}
                className="flex-1"
              >
                {completeQuest.isPending ? 'Logging...' : 'Complete'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSkipReflection}
                disabled={completeQuest.isPending}
              >
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleComplete}
            variant="outline"
            className="w-full mt-4 border-primary/30 hover:border-primary hover:bg-primary/10"
          >
            Mark Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
