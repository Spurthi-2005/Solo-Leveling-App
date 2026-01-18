import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PlayerProfile, PlayerStats, Quest, StatType } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { calculateEffectiveXP } from './useStreak';
import { format } from 'date-fns';

export function usePlayerProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<PlayerProfile | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as PlayerProfile;
    },
    enabled: !!user,
  });
}

export function usePlayerStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stats', user?.id],
    queryFn: async (): Promise<PlayerStats | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as PlayerStats;
    },
    enabled: !!user,
  });
}

export function useDailyQuests(date?: string) {
  const { user } = useAuth();
  const questDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['quests', user?.id, questDate],
    queryFn: async (): Promise<Quest[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('quest_date', questDate)
        .order('is_mandatory', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Quest[];
    },
    enabled: !!user,
  });
}

export function useCompleteQuest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ questId, reflection }: { questId: string; reflection?: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Get the quest to know XP reward and stat type
      const { data: quest, error: questError } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (questError) throw questError;
      if (!quest) throw new Error('Quest not found');

      // Get current profile for streak and penalty info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Calculate effective XP with multiplier and penalty
      const currentStreak = profile?.current_streak || 0;
      const penaltyPoints = profile?.penalty_points || 0;
      const effectiveXP = calculateEffectiveXP(quest.xp_reward, currentStreak, penaltyPoints);

      // Mark quest as completed
      const { error: updateError } = await supabase
        .from('daily_quests')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          reflection,
        })
        .eq('id', questId);

      if (updateError) throw updateError;

      // Update player stats - add XP to the relevant stat
      const statXPColumn = `${quest.stat_type}_xp`;
      
      const { data: currentStats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) throw statsError;
      if (!currentStats) throw new Error('Stats not found');

      const currentXP = (currentStats as any)[statXPColumn] || 0;
      const newXP = currentXP + effectiveXP;

      // Calculate new stat level (1 level per 100 XP, max 100)
      const newStatLevel = Math.min(Math.floor(newXP / 100) + 1, 100);

      const { error: updateStatsError } = await supabase
        .from('player_stats')
        .update({
          [statXPColumn]: newXP,
          [quest.stat_type]: newStatLevel,
        })
        .eq('user_id', user.id);

      if (updateStatsError) throw updateStatsError;

      // Update profile total XP and player level
      const newTotalXP = (profile?.total_xp || 0) + effectiveXP;
      const newPlayerLevel = Math.floor(Math.sqrt(newTotalXP / 50)) + 1;

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          total_xp: newTotalXP,
          player_level: newPlayerLevel,
        })
        .eq('user_id', user.id);

      if (updateProfileError) throw updateProfileError;

      // Update streak history for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayQuests } = await supabase
        .from('daily_quests')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('quest_date', today);

      const completedCount = (todayQuests || []).filter(q => q.is_completed).length;
      const totalCount = (todayQuests || []).length;
      const completionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      const streakMaintained = completionPct >= 80;

      await supabase
        .from('streak_history')
        .upsert({
          user_id: user.id,
          date: today,
          quests_completed: completedCount,
          quests_total: totalCount,
          completion_percentage: completionPct,
          streak_maintained: streakMaintained,
          xp_multiplier: calculateEffectiveXP(100, currentStreak, 0) / 100,
          bonus_xp_earned: effectiveXP - quest.xp_reward,
        }, { onConflict: 'user_id,date' });

      // If streak was just maintained (80%+ completion), update streak
      if (streakMaintained && !profile?.last_quest_date?.includes(today)) {
        const newStreak = currentStreak + 1;
        await supabase
          .from('profiles')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(profile?.longest_streak || 0, newStreak),
            last_quest_date: today,
          })
          .eq('user_id', user.id);
      }

      return { 
        quest, 
        baseXP: quest.xp_reward,
        effectiveXP, 
        statType: quest.stat_type,
        multiplierApplied: effectiveXP > quest.xp_reward,
        penaltyApplied: penaltyPoints > 0,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['streak-info'] });
      
      let description = `+${data.effectiveXP} ${data.statType.toUpperCase()} XP`;
      if (data.multiplierApplied) {
        description += ` (${data.baseXP} base + streak bonus)`;
      } else if (data.penaltyApplied) {
        description += ` (reduced by penalty)`;
      }
      
      toast({
        title: "Quest Completed",
        description,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateQuests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];

      // Check if quests already exist for today
      const { data: existingQuests } = await supabase
        .from('daily_quests')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_date', today);

      if (existingQuests && existingQuests.length > 0) {
        return existingQuests;
      }

      // Get player stats to determine weakest stats
      const { data: stats, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) throw statsError;

      // Get available quest templates
      const { data: templates, error: templatesError } = await supabase
        .from('quest_templates')
        .select('*')
        .eq('is_active', true);

      if (templatesError) throw templatesError;
      if (!templates || templates.length === 0) {
        throw new Error('No quest templates available');
      }

      // Calculate stat priorities (lower stats get more quests)
      const statTypes: StatType[] = ['strength', 'agility', 'vitality', 'intelligence', 'discipline', 'charisma', 'wealth'];
      const statLevels = statTypes.map(stat => ({
        stat,
        level: (stats as any)[stat] || 10,
      }));
      statLevels.sort((a, b) => a.level - b.level);

      // Select 4 mandatory quests focusing on weaker stats
      const selectedQuests: typeof templates = [];
      const usedTemplateIds = new Set<string>();

      // Pick quests for the 4 weakest stats
      for (let i = 0; i < 4 && i < statLevels.length; i++) {
        const statType = statLevels[i].stat;
        const availableTemplates = templates.filter(
          t => t.stat_type === statType && !usedTemplateIds.has(t.id)
        );
        
        if (availableTemplates.length > 0) {
          const randomTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
          selectedQuests.push(randomTemplate);
          usedTemplateIds.add(randomTemplate.id);
        }
      }

      // Add 1 bonus quest from a random stat
      const bonusTemplates = templates.filter(t => !usedTemplateIds.has(t.id));
      if (bonusTemplates.length > 0) {
        const bonusTemplate = bonusTemplates[Math.floor(Math.random() * bonusTemplates.length)];
        selectedQuests.push(bonusTemplate);
      }

      // Insert quests
      const questsToInsert = selectedQuests.map((template, index) => ({
        user_id: user.id,
        template_id: template.id,
        title: template.title,
        description: template.description,
        stat_type: template.stat_type as StatType,
        xp_reward: template.xp_reward,
        is_mandatory: index < 4, // First 4 are mandatory
        quest_date: today,
      }));

      const { data: insertedQuests, error: insertError } = await supabase
        .from('daily_quests')
        .insert(questsToInsert)
        .select();

      if (insertError) throw insertError;

      return insertedQuests;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      toast({
        title: "Daily Assessment Complete",
        description: "Your quests have been assigned. Begin.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating quests",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
