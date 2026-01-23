<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import bookOpen from '@iconify/icons-pixelarticons/book-open';
import trophy from '@iconify/icons-pixelarticons/trophy';
import upload from '@iconify/icons-pixelarticons/upload';
import volume from '@iconify/icons-pixelarticons/volume';
import volumeX from '@iconify/icons-pixelarticons/volume-x';
import keyboard from '@iconify/icons-pixelarticons/keyboard';
import message from '@iconify/icons-pixelarticons/message';
import PhaserGame from './PhaserGame.vue';
import BattleScreen from './components/BattleScreen.vue';
import CollectionScreen from './components/CollectionScreen.vue';
import EncounterDialog from './components/EncounterDialog.vue';
import ShareModal from './components/ShareModal.vue';
import LevelComplete from './components/LevelComplete.vue';
import GameOver from './components/GameOver.vue';
import TutorialModal from './components/TutorialModal.vue';
import LeaderboardPanel from './components/LeaderboardPanel.vue';
import { EventBus } from './game/EventBus';
import guestDataManager from './game/GuestData';
import { leaderboardService } from './services/supabase-leaderboard.js';

// Game state
const phaserRef = ref();
const showBattle = ref(false);
const showCollection = ref(false);
const showEncounter = ref(false);
const encounterNPC = ref(null);
const showGameOver = ref(false);
const showTutorial = ref(false);
const showLeaderboard = ref(false);

// Player data
const playerName = ref('Player');
const showShareModal = ref(false);

// Audio control
const isMuted = ref(false);

// Player stats
const playerStats = ref({
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  rightAnswers: 0,
  wrongAnswers: 0,
  totalBattles: 0
});

// XP needed for each level (exponential growth)
const getXPForLevel = (level) => {
  // Level 2 requires 100 XP, then grows exponentially
  return Math.floor(100 * Math.pow(1.5, level - 2));
};

// Current XP needed for next level
const xpForNextLevel = computed(() => getXPForLevel(playerStats.value.level + 1));

// Mock battle data
const battleData = ref({
  guest: {
    id: "1",
    name: "Shreyas Doshi",
    sprite: null,
    hp: 100,
    episode: "Product Management Excellence",
    difficulty: "Hard"
  },
  questions: [
    {
      id: 1,
      type: "mcq",
      prompt: "What is the most important framework for prioritizing product features?",
      choices: [
        "RICE scoring",
        "Impact vs Effort matrix",
        "Both are equally important",
        "Customer feedback only"
      ],
      correctAnswer: 1,
      explanation: "While both frameworks are useful, the Impact vs Effort matrix is more flexible and commonly used."
    },
    {
      id: 2,
      type: "tf",
      prompt: "Product-market fit can be measured primarily through NPS scores.",
      choices: ["True", "False"],
      correctAnswer: 1,
      explanation: "PMF is better measured through retention and growth metrics, not just NPS."
    },
    {
      id: 3,
      type: "mcq",
      prompt: "What percentage of features should be customer-driven vs vision-driven?",
      choices: [
        "90% customer, 10% vision",
        "50/50 split",
        "70% vision, 30% customer",
        "It depends on company stage"
      ],
      correctAnswer: 3,
      explanation: "The balance depends heavily on whether you're in discovery, growth, or maturity phase."
    }
  ]
});

// Collection data - will be populated from GuestDataManager
const collection = ref([]);

// Level system
const currentGameLevel = ref(1);
const enemiesPerLevel = 10;
const showLevelComplete = ref(false);
const currentLevelEnemiesDefeated = ref(0);
const totalQuestionsAnswered = ref(0);

// Computed stats
const capturedCount = computed(() => collection.value.filter(g => g.captured).length);
const totalGuests = computed(() => collection.value.length);
const accuracy = computed(() => {
  const total = playerStats.value.rightAnswers + playerStats.value.wrongAnswers;
  return total > 0 ? Math.round((playerStats.value.rightAnswers / total) * 100) : 0;
});
const remainingGuests = computed(() => totalGuests.value - capturedCount.value);

// Event handlers
function handleStartBattle() {
  showBattle.value = true;
}

function handleCloseBattle() {
  console.log('handleCloseBattle called in App.vue');
  showBattle.value = false;
  // Re-enable input in Overworld
  EventBus.emit('battle-ended');
}

function handleOpenCollection() {
  showCollection.value = true;
}

function handleCloseCollection() {
  showCollection.value = false;
}

