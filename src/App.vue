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
import { getStageOpponents } from './game/StageConfig.js';

// Game state
const phaserRef = ref();
const currentSceneName = ref('');
const showBattle = ref(false);
const showCollection = ref(false);
const showEncounter = ref(false);
const encounterNPC = ref(null);
const showGameOver = ref(false);
const showTutorial = ref(false);
const showLeaderboard = ref(false);
const showMobileMenu = ref(false);

// Player data
const playerName = ref('Player');
const showShareModal = ref(false);

// Audio control
const isMuted = ref(false);
const isMobile = ref(false);
const isPortrait = ref(false);

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

// XP per correct answer (scales with level, capped)
const getXPPerCorrect = (level) => Math.min(10 + 5 * (level - 1), 50);

// XP required to reach next level (based on current level)
const getXPToNextLevel = (level) => 24 * getXPPerCorrect(level);

// Cumulative unlock XP for a given level
const getUnlockXP = (level) => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPToNextLevel(i);
  }
  return total;
};

// Current XP needed for next level
const xpForNextLevel = computed(() => getXPToNextLevel(playerStats.value.level));

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
const levelUpQueue = ref([]);
const levelUpInfo = ref(null);
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

function buildBattleQuestions(guestId) {
  const questionCount = 3;
  const questions = guestDataManager.getRandomQuestions(guestId, questionCount);
  if (questions.length > 0 && questions.length < questionCount) {
    while (questions.length < questionCount) {
      const fallback = questions[Math.floor(Math.random() * questions.length)];
      questions.push(fallback);
    }
  }

  if (!questions || questions.length === 0) {
    return [];
  }

  const bonusIndex = Math.random() < 0.05 ? Math.floor(Math.random() * questionCount) : -1;

  return questions.map((q, index) => ({
    id: index + 1,
    type: "mcq",
    prompt: q.question,
    choices: q.choices,
    correctAnswer: q.choices.indexOf(q.answer),
    explanation: q.explanation || '',
    difficulty: q.difficulty || '',
    isBonus: index === bonusIndex
  }));
}

function handleCloseBattle() {
  console.log('handleCloseBattle called in App.vue');
  showBattle.value = false;
  // Re-enable input in Overworld
  EventBus.emit('battle-ended');
}

