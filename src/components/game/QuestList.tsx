import { Quest } from '@/types/game';
import { QuestCard } from './QuestCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, RefreshCw } from 'lucide-react';
import { useGenerateQuests } from '@/hooks/usePlayerData';

interface QuestListProps {
  quests: Quest[];
  isLoading: boolean;
}

export function QuestList({ quests, isLoading }: QuestListProps) {
  const generateQuests = useGenerateQuests();

  const completedCount = quests.filter(q => q.is_completed).length;
  const mandatoryQuests = quests.filter(q => q.is_mandatory);
  const bonusQuests = quests.filter(q => !q.is_mandatory);
  const mandatoryCompleted = mandatoryQuests.filter(q => q.is_completed).length;

  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quests.length === 0) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-8 text-center space-y-4">
          <Swords className="w-12 h-12 mx-auto text-primary animate-pulse-glow" />
          <div>
            <h3 className="font-display text-lg text-foreground mb-2">
              No Quests Assigned
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The System is analyzing your stats...
            </p>
          </div>
          <Button 
            onClick={() => generateQuests.mutate()}
            disabled={generateQuests.isPending}
            className="glow-primary"
          >
            {generateQuests.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4 mr-2" />
                Begin Daily Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display text-primary text-glow-primary flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Daily Quests
            </CardTitle>
            <span className="text-sm font-mono text-muted-foreground">
              {mandatoryCompleted}/{mandatoryQuests.length} Mandatory
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mandatoryQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </CardContent>
      </Card>

      {bonusQuests.length > 0 && (
        <Card className="glass border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display text-accent text-glow-accent">
              Bonus Quests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bonusQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