function handleShowEncounter(npcData) {
  encounterNPC.value = npcData;
  showEncounter.value = true;
}

function handleAcceptBattle() {
  console.log('handleAcceptBattle called with encounterNPC:', encounterNPC.value);
  showEncounter.value = false;

  // Notify Overworld that battle is starting (disable NPC interaction checks)
  EventBus.emit('battle-starting');

  // Set battle data based on encounterNPC
  if (encounterNPC.value) {
    const guest = collection.value.find(g => g.id === encounterNPC.value.id);
    console.log('Found guest for battle:', guest);
    if (guest) {
      // Always 3 questions per battle
      const questionCount = 3;
      const questions = guestDataManager.getRandomQuestions(guest.id, questionCount);
      if (questions.length > 0 && questions.length < questionCount) {
        while (questions.length < questionCount) {
          const fallback = questions[Math.floor(Math.random() * questions.length)];
          questions.push(fallback);
        }
      }
      console.log(`Questions loaded for battle (${questionCount} questions):`, questions);

      if (questions && questions.length > 0) {
        // Create new battle data object (better reactivity)
        battleData.value = {
          guest: guest,
          questions: questions.map((q, index) => ({
            id: index + 1,
            type: "mcq",
            prompt: q.question,
            choices: q.options,
            correctAnswer: q.options.indexOf(q.answer),
            explanation: `The correct answer is: ${q.answer}`
          }))
        };
        console.log('Formatted battle questions:', battleData.value.questions);
        totalQuestionsAnswered.value += questions.length;
      } else {
        console.error('No questions found for guest:', guest.id, guest.name);
      }
    }
  }
  showBattle.value = true;
}

function handleRejectBattle() {
  showEncounter.value = false;
  encounterNPC.value = null;
  // Notify Phaser that battle was rejected
  EventBus.emit('battle-rejected');
}

function handleGuestCaptured(payload) {
  const guestId = typeof payload === 'object' ? payload.guestId : payload;
  const xpGained = typeof payload === 'object' ? payload.xpGained : 10;
  const guest = collection.value.find(g => g.id === guestId);
  if (guest) {
    guest.captured = true;
    // Award XP for capturing a guest (battle win)
    gainXP(xpGained);
    playerStats.value.totalBattles++;

    // Track level progress
    currentLevelEnemiesDefeated.value++;

    // Notify Overworld to remove this NPC
    EventBus.emit('remove-npc', guestId);

    // Save score to global leaderboard (async, non-blocking)
    saveScoreToLeaderboard();

    // Check if level is complete (defeated 10 enemies)
    if (currentLevelEnemiesDefeated.value >= enemiesPerLevel) {
      checkLevelCompletion();
    }
  }
}

async function saveScoreToLeaderboard() {
  try {
    await leaderboardService.saveScore({
      name: playerName.value,
      level: playerStats.value.level,
      maxHp: playerStats.value.maxHp,
      captured: capturedCount.value,
      total: totalGuests.value,
      accuracy: accuracy.value
    });
    console.log('✓ Score saved to leaderboard');
  } catch (error) {
    console.warn('Failed to save score to leaderboard:', error);
    // Don't block gameplay if leaderboard fails
  }
}

function checkLevelCompletion() {
  // Show level complete modal
  showLevelComplete.value = true;

  // Hide battle screen
  showBattle.value = false;
}

function handleLevelContinue() {
  showLevelComplete.value = false;

  // Increase player stats level
  playerStats.value.level++;
  playerStats.value.maxHp += 20;
  playerStats.value.hp = playerStats.value.maxHp; // Restore HP to full

  // Check if there are more guests to fight
  if (remainingGuests.value > 0) {
    // Move to next level
    currentGameLevel.value++;
    currentLevelEnemiesDefeated.value = 0;

    // Spawn next 10 enemies
    EventBus.emit('spawn-next-level', {
      level: currentGameLevel.value,
      enemiesCount: Math.min(enemiesPerLevel, remainingGuests.value)
    });
  } else {
    // Game complete!
    alert('Congratulations! You\'ve met all the guests from Lenny\'s Podcast!');
  }
}

function handleAnswerResult(isCorrect) {
  if (isCorrect) {
    playerStats.value.rightAnswers++;
  } else {
    playerStats.value.wrongAnswers++;
  }
}

