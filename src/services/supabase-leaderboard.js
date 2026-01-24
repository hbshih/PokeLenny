// Supabase leaderboard - global, real-time, free
// Uses Row Level Security (RLS) for safe public access

import { supabase, isSupabaseEnabled } from '../lib/supabase.js';

function ensureSupabase() {
  if (!isSupabaseEnabled || !supabase) {
    return false;
  }
  return true;
}

export const leaderboardService = {
  // Get top 50 players
  async getLeaderboard() {
    if (!ensureSupabase()) return [];
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('level', { ascending: false })
      .order('captured', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  },

  // Save player score
  async saveScore(playerData) {
    if (!ensureSupabase()) return null;
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{
        player_name: playerData.name,
        level: playerData.level,
        max_hp: playerData.maxHp,
        captured: playerData.captured,
        total: playerData.total,
        accuracy: playerData.accuracy
      }]);

    if (error) throw error;
    return data;
  },

  // Get player rank
  async getPlayerRank(playerName) {
    if (!ensureSupabase()) return null;
    const { data, error } = await supabase
      .from('leaderboard')
      .select('player_name, level, captured')
      .order('level', { ascending: false })
      .order('captured', { ascending: false });

    if (error) throw error;

    const index = data.findIndex(p => p.player_name === playerName);
    return index >= 0 ? index + 1 : null;
  },

  // Subscribe to real-time updates (optional)
  subscribeToLeaderboard(callback) {
    if (!ensureSupabase()) return { unsubscribe: () => {} };
    return supabase
      .channel('leaderboard_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        callback
      )
      .subscribe();
  }
};