function handleOpenCollection() {
  showCollection.value = true;
  showMobileMenu.value = false;
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
      const battleQuestions = buildBattleQuestions(guest.id);
      if (battleQuestions.length > 0) {
        battleData.value = {
          guest,
          questions: battleQuestions
        };
        console.log('Formatted battle questions:', battleData.value.questions);
        totalQuestionsAnswered.value += battleQuestions.length;
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

    // Notify Overworld to remove this NPC
    EventBus.emit('remove-npc', guestId);

    // Save score to global leaderboard (async, non-blocking)
    saveScoreToLeaderboard();

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

function showNextLevelUp() {
  if (levelUpQueue.value.length === 0) return;
  const next = levelUpQueue.value.shift();
  levelUpInfo.value = next;
  showLevelComplete.value = true;
  showBattle.value = false;
}

function handleLevelContinue() {
  showLevelComplete.value = false;

  if (levelUpInfo.value) {
    currentGameLevel.value = levelUpInfo.value.level;
    const unlockedCount = levelUpInfo.value.unlockedOpponents?.length || 0;
    EventBus.emit('spawn-next-level', {
      level: currentGameLevel.value,
      enemiesCount: unlockedCount || Math.min(enemiesPerLevel, remainingGuests.value)
    });
  }

  if (levelUpQueue.value.length > 0) {
    showNextLevelUp();
  } else {
    levelUpInfo.value = null;
  }
}

function handleAnswerResult(result) {
  const isCorrect = typeof result === 'object' ? result.correct : result;
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
  showBattle.value = false;
  showEncounter.value = false;
  encounterNPC.value = null;

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
  levelUpQueue.value = [];
  levelUpInfo.value = null;

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
  const pending = [];
  while (playerStats.value.xp >= getUnlockXP(playerStats.value.level + 1)) {
    const oldLevel = playerStats.value.level;
    const nextLevel = oldLevel + 1;
    playerStats.value.level = nextLevel;

    pending.push({
      level: nextLevel,
      oldXpPerCorrect: getXPPerCorrect(oldLevel),
      newXpPerCorrect: getXPPerCorrect(nextLevel),
      unlockedOpponents: getStageOpponents(nextLevel) || []
    });
  }

  if (pending.length > 0) {
    levelUpQueue.value.push(...pending);
    if (!showLevelComplete.value) {
      showNextLevelUp();
    }
  }
}

function handleShareStats() {
  // Show share modal instead of immediately sharing
  showShareModal.value = true;
  showMobileMenu.value = false;
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
  showMobileMenu.value = false;
}

function handleCloseLeaderboard() {
  showLeaderboard.value = false;
}

function toggleMobileMenu() {
  showMobileMenu.value = !showMobileMenu.value;
}

function updateViewportFlags() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  isMobile.value = w <= 1024 || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  isPortrait.value = h > w;
}

const handleDebugKeys = (event) => {
  const key = event.key;
  if (key === ']' || key === '}') {
    const nextLevel = playerStats.value.level + 1;
    const targetXp = getUnlockXP(nextLevel);
    if (playerStats.value.xp < targetXp) {
      gainXP(targetXp - playerStats.value.xp);
    }
  }
};

onMounted(() => {
  updateViewportFlags();
  window.addEventListener('resize', updateViewportFlags);

  window.addEventListener('keydown', handleDebugKeys);

  EventBus.on('current-scene-ready', (scene) => {
    currentSceneName.value = scene?.scene?.key || '';
  });
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
        const battleQuestions = buildBattleQuestions(data.guestId);
        if (battleQuestions.length > 0) {
          battleData.value = {
            guest,
            questions: battleQuestions
          };
          console.log('Formatted battle questions:', battleData.value.questions);
          totalQuestionsAnswered.value += battleQuestions.length;
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
  window.removeEventListener('resize', updateViewportFlags);
  window.removeEventListener('keydown', handleDebugKeys);
  EventBus.off('guests-loaded');
  EventBus.off('show-encounter-dialog');
  EventBus.off('hide-encounter-dialog');
  EventBus.off('start-battle');
  EventBus.off('open-collection', handleOpenCollection);
  EventBus.off('player-name-set');
});
</script>

<template>
  <div id="app" :class="{ 'mobile-view': isMobile, 'battle-active': showBattle }">
    <div v-if="isMobile && isPortrait" class="orientation-lock">
      <div class="orientation-card">
        <div class="orientation-title">Rotate your phone</div>
        <div class="orientation-subtitle">Play PokéLenny in landscape mode</div>
      </div>
    </div>
    <button
      class="mobile-menu-btn"
      v-if="isMobile && currentSceneName === 'Overworld' && !showBattle"
      @click="toggleMobileMenu"
      :aria-expanded="showMobileMenu"
      aria-label="Open menu"
    >
      ☰
    </button>
    <div v-if="showMobileMenu" class="mobile-menu-overlay" @click="toggleMobileMenu"></div>
    <div v-if="showMobileMenu" class="mobile-menu-panel">
      <div class="mobile-menu-header">
        <div class="mobile-menu-title">Menu</div>
        <button class="mobile-menu-close" @click="toggleMobileMenu" aria-label="Close menu">✕</button>
      </div>
      <div class="mobile-menu-section">
        <div class="action-buttons mobile-actions">
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
      <div class="mobile-menu-section footer-container mobile-footer" style="width: 100%;">
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
        <div class="footer-column credits-column mobile-credits">
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

    <div class="game-header">
      <h1 class="game-title">PokéLenny</h1>
      <p class="game-subtitle">Catch 'Em All!</p>
    </div>

    <div class="game-wrapper">
      <div class="stats-bar" v-if="currentSceneName === 'Overworld' || !isMobile">
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

      <div class="action-buttons" v-if="currentSceneName === 'Overworld' || !isMobile">
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

    <div class="game-footer" v-if="currentSceneName === 'Overworld' || !isMobile">
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
      :currentLevel="levelUpInfo?.level || playerStats.level"
      :oldXpPerCorrect="levelUpInfo?.oldXpPerCorrect || getXPPerCorrect(playerStats.level)"
      :newXpPerCorrect="levelUpInfo?.newXpPerCorrect || getXPPerCorrect(playerStats.level + 1)"
      :unlockedOpponents="levelUpInfo?.unlockedOpponents || []"
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

.mobile-menu-btn {
  display: none;
  position: fixed;
  top: calc(12px + env(safe-area-inset-top));
  right: calc(12px + env(safe-area-inset-right));
  z-index: 5000;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 3px solid #FFD700;
  background: rgba(0, 0, 0, 0.85);
  color: #FFD700;
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 16px;
  cursor: pointer;
  touch-action: manipulation;
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 4000;
}

.mobile-menu-panel {
  position: fixed;
  top: calc(80px + env(safe-area-inset-top));
  right: calc(12px + env(safe-area-inset-right));
  left: auto;
  z-index: 5001;
  background: rgba(0, 0, 0, 0.92);
  border: 3px solid #FFD700;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  overflow-x: hidden;
  width: min(92vw, 420px);
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.mobile-menu-title {
  color: #FFD700;
  font-size: 12px;
  font-family: 'Press Start 2P', monospace, sans-serif;
}

.mobile-menu-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid #FFD700;
  background: rgba(0, 0, 0, 0.7);
  color: #FFD700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.mobile-menu-close:hover {
  background: rgba(0, 0, 0, 0.9);
}

.mobile-menu-section + .mobile-menu-section {
  margin-top: 12px;
}

.mobile-footer {
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.mobile-actions {
  flex-direction: column;
  min-width: auto;
  align-items: stretch;
  flex-wrap: nowrap;
  gap: 10px;
}

.mobile-footer {
  width: 100%;
  max-width: none;
  border: none;
  padding: 12px;
  grid-template-columns: 1fr;
}

.mobile-footer .controls-column {
  border: none;
  padding-right: 0;
}

.mobile-footer .controls-list {
  width: 100%;
}

.mobile-footer .control-item {
  width: 100%;
}

.mobile-credits {
  align-items: flex-start;
}

.mobile-credits .credits-row {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  max-width: 100%;
}

.mobile-credits .credits-separator {
  display: none;
}

.mobile-footer .credits-content,
.mobile-footer .credits-line {
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}

.mobile-actions .action-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 14px;
  min-height: 44px;
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
  touch-action: manipulation;
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

  .game-wrapper .stats-bar,
  .game-wrapper .action-buttons {
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

  .game-wrapper .action-buttons {
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

/* Mobile fullscreen layout */
@media (max-width: 1024px) {
  .mobile-view {
    padding: 0;
    gap: 0;
  }

  .mobile-view .game-header,
  .mobile-view .game-footer {
    display: none;
  }

  .mobile-view .game-wrapper {
    position: fixed;
    inset: 0;
    padding: 0;
    margin: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-view #game-container {
    width: 100%;
    height: 100%;
    border: none;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-view #game-container canvas {
    height: 100% !important;
    width: auto !important;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .orientation-lock {
    position: fixed;
    inset: 0;
    z-index: 6000;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
  }

  .orientation-card {
    border: 3px solid #FFD700;
    border-radius: 12px;
    padding: 24px;
    background: rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  }

  .orientation-title {
    font-family: 'Press Start 2P', monospace, sans-serif;
    font-size: 14px;
    color: #FFD700;
    margin-bottom: 10px;
  }

  .orientation-subtitle {
    font-family: 'Press Start 2P', monospace, sans-serif;
    font-size: 10px;
    color: #fff;
    opacity: 0.9;
  }

  .mobile-view .stats-bar {
    position: fixed;
    top: calc(8px + env(safe-area-inset-top));
    left: calc(8px + env(safe-area-inset-left));
    z-index: 2000;
    padding: 6px 8px;
    gap: 4px;
    min-width: 100px;
    max-width: 140px;
    background: rgba(0, 0, 0, 0.85);
    border-width: 2px;
    align-items: flex-start;
    width: auto;
    overflow: hidden;
    flex-direction: column;
  }

  .mobile-view .stats-bar .stat-item {
    gap: 3px;
    width: 100%;
  }

  .mobile-view .stats-bar .stat-label {
    font-size: 6px;
  }

  .mobile-view .stats-bar .stat-value,
  .mobile-view .stats-bar .stat-value-small {
    font-size: 8px;
  }

  .mobile-view .stats-bar .xp-bar-container,
  .mobile-view .stats-bar .stat-value-small,
  .mobile-view .stats-bar .collection-stat {
    display: block;
  }

  .mobile-view .stats-bar .hp-bar-container {
    height: 8px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .mobile-view .stats-bar .stat-value {
    line-height: 1.2;
  }

  .mobile-view .stats-bar .hp-stat .stat-value {
    font-size: 7px;
  }

  .mobile-view .stats-bar .xp-bar-container {
    height: 8px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .mobile-view .stats-bar .stat-value-small {
    font-size: 7px;
  }

  .mobile-view .stats-bar .level-stat .stat-value-small {
    margin-top: 2px;
  }

  .mobile-view .action-buttons {
    display: none;
  }

  .mobile-view.battle-active .mobile-menu-btn {
    display: none;
  }

  .mobile-view .game-wrapper .action-buttons {
    display: none;
  }
}

/* Keep canvas filling the viewport on mobile */
@media (max-width: 1024px) {
  html,
  body,
  #app {
    height: 100%;
  }
}

@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