function handleHPChanged(newHP) {
  playerStats.value.hp = newHP;
  console.log('HP updated:', newHP);

  // Check for game over
  if (newHP <= 0) {
    console.log('HP reached 0 - Game Over!');
    showBattle.value = false;
    showGameOver.value = true;
  }
}

function handleGameRestart() {
  // Reset all game state
  showGameOver.value = false;

  // Reset player stats
  playerStats.value = {
    level: 1,
    xp: 0,
    hp: 100,
    maxHp: 100,
    rightAnswers: 0,
    wrongAnswers: 0,
    totalBattles: 0
  };

  // Reset level progression
  currentGameLevel.value = 1;
  currentLevelEnemiesDefeated.value = 0;
  totalQuestionsAnswered.value = 0;

  // Reset collection (mark all as uncaptured)
  collection.value.forEach(guest => {
    guest.captured = false;
  });

  // Return to main menu
  EventBus.emit('return-to-menu');
}

function gainXP(amount) {
  playerStats.value.xp += amount;

  // Level up when XP meets/exceeds threshold
  while (playerStats.value.xp >= getXPForLevel(playerStats.value.level + 1)) {
    playerStats.value.level++;
    playerStats.value.maxHp += 20;
    playerStats.value.hp = playerStats.value.maxHp;
  }
}

function handleShareStats() {
  // Show share modal instead of immediately sharing
  showShareModal.value = true;
}

function setPlayerName(name) {
  playerName.value = name || 'Player';
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  // Save mute preference to localStorage
  localStorage.setItem('pokelenny-muted', isMuted.value.toString());
  // Emit mute state to Phaser
  try {
    EventBus.emit('toggle-mute', isMuted.value);
  } catch (error) {
    console.warn('Failed to toggle mute in game:', error);
  }
}

function handleCloseTutorial() {
  showTutorial.value = false;
  // Save that the user has seen the tutorial
  localStorage.setItem('pokelenny-tutorial-seen', 'true');
}

function handleOpenLeaderboard() {
  showLeaderboard.value = true;
}

function handleCloseLeaderboard() {
  showLeaderboard.value = false;
}

onMounted(() => {
  // Listen for guests-loaded event from Preloader
  EventBus.on('guests-loaded', (guests) => {
    console.log('✓ Guests loaded event received:', guests.length, 'guests');
    collection.value = guests;
    console.log('Collection IDs:', collection.value.map(g => g.id).join(', '));
  });

  // Fallback: Initialize collection from GuestDataManager (loaded by Preloader)
  // Try multiple times until guests are loaded
  let attempts = 0;
  const maxAttempts = 50; // Increased from 20
  const checkInterval = setInterval(() => {
    if (collection.value.length > 0) {
      // Already loaded via event
      clearInterval(checkInterval);
      return;
    }
    attempts++;
    const selectedGuests = guestDataManager.getSelectedGuests();
    console.log(`Collection init attempt ${attempts}: found ${selectedGuests.length} guests`);
    if (selectedGuests.length > 0) {
      collection.value = selectedGuests;
      console.log(`✓ Initialized collection with ${selectedGuests.length} guests:`, selectedGuests.map(g => `${g.id}:${g.name}`).slice(0, 5));
      clearInterval(checkInterval);
    } else if (attempts >= maxAttempts) {
      console.error('❌ Failed to load guests after', attempts, 'attempts');
      clearInterval(checkInterval);
    }
  }, 200); // Check every 200ms

  // Load mute preference from localStorage
  const savedMuteState = localStorage.getItem('pokelenny-muted');
  if (savedMuteState !== null) {
    isMuted.value = savedMuteState === 'true';
    // Apply mute state to Phaser
    setTimeout(() => {
      try {
        EventBus.emit('toggle-mute', isMuted.value);
      } catch (error) {
        console.warn('Failed to apply initial mute state:', error);
      }
    }, 1000); // Wait for game to initialize
  }

  // Show encounter dialog when approaching NPC
  EventBus.on('show-encounter-dialog', (data) => {
    console.log('App.vue received show-encounter-dialog event:', data);
    console.log('Collection length:', collection.value.length);
    if (data && data.id) {
      const guest = collection.value.find(g => g.id === data.id);
      console.log('Found guest for encounter:', guest);
      if (guest) {
        handleShowEncounter(guest);
        console.log('showEncounter set to:', showEncounter.value);
      } else {
        console.warn('Guest not found in collection. Guest ID:', data.id, 'Collection IDs:', collection.value.map(g => g.id).join(', '));
      }
    }
  });

  // Hide encounter dialog when walking away
  EventBus.on('hide-encounter-dialog', () => {
    showEncounter.value = false;
    encounterNPC.value = null;
  });

  // Start battle directly (skip encounter dialog)
  EventBus.on('start-battle', (data) => {
    console.log('start-battle event received:', data);
    if (data && data.guestId) {
      const guest = collection.value.find(g => g.id === data.guestId);
      console.log('Found guest for battle:', guest);
      if (guest) {
        // Always 3 questions per battle
        const questionCount = 3;
        const questions = guestDataManager.getRandomQuestions(data.guestId, questionCount);
        if (questions.length > 0 && questions.length < questionCount) {
          while (questions.length < questionCount) {
            const fallback = questions[Math.floor(Math.random() * questions.length)];
            questions.push(fallback);
          }
        }
        console.log(`Questions loaded for battle (${questionCount} questions):`, questions);
        if (questions && questions.length > 0) {
          // Create new battle data object (better reactivity)
          battleData.value = {
            guest: guest,
            questions: questions.map((q, index) => ({
              id: index + 1,
              type: "mcq",
              prompt: q.question,
              choices: q.options,
              correctAnswer: q.options.indexOf(q.answer),
              explanation: `The correct answer is: ${q.answer}`
            }))
          };
          console.log('Formatted battle questions:', battleData.value.questions);
          totalQuestionsAnswered.value += questions.length;
        }
        showBattle.value = true;
      }
    }
  });

  EventBus.on('open-collection', handleOpenCollection);
  EventBus.on('player-name-set', (name) => {
    setPlayerName(name);

    // Check if this is the first time playing
    const hasSeenTutorial = localStorage.getItem('pokelenny-tutorial-seen');
    if (!hasSeenTutorial) {
      // Show tutorial modal after a brief delay
      setTimeout(() => {
        showTutorial.value = true;
      }, 500);
    }
  });
});

