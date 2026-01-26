// LocalStorage-based leaderboard (client-side only)
// Each player sees their own historical scores

const LEADERBOARD_KEY = 'lennyrpg-leaderboard';

export const leaderboardService = {
  // Get all leaderboard entries
  getLeaderboard() {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Add/update player entry
  saveScore(playerData) {
    const leaderboard = this.getLeaderboard();

    const entry = {
      id: Date.now().toString(),
      name: playerData.name,
      level: playerData.level,
      maxHp: playerData.maxHp,
      captured: playerData.captured,
      total: playerData.total,
      accuracy: playerData.accuracy,
      timestamp: new Date().toISOString()
    };

    // Check if player already exists
    const existingIndex = leaderboard.findIndex(e => e.name === entry.name);

    if (existingIndex >= 0) {
      // Update if new score is better (higher level or more captured)
      const existing = leaderboard[existingIndex];
      if (entry.level > existing.level ||
          (entry.level === existing.level && entry.captured > existing.captured)) {
        leaderboard[existingIndex] = entry;
      }
    } else {
      leaderboard.push(entry);
    }

    // Sort by level (desc), then by captured (desc)
    leaderboard.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.captured - a.captured;
    });

    // Keep top 50
    const top50 = leaderboard.slice(0, 50);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top50));
    return top50;
  },

  // Get player's rank
  getPlayerRank(playerName) {
    const leaderboard = this.getLeaderboard();
    const index = leaderboard.findIndex(e => e.name === playerName);
    return index >= 0 ? index + 1 : null;
  },

  // Clear leaderboard (for testing)
  clear() {
    localStorage.removeItem(LEADERBOARD_KEY);
  }
};
