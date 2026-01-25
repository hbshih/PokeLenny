/**
 * GameState Manager
 * Handles all game progression, save/load, and player stats
 */

const SAVE_KEY = 'pokelenny_save_data';

export class GameState {
    constructor() {
        this.data = {
            playerName: 'Player',
            defeatedGuests: [], // Array of guest IDs
            overworld: {
                npcPositions: {}
            },
            battleStats: {
                totalBattles: 0,
                wins: 0,
                losses: 0,
                perfectBattles: 0, // No wrong answers
                totalQuestionsAnswered: 0,
                correctAnswers: 0
            },
            currentScore: 0,
            achievements: [],
            lastPlayed: Date.now(),
            version: '0.5'
        };
    }

    /**
     * Initialize game state - load from storage or create new
     */
    init() {
        this.load();
    }

    /**
     * Load game data from LocalStorage
     */
    load() {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                // Merge saved data with defaults (in case new fields were added)
                this.data = { ...this.data, ...parsed };
                console.log('Game loaded:', this.data);
                return true;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        return false;
    }

    /**
     * Save game data to LocalStorage
     */
    save() {
        try {
            this.data.lastPlayed = Date.now();
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    /**
     * Check if save data exists
     */
    hasSaveData() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    /**
     * Reset all progress
     */
    reset() {
        localStorage.removeItem(SAVE_KEY);
        this.data = {
            playerName: 'Player',
            defeatedGuests: [],
            overworld: {
                npcPositions: {}
            },
            battleStats: {
                totalBattles: 0,
                wins: 0,
                losses: 0,
                perfectBattles: 0,
                totalQuestionsAnswered: 0,
                correctAnswers: 0
            },
            currentScore: 0,
            achievements: [],
            lastPlayed: Date.now(),
            version: '0.5'
        };
        console.log('Game reset');
    }

    /**
     * Set player name
     */
    setPlayerName(name) {
        this.data.playerName = name || 'Player';
        this.save();
    }

    /**
     * Check if a guest has been defeated
     */
    isGuestDefeated(guestId) {
        return this.data.defeatedGuests.includes(guestId);
    }

    /**
     * Mark a guest as defeated
     */
    defeatGuest(guestId) {
        if (!this.isGuestDefeated(guestId)) {
            this.data.defeatedGuests.push(guestId);
            this.save();
        }
    }

    /**
     * Record battle result
     */
    recordBattle(result) {
        this.data.battleStats.totalBattles++;

        if (result.won) {
            this.data.battleStats.wins++;
            this.defeatGuest(result.guestId);

            // Check for perfect battle
            if (result.wrongAnswers === 0) {
                this.data.battleStats.perfectBattles++;
            }

            // Add XP (fallback to score for older callers)
            const xpGained = result.xpGained ?? result.score ?? 0;
            this.data.currentScore += xpGained;
        } else {
            this.data.battleStats.losses++;
        }

        // Update question stats
        this.data.battleStats.totalQuestionsAnswered += result.totalQuestions;
        this.data.battleStats.correctAnswers += result.correctAnswers;

        this.save();
    }

    /**
     * Get current stats
     */
    getStats() {
        return {
            ...this.data.battleStats,
            defeatedCount: this.data.defeatedGuests.length,
            accuracy: this.data.battleStats.totalQuestionsAnswered > 0
                ? (this.data.battleStats.correctAnswers / this.data.battleStats.totalQuestionsAnswered * 100).toFixed(1)
                : 0,
            score: this.data.currentScore
        };
    }

    /**
     * Get player name
     */
    getPlayerName() {
        return this.data.playerName;
    }

    /**
     * Get defeated guests list
     */
    getDefeatedGuests() {
        return [...this.data.defeatedGuests];
    }

    getNPCPositions(levelKey) {
        return this.data.overworld?.npcPositions?.[levelKey] || [];
    }

    setNPCPositions(levelKey, positions) {
        if (!this.data.overworld) {
            this.data.overworld = { npcPositions: {} };
        }
        if (!this.data.overworld.npcPositions) {
            this.data.overworld.npcPositions = {};
        }
        this.data.overworld.npcPositions[levelKey] = positions;
        this.save();
    }

    removeNPCPosition(levelKey, guestId) {
        if (!this.data.overworld?.npcPositions?.[levelKey]) return;
        this.data.overworld.npcPositions[levelKey] = this.data.overworld.npcPositions[levelKey]
            .filter(entry => entry.guestId !== guestId);
        this.save();
    }

    /**
     * Check and unlock achievements
     */
    checkAchievements() {
        const achievements = [];

        // First Victory
        if (this.data.battleStats.wins === 1 && !this.data.achievements.includes('first_victory')) {
            achievements.push('first_victory');
        }

        // Perfect Battle
        if (this.data.battleStats.perfectBattles > 0 && !this.data.achievements.includes('perfect_battle')) {
            achievements.push('perfect_battle');
        }

        // Defeat 10 guests
        if (this.data.defeatedGuests.length >= 10 && !this.data.achievements.includes('ten_defeats')) {
            achievements.push('ten_defeats');
        }

        // Add new achievements
        if (achievements.length > 0) {
            this.data.achievements.push(...achievements);
            this.save();
        }

        return achievements;
    }
}

// Create singleton instance
const gameState = new GameState();
export default gameState;