onUnmounted(() => {
  EventBus.off('guests-loaded');
  EventBus.off('show-encounter-dialog');
  EventBus.off('hide-encounter-dialog');
  EventBus.off('start-battle');
  EventBus.off('open-collection', handleOpenCollection);
  EventBus.off('player-name-set');
});
</script>

<template>
  <div id="app">
    <div class="game-header">
      <h1 class="game-title">PokéLenny</h1>
      <p class="game-subtitle">Catch 'Em All!</p>
    </div>

    <div class="game-wrapper">
      <div class="stats-bar">
        <div class="stat-item level-stat">
          <span class="stat-label">Level {{ playerStats.level }}</span>
          <div class="xp-bar-container">
            <div class="xp-bar" :style="{ width: (playerStats.xp / xpForNextLevel * 100) + '%' }"></div>
          </div>
          <span class="stat-value-small">{{ playerStats.xp }}/{{ xpForNextLevel }} XP</span>
        </div>
        <div class="stat-item hp-stat">
          <span class="stat-label">HP</span>
          <div class="hp-bar-container">
            <div class="hp-bar" :style="{ width: (playerStats.hp / playerStats.maxHp * 100) + '%' }"></div>
          </div>
          <span class="stat-value">{{ playerStats.hp }}/{{ playerStats.maxHp }}</span>
        </div>
        <div class="stat-item collection-stat">
          <span class="stat-label">Captured</span>
          <span class="stat-value">{{ capturedCount }}/{{ totalGuests }}</span>
        </div>
      </div>

      <PhaserGame ref="phaserRef" />

      <div class="action-buttons">
        <button class="action-btn collection-btn" @click="handleOpenCollection">
          <Icon class="btn-icon" :icon="bookOpen" />
          Collection
        </button>
        <button class="action-btn leaderboard-btn" @click="handleOpenLeaderboard">
          <Icon class="btn-icon" :icon="trophy" />
          Leaderboard
        </button>
        <button class="action-btn share-btn" @click="handleShareStats">
          <Icon class="btn-icon" :icon="upload" />
          Share Stats
        </button>
        <button class="action-btn mute-btn" @click="toggleMute" :title="isMuted ? 'Unmute' : 'Mute'">
          <Icon class="btn-icon" :icon="isMuted ? volumeX : volume" />
          {{ isMuted ? 'Unmute' : 'Mute' }}
        </button>
      </div>
    </div>

    <div class="game-footer">
      <div class="footer-container">
        <div class="footer-column controls-column">
          <div class="controls-title">How to Play:</div>
          <div class="controls-list">
            <div class="control-item">
              <Icon class="control-icon" :icon="keyboard" />
              Arrow Keys or WASD to move
            </div>
            <div class="control-item">
              <Icon class="control-icon" :icon="message" />
              Walk near guests to battle
            </div>
            <div class="control-item">
              <Icon class="control-icon" :icon="bookOpen" />
              Press C to view collection
            </div>
          </div>
        </div>
        <div class="footer-column credits-column">
          <div class="credits-title">Information:</div>
          <div class="credits-content">
            <div class="credits-line">
              Created from <span class="credits-lenny">Lenny Podcast Episodes</span>
            </div>
            <div class="credits-line credits-row">
              <span>Built by <a href="https://benshih.design" target="_blank" rel="noopener noreferrer" class="credits-link">Ben Shih</a></span>
              <span class="credits-separator">•</span>
              <a href="https://github.com/benmiro/PokeLenny" target="_blank" rel="noopener noreferrer" class="credits-github" title="Contribute on GitHub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Contribute on Github
              </a>
            </div>
            <div class="credits-line credits-disclaimer">
              Unofficial fan project. AI-generated art. No affiliation.
            </div>
          </div>
        </div>
      </div>
    </div>

    <EncounterDialog
      :isActive="showEncounter"
      :npcData="encounterNPC || {}"
      @accept="handleAcceptBattle"
      @reject="handleRejectBattle"
    />

    <BattleScreen
      :isActive="showBattle"
      :battleData="battleData"
      :playerName="playerName"
      :playerStats="playerStats"
      @close="handleCloseBattle"
      @guest-captured="handleGuestCaptured"
      @answer-submitted="handleAnswerResult"
      @hp-changed="handleHPChanged"
    />

    <CollectionScreen
      :isActive="showCollection"
      :collection="collection"
      @close="handleCloseCollection"
    />

    <ShareModal
      :isActive="showShareModal"
      :playerName="playerName"
      :stats="playerStats"
      :collection="collection"
      :capturedCount="capturedCount"
      :totalGuests="totalGuests"
      :accuracy="accuracy"
      @close="showShareModal = false"
    />

    <LevelComplete
      :show="showLevelComplete"
      :currentLevel="currentGameLevel"
      :enemiesDefeated="currentLevelEnemiesDefeated"
      :questionsAnswered="totalQuestionsAnswered"
      :accuracy="accuracy"
      :totalGuests="totalGuests"
      :remainingGuests="remainingGuests"
      @continue="handleLevelContinue"
    />

    <GameOver
      :show="showGameOver"
      :guestsCaptured="capturedCount"
      :questionsAnswered="totalQuestionsAnswered"
      :accuracy="accuracy"
      @restart="handleGameRestart"
      @share="handleShareStats"
    />

    <TutorialModal
      :show="showTutorial"
      @close="handleCloseTutorial"
    />

    <LeaderboardPanel
      :isActive="showLeaderboard"
      :currentPlayer="{
        name: playerName,
        level: playerStats.level,
        maxHp: playerStats.maxHp,
        captured: capturedCount,
        total: totalGuests,
        accuracy: accuracy
      }"
      @close="handleCloseLeaderboard"
    />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

