import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { subDays, format, parseISO, differenceInDays, startOfDay } from 'date-fns';

export interface StreakHistory {
  id: string;
  user_id: string;
  date: string;
  quests_completed: number;
  quests_total: number;
  completion_percentage: number;
  streak_maintained: boolean;
  xp_multiplier: number;
  bonus_xp_earned: number;
  created_at: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  multiplier: number;
  penaltyPoints: number;
  penaltyReduction: number;
  streakFreezeAvailable: number;
  weeklyHistory: StreakHistory[];
  isAtRisk: boolean;
  todayCompleted: boolean;
}

// Calculate multiplier based on streak (1.0 to 2.0)
export function calculateMultiplier(streak: number): number {
  return Math.min(1.0 + (streak * 0.1), 2.0);
}

// Calculate penalty reduction (1.0 to 0.5)
export function calculatePenaltyReduction(penaltyPoints: number): number {
  return Math.max(1.0 - (penaltyPoints * 0.05), 0.5);
}

// Calculate effective XP with multiplier and penalty
export function calculateEffectiveXP(baseXP: number, streak: number, penaltyPoints: number): number {
  const multiplier = calculateMultiplier(streak);
  const penaltyReduction = calculatePenaltyReduction(penaltyPoints);
  return Math.round(baseXP * multiplier * penaltyReduction);
}

export function useStreakInfo() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['streak-info', user?.id],
    queryFn: async (): Promise<StreakInfo> => {
      if (!user) throw new Error('Not authenticated');

      // Get profile with streak data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, penalty_points, streak_freeze_available')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get last 7 days of streak history
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const { data: history, error: historyError } = await supabase
        .from('streak_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false });

      if (historyError) throw historyError;

      // Check if today is completed
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayEntry = (history as StreakHistory[] || []).find(h => h.date === today);
      const todayCompleted = todayEntry?.streak_maintained || false;

      // Check if streak is at risk (late in day and not completed)
      const currentHour = new Date().getHours();
      const isAtRisk = currentHour >= 20 && !todayCompleted;

      const multiplier = calculateMultiplier(profile?.current_streak || 0);
      const penaltyReduction = calculatePenaltyReduction(profile?.penalty_points || 0);

      return {
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        multiplier,
        penaltyPoints: profile?.penalty_points || 0,
        penaltyReduction,
        streakFreezeAvailable: profile?.streak_freeze_available || 0,
        weeklyHistory: (history as StreakHistory[]) || [],
        isAtRisk,
        todayCompleted,
      };
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute to update "at risk" status
  });
}

export function useUpdateStreakOnComplete() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questsCompleted, questsTotal }: { questsCompleted: number; questsTotal: number }) => {
      if (!user) throw new Error('Not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');
      const completionPercentage = questsTotal > 0 ? (questsCompleted / questsTotal) * 100 : 0;
      const streakMaintained = completionPercentage >= 80; // 80% completion maintains streak

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, penalty_points')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const currentStreak = profile?.current_streak || 0;
      const multiplier = calculateMultiplier(currentStreak);

      // Upsert today's streak history
      const { error: upsertError } = await supabase
        .from('streak_history')
        .upsert({
          user_id: user.id,
          date: today,
          quests_completed: questsCompleted,
          quests_total: questsTotal,
          completion_percentage: completionPercentage,
          streak_maintained: streakMaintained,
          xp_multiplier: multiplier,
        }, {
          onConflict: 'user_id,date',
        });

      if (upsertError) throw upsertError;

      // Update streak count if maintained
      if (streakMaintained) {
        const newStreak = currentStreak + 1;
        const newLongest = Math.max(profile?.longest_streak || 0, newStreak);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_quest_date: today,
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      return { streakMaintained, multiplier };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak-info'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useCheckAndApplyPenalty() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      // Check if yesterday had quests but wasn't completed
      const { data: yesterdayHistory } = await supabase
        .from('streak_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .single();

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If yesterday existed but streak wasn't maintained, apply penalty
      if (yesterdayHistory && !yesterdayHistory.streak_maintained) {
        // Check if penalty was already applied for this date
        if (profile?.last_penalty_date === yesterday) {
          return { penaltyApplied: false, reason: 'Penalty already applied' };
        }

        // Check if user has streak freeze
        if ((profile?.streak_freeze_available || 0) > 0) {
          // Use streak freeze instead of applying penalty
          await supabase
            .from('profiles')
            .update({
              streak_freeze_available: (profile?.streak_freeze_available || 1) - 1,
            })
            .eq('user_id', user.id);

          return { penaltyApplied: false, freezeUsed: true };
        }

        // Apply penalty: reset streak and add penalty points
        const newPenaltyPoints = Math.min((profile?.penalty_points || 0) + 1, 10);
        
        await supabase
          .from('profiles')
          .update({
            current_streak: 0,
            penalty_points: newPenaltyPoints,
            last_penalty_date: yesterday,
          })
          .eq('user_id', user.id);

        return { 
          penaltyApplied: true, 
          newPenaltyPoints,
          streakLost: profile?.current_streak || 0,
        };
      }

      return { penaltyApplied: false };
    },
    onSuccess: (data) => {
      if (data.penaltyApplied) {
        toast({
          title: "Streak Lost",
          description: `You failed to maintain your streak. Penalty points: ${data.newPenaltyPoints}. XP reduced by ${data.newPenaltyPoints * 5}%.`,
          variant: "destructive",
        });
      } else if (data.freezeUsed) {
        toast({
          title: "Streak Freeze Used",
          description: "Your streak was saved by a Streak Freeze!",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['streak-info'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useRedeemPenaltyPoints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('penalty_points, current_streak')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Reduce 1 penalty point for every 7-day streak
      if ((profile?.current_streak || 0) >= 7 && (profile?.penalty_points || 0) > 0) {
        const newPenaltyPoints = Math.max((profile?.penalty_points || 0) - 1, 0);
        
        await supabase
          .from('profiles')
          .update({ penalty_points: newPenaltyPoints })
          .eq('user_id', user.id);

        return { redeemed: true, newPenaltyPoints };
      }

      return { redeemed: false };
    },
    onSuccess: (data) => {
      if (data.redeemed) {
        toast({
          title: "Penalty Reduced",
          description: `7-day streak achieved! Penalty points reduced to ${data.newPenaltyPoints}.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['streak-info'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
