import { PlayerStats, StatType, STAT_CONFIG } from '@/types/game';
import { StatBar } from './StatBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsOverviewProps {
  stats: PlayerStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statTypes: StatType[] = [
    'strength',
    'agility', 
    'vitality',
    'intelligence',
    'discipline',
    'charisma',
    'wealth',
  ];

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display text-primary text-glow-primary">
          Combat Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statTypes.map((statType) => (
          <StatBar
            key={statType}
            statType={statType}
            level={stats[statType]}
            xp={stats[`${statType}_xp` as keyof PlayerStats] as number}
            size="sm"
          />
        ))}
      </CardContent>
    </Card>
  );
}