#app {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  gap: 20px;
  padding: 20px;
}

.game-header {
  text-align: center;
  color: #fff;
  font-family: 'Press Start 2P', monospace, sans-serif;
  text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.game-title {
  font-size: 36px;
  margin: 0 0 8px 0;
  color: #FFD700;
  text-shadow:
    3px 3px 0px rgba(0, 0, 0, 0.8),
    0 0 15px rgba(255, 215, 0, 0.5);
}

.game-subtitle {
  font-size: 14px;
  margin: 0;
  letter-spacing: 2px;
  color: #fff;
  font-family: 'Press Start 2P', monospace, sans-serif;
}

.game-wrapper {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-shrink: 0;
  justify-content: center;
}

.stats-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.85);
  border: 3px solid #FFD700;
  border-radius: 8px;
  padding: 16px;
  min-width: 180px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 9px;
  color: #FFD700;
  text-transform: uppercase;
}

.stat-value {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 14px;
  color: #fff;
}

.stat-value-small {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 9px;
  color: #fff;
}

.hp-bar-container,
.xp-bar-container {
  width: 100%;
  height: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.hp-bar {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
}

.xp-bar {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.6);
}

#game-container {
  flex-shrink: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 4px solid #FFD700;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 180px;
}

.action-btn {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 11px;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border: 3px solid #FFD700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  text-align: center;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.control-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  flex-shrink: 0;
  color: #FFD700;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  background: rgba(20, 20, 20, 0.9);
}

