import { cn } from '@/lib/utils';
import { PlayerProfile, getXPProgress } from '@/types/game';
import { useStreakInfo } from '@/hooks/useStreak';
import { StreakDisplay } from './StreakDisplay';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface PlayerHeaderProps {
  profile: PlayerProfile;
}

export function PlayerHeader({ profile }: PlayerHeaderProps) {
  const { signOut } = useAuth();
  const { data: streakInfo } = useStreakInfo();
  const xpProgress = getXPProgress(profile.total_xp);

  return (
    <div className="space-y-4">
      {/* Main Header Card */}
      <div className="glass rounded-xl p-4 border-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <span className="text-2xl font-bold text-primary-foreground">
                {profile.player_level}
              </span>
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground">
                {profile.display_name || 'Hunter'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Level {profile.player_level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {streakInfo && (
              <StreakDisplay streakInfo={streakInfo} compact />
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>XP to Level {profile.player_level + 1}</span>
            <span className="font-mono">
              {xpProgress.current} / {xpProgress.needed}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 animate-xp-fill"
              style={{ width: `${xpProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Streak Display */}
      {streakInfo && (
        <StreakDisplay streakInfo={streakInfo} />
      )}
    </div>
  );
}