.action-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

.collection-btn {
  border-color: #60a5fa;
}

.collection-btn:hover {
  border-color: #3b82f6;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 20px rgba(96, 165, 250, 0.4);
}

.share-btn {
  border-color: #a78bfa;
}

.share-btn:hover {
  border-color: #8b5cf6;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 20px rgba(167, 139, 250, 0.4);
}

.mute-btn {
  border-color: #fbbf24;
}

.mute-btn:hover {
  border-color: #f59e0b;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 20px rgba(251, 191, 36, 0.4);
}

/* Game Footer - Boxed container */
.game-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  padding-bottom: 20px;
}

.footer-container {
  background: rgba(0, 0, 0, 0.85);
  border: 3px solid #FFD700;
  border-radius: 8px;
  padding: 16px 24px;
  width: 960px;
  max-width: 95vw;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.footer-column {
  display: flex;
  flex-direction: column;
}

.controls-column {
  border-right: 2px solid rgba(255, 215, 0, 0.3);
  padding-right: 32px;
}

.controls-title {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 10px;
  color: #FFD700;
  margin-bottom: 12px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 9px;
  color: #fff;
  line-height: 1.6;
  display: flex;
  align-items: center;
}

.credits-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.credits-title {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 10px;
  color: #FFD700;
  margin-bottom: 12px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

@media (max-width: 1600px) {
  .game-wrapper {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 1300px) {
  .game-wrapper {
    flex-direction: column;
    gap: 12px;
  }

  .stats-bar,
  .action-buttons {
    flex-direction: row;
    min-width: auto;
    width: 100%;
    max-width: 960px;
    justify-content: space-around;
  }

  .stat-item {
    flex: 1;
    min-width: 120px;
  }

  .action-buttons {
    max-width: 500px;
  }
}

@media (max-width: 1024px) {
  #app {
    gap: 15px;
    padding: 15px;
  }

  .game-title {
    font-size: 28px;
  }

  .game-subtitle {
    font-size: 12px;
  }

  .action-btn {
    font-size: 10px;
    padding: 12px 14px;
  }

  .footer-container {
    padding: 14px 20px;
    gap: 24px;
  }

  .controls-title,
  .credits-title {
    font-size: 9px;
  }

  .control-item {
    font-size: 8px;
  }

  .credits-line {
    font-size: 8px;
  }

  .credits-disclaimer {
    font-size: 6px;
  }
}

@media (max-width: 768px) {
  #app {
    gap: 10px;
    padding: 10px;
  }

  .game-title {
    font-size: 20px;
  }

  .game-subtitle {
    font-size: 10px;
  }

  .stat-label {
    font-size: 8px;
  }

  .stat-value {
    font-size: 12px;
  }

  .action-btn {
    font-size: 9px;
    padding: 10px 12px;
  }

  .footer-container {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 12px 16px;
  }

  .controls-column {
    border-right: none;
    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
    padding-right: 0;
    padding-bottom: 16px;
  }

  .controls-title,
  .credits-title {
    font-size: 8px;
  }

  .control-item {
    font-size: 7px;
  }

  .credits-line {
    font-size: 7px;
  }

  .credits-disclaimer {
    font-size: 6px;
  }
}

.credits-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credits-line {
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 9px;
  color: #fff;
  line-height: 1.6;
}

.credits-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.credits-separator {
  opacity: 0.5;
}

.credits-disclaimer {
  opacity: 0.7;
  font-size: 7px;
  color: #ccc;
  margin-top: 4px;
}

.credits-link {
  color: #FFD700;
  text-decoration: none;
  transition: color 0.2s ease;
}

.credits-link:hover {
  color: #fff;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
}

.credits-lenny {
  color: #a78bfa;
}

.credits-github {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #60a5fa;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.credits-github:hover {
  color: #FFD700;
  transform: translateY(-2px);
  background: rgba(255, 215, 0, 0.1);
}

.credits-github svg {
  display: block;
}

@media (max-width: 480px) {
  .credits-github svg {
    width: 12px;
    height: 12px;
  }
}
</style>
