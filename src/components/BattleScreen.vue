<template>
  <div class="battle-screen" v-if="isActive">
    <!-- Battle Transition Overlay -->
    <canvas v-if="showTransition" ref="swirlCanvas" class="swirl-canvas"></canvas>
    <!-- Battle background image -->
    <div class="battle-background"></div>

    <!-- Exit button -->
    <button class="exit-battle-btn" @click="closeBattle" title="Run away">
      <span class="exit-icon">✕</span>
    </button>

    <!-- Battle Arena Layout -->
    <div class="battle-arena">
      <!-- Opponent (Top Left Area) -->
      <div class="opponent-area">
        <!-- Opponent HP Bar (floats above) -->
        <div class="hp-display opponent-hp">
          <div class="hp-header">
            <div class="guest-info">
              <span class="name-text">{{ battleData.guest.name }}</span>
              <span class="guest-title">{{ guestTitle }}</span>
            </div>
            <span class="level-badge">Lv{{ opponentLevel }}</span>
          </div>
          <div class="hp-bar-container">
            <div class="hp-label-small">HP</div>
            <div class="hp-bar-track">
              <div class="hp-bar-fill" :class="guestHPClass" :style="{ width: guestHPPercent + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Opponent Sprite -->
        <div class="opponent-sprite">
          <img
            v-if="guestAvatarPath"
            :src="guestAvatarPath"
            :alt="battleData.guest.name"
            class="sprite-image opponent-avatar"
          />
          <div v-else class="sprite-placeholder">
            <Icon class="sprite-icon" :icon="user" />
          </div>
        </div>
      </div>

      <!-- Player (Bottom Right Area) -->
      <div class="player-area">
        <!-- Player Sprite -->
        <div class="player-sprite">
          <img
            src="/assets/main-back.png"
            alt="Player"
            class="sprite-image player-back"
          />
        </div>

        <!-- Player HP Bar (floats above) -->
        <div class="hp-display player-hp">
          <div class="hp-header">
            <span class="name-text">{{ playerName || 'You' }}</span>
            <span class="level-badge">Lv{{ playerLevel }}</span>
          </div>
          <div class="hp-bar-container">
            <div class="hp-label-small">HP</div>
            <div class="hp-bar-track">
              <div class="hp-bar-fill" :class="playerHPClass" :style="{ width: playerHPPercent + '%' }"></div>
            </div>
          </div>
          <div class="hp-numeric">{{ playerHP }} / {{ playerMaxHP }}</div>
        </div>
      </div>
    </div>

    <!-- Battle UI (Questions at Bottom) - Compact Horizontal Layout -->
    <div class="battle-ui-panel">
      <div class="pokemon-battle-box">
        <div v-if="!answered" class="battle-layout-horizontal">
          <!-- Left: Question (40%) -->
          <div class="question-section">
            <div class="q-header">
              <span class="q-num">Q{{ currentQuestionIndex + 1 }}/{{ battleData.questions?.length || 1 }}</span>
              <span class="diff-badge">{{ battleData.guest.difficulty || 'Med' }}</span>
            </div>
            <div class="q-text">{{ currentQuestion.prompt }}</div>
            <div class="controls">
              <span class="key">↑↓</span> <span class="key">ENTER</span>
            </div>
          </div>

          <!-- Right: Answers (60%) -->
          <div class="answers-section">
            <div
              v-for="(choice, index) in currentQuestion.choices"
              :key="index"
              class="answer-item"
              :class="{ 'active': selectedAnswerIndex === index }"
            >
              <span class="ans-num">{{ index + 1 }}</span>
              <span class="ans-text">{{ choice }}</span>
            </div>
          </div>
        </div>

        <!-- Feedback Display -->
        <div v-if="answered" class="feedback-display">
          <div class="result-bar" :class="{ 'correct': isCorrect, 'wrong': !isCorrect }">
            <span class="icon">{{ isCorrect ? '✓' : '✗' }}</span>
            <span class="label">{{ isCorrect ? 'CORRECT!' : 'WRONG!' }}</span>
          </div>
          <p class="explain-text">{{ currentQuestion.explanation }}</p>
          <div class="continue-bar">
            <span class="key">ENTER</span> {{ currentQuestionIndex < (battleStats.totalQuestions - 1) ? 'Next' : 'Finish' }} ▼
          </div>
        </div>
      </div>
    </div>

    <!-- Battle Result Component -->
    <BattleResult
      :isActive="battleEnded"
      :won="battleWon"
      :guestName="battleData?.guest?.name || 'Guest'"
      :stats="battleStats"
      @retry="handleRetry"
      @continue="handleContinue"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import user from '@iconify/icons-pixelarticons/user';
import BattleResult from './BattleResult.vue';
import gameState from '../game/GameState.js';
import { EventBus } from '../game/EventBus';
import { getGuestTitle } from '../game/GuestTitles.js';

const props = defineProps({
  isActive: Boolean,
  battleData: Object,
  playerName: String,
  playerStats: Object
});

const emit = defineEmits(['close', 'guest-captured', 'answer-submitted', 'hp-changed']);

const swirlCanvas = ref(null);
const guestHP = ref(100);
const playerHP = ref(props.playerStats?.hp || 100);
const playerMaxHP = computed(() => props.playerStats?.maxHp || 100);
const playerLevel = computed(() => props.playerStats?.level || 1);
const currentQuestionIndex = ref(0);
const selectedAnswer = ref(null);
const selectedAnswerIndex = ref(0);
const answered = ref(false);
const isCorrect = ref(false);
const battleEnded = ref(false);
const battleWon = ref(false);
const showTransition = ref(false);

// Battle stats tracking
const battleStats = ref({
  totalQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  xpGained: 0,
  perfectBattle: false
});

// Keyboard handler for navigation and confirmation
function handleKeyPress(event) {
  // Only handle keys during battle
  if (!props.isActive || battleEnded.value) return;

  const key = event.key;
  const numChoices = currentQuestion.value.choices?.length || 0;

  // Check if this is a key we want to handle
  const battleKeys = ['ArrowUp', 'ArrowDown', 'Enter', '1', '2', '3', '4'];
  if (!battleKeys.includes(key)) return;

  // Prevent event from reaching the game
  event.preventDefault();
  event.stopPropagation();

  // If showing feedback, Enter to continue
  if (answered.value) {
    if (key === 'Enter') {
      nextQuestion();
    }
    return;
  }

  // Arrow key navigation
  if (key === 'ArrowUp') {
    selectedAnswerIndex.value = Math.max(0, selectedAnswerIndex.value - 1);
  } else if (key === 'ArrowDown') {
    selectedAnswerIndex.value = Math.min(numChoices - 1, selectedAnswerIndex.value + 1);
  }
  // Number keys for direct selection
  else if (key >= '1' && key <= '4') {
    const index = parseInt(key) - 1;
    if (index < numChoices) {
      selectedAnswerIndex.value = index;
    }
  }
  // Enter to confirm
  else if (key === 'Enter') {
    selectAnswer(selectedAnswerIndex.value);
  }
}

// Add keyboard listener
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});

// Pixel swirl animation with sweeping spiral
function drawPixelSwirl() {
  if (!swirlCanvas.value) return;

  const canvas = swirlCanvas.value;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const gridSize = 16; // 16x16 grid
  const blockWidth = width / gridSize;
  const blockHeight = height / gridSize;
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;

  let progress = 0;
  const duration = 1200; // 1.2 seconds
  const startTime = Date.now();
  const spiralTurns = 3; // Number of spiral rotations

  function animate() {
    const elapsed = Date.now() - startTime;
    progress = Math.min(elapsed / duration, 1);

    // Start with white covering everything
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // Clear blocks in clockwise spiral pattern to reveal battle background
    for (let gridY = 0; gridY < gridSize; gridY++) {
      for (let gridX = 0; gridX < gridSize; gridX++) {
        // Calculate angle and distance from center
        const dx = gridX - centerX + 0.5;
        const dy = gridY - centerY + 0.5;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle starting from top (12 o'clock) going clockwise
        // atan2 gives angle from right, so we adjust: subtract 90° and reverse direction
        let angle = Math.atan2(dy, dx);
        // Convert to start at top and go clockwise
        angle = -angle + Math.PI / 2;
        // Normalize to 0-1 range
        const normalizedAngle = ((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);

        // Calculate spiral value (combines angle and distance)
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const normalizedDistance = distance / maxDistance;

        // Spiral formula: sweeps clockwise while moving outward
        const spiralValue = normalizedAngle + normalizedDistance * spiralTurns;
        const normalizedSpiral = (spiralValue / spiralTurns);

        // Clear block (reveal background) when progress passes its spiral position
        if (normalizedSpiral < progress) {
          ctx.clearRect(
            gridX * blockWidth,
            gridY * blockHeight,
            blockWidth,
            blockHeight
          );
        }
      }
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  animate();
}

// Reset battle when it becomes active with transition
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    showTransition.value = true;
    // Start battle music
    EventBus.emit('play-battle-music');

    // Start pixel swirl animation
    setTimeout(() => {
      if (swirlCanvas.value) {
        // Match canvas size to container
        const rect = swirlCanvas.value.getBoundingClientRect();
        swirlCanvas.value.width = rect.width;
        swirlCanvas.value.height = rect.height;
        drawPixelSwirl();
      }
    }, 50);

    setTimeout(() => {
      showTransition.value = false;
      resetBattle();
    }, 1200); // 1.2 second transition (matches animation duration)
  } else {
    // Stop battle music when battle screen closes
    EventBus.emit('stop-battle-music');
  }
});

// Watch for battleData changes to reset battle when new questions come in
watch(() => props.battleData?.questions, (newQuestions, oldQuestions) => {
  console.log('Battle questions changed:', newQuestions?.length, 'questions');
  if (newQuestions && newQuestions !== oldQuestions && props.isActive) {
    // Reset battle state when new questions arrive
    console.log('Resetting battle for new questions');
    resetBattle();
  }
}, { deep: true });

const currentQuestion = computed(() => {
  const questions = props.battleData?.questions;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    console.warn('No questions available in battleData');
    return { prompt: 'Loading...', choices: [], correctAnswer: 0 };
  }

  const question = questions[currentQuestionIndex.value];
  if (!question) {
    console.warn(`Question at index ${currentQuestionIndex.value} not found`);
    return { prompt: 'Loading...', choices: [], correctAnswer: 0 };
  }

  return question;
});

const guestHPPercent = computed(() => {
  return (guestHP.value / (props.battleData?.guest.hp || 100)) * 100;
});

const playerHPPercent = computed(() => {
  return (playerHP.value / playerMaxHP.value) * 100;
});

const guestHPClass = computed(() => {
  const percent = guestHPPercent.value;
  if (percent > 50) return 'hp-high';
  if (percent > 20) return 'hp-medium';
  return 'hp-low';
});

const playerHPClass = computed(() => {
  const percent = playerHPPercent.value;
  if (percent > 50) return 'hp-high';
  if (percent > 20) return 'hp-medium';
  return 'hp-low';
});

const opponentLevel = computed(() => {
  const guestLevel = props.battleData?.guest?.level;
  if (Number.isFinite(guestLevel)) return guestLevel;

  const difficulty = (props.battleData?.guest?.difficulty || '').toLowerCase();
  if (difficulty.includes('hard')) return 40;
  if (difficulty.includes('medium')) return 35;
  return 30;
});

const guestAvatarPath = computed(() => {
  if (!props.battleData?.guest?.name) return null;
  const guestName = props.battleData.guest.name;

  // Special case for Elena - use elena-front.png
  if (guestName.includes('Elena Verna')) {
    return `/assets/elena-front.png`;
  }

  return `/assets/avatars/${guestName}_pixel_art.png`;
});

const guestTitle = computed(() => {
  if (!props.battleData?.guest?.name) return '';
  return getGuestTitle(props.battleData.guest.name);
});

function resetBattle() {
  guestHP.value = 100;
  playerHP.value = props.playerStats?.hp || 100;
  currentQuestionIndex.value = 0;
  selectedAnswer.value = null;
  selectedAnswerIndex.value = 0;
  answered.value = false;
  isCorrect.value = false;
  battleEnded.value = false;
  battleWon.value = false;

  // Reset battle stats
  const totalQs = props.battleData?.questions?.length || 0;
  battleStats.value = {
    totalQuestions: totalQs,
    correctAnswers: 0,
    wrongAnswers: 0,
    xpGained: 0,
    perfectBattle: false
  };

  console.log('Battle reset with', totalQs, 'questions');
}

function selectAnswer(index) {
  if (answered.value) return;

  selectedAnswer.value = index;
  answered.value = true;
  isCorrect.value = index === currentQuestion.value.correctAnswer;

  // Track battle stats (totalQuestions is already set in resetBattle, don't increment it)
  if (isCorrect.value) {
    battleStats.value.correctAnswers++;
  } else {
    battleStats.value.wrongAnswers++;
  }

  // Emit answer result to parent
  emit('answer-submitted', isCorrect.value);

  setTimeout(() => {
    if (isCorrect.value) {
      guestHP.value = Math.max(0, guestHP.value - 20);
    } else {
      const newHP = Math.max(0, playerHP.value - 20);
      playerHP.value = newHP;
      // Emit HP change to sync with global stats
      emit('hp-changed', newHP);
    }
  }, 100);
}

function nextQuestion() {
  const totalQuestions = props.battleData?.questions?.length || 1;
  if (currentQuestionIndex.value < totalQuestions - 1) {
    currentQuestionIndex.value++;
    answered.value = false;
    selectedAnswer.value = null;
    selectedAnswerIndex.value = 0;
    isCorrect.value = false;
  } else {
    // Battle ends after all questions - check if player won based on accuracy
    const correct = battleStats.value.correctAnswers;
    const total = battleStats.value.totalQuestions;
    const accuracy = (correct / total) * 100;

    // Win if accuracy is 60% or higher
    // 1 question: must get it right (100%)
    // 2 questions: must get both right (100%)
    // 3 questions: must get at least 2 right (66.7%)
    const won = accuracy >= 60;

    console.log(`Battle ended: ${correct}/${total} correct (${accuracy.toFixed(1)}%) - ${won ? 'WIN' : 'LOSE'}`);
    endBattle(won);
  }
}

function endBattle(won) {
  battleEnded.value = true;
  battleWon.value = won;

  // Check for perfect battle (no wrong answers)
  battleStats.value.perfectBattle = won && battleStats.value.wrongAnswers === 0;

  // XP reward (only on victory)
  if (won) {
    battleStats.value.xpGained = battleStats.value.perfectBattle ? 20 : 10;
  } else {
    battleStats.value.xpGained = 0;
  }

  // Play victory or defeat sound
  if (won) {
    EventBus.emit('play-victory-sound');
  }

  // Record battle result in game state
  if (props.battleData?.guest) {
    gameState.recordBattle({
      guestId: props.battleData.guest.id,
      won: won,
      totalQuestions: battleStats.value.totalQuestions,
      correctAnswers: battleStats.value.correctAnswers,
      wrongAnswers: battleStats.value.wrongAnswers,
      xpGained: battleStats.value.xpGained
    });

    if (won) {
      emit('guest-captured', {
        guestId: props.battleData.guest.id,
        xpGained: battleStats.value.xpGained
      });
    }
  }
}

function closeBattle() {
  console.log('closeBattle called - emitting close event');
  emit('close');
}

function handleRetry() {
  console.log('handleRetry called');
  // Reset battle and restart
  battleEnded.value = false;
  battleWon.value = false;
  resetBattle();
}

function handleContinue() {
  console.log('handleContinue called');
  // Close battle screen
  closeBattle();
}
</script>

<style scoped>
/* Pokemon Pixel Swirl Canvas Overlay */
.swirl-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  pointer-events: none;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* === BATTLE SCREEN - Authentic Pokemon Layout === */
.battle-screen {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(960px, 95vw);
  height: min(640px, calc(95vw * 0.667));
  max-height: 90vh;
  z-index: 1000;
  font-family: 'Press Start 2P', monospace, sans-serif;
  overflow: hidden;
  background: #000;
  border: 4px solid #FFD700;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.8);
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Mobile responsive adjustments */
@media (max-width: 1024px) {
  .battle-screen {
    width: 92vw;
    height: calc(92vw * 0.667);
    max-height: 85vh;
    border: 3px solid #FFD700;
  }
}

@media (max-width: 768px) {
  .battle-screen {
    width: 96vw;
    height: calc(96vw * 0.667);
    max-height: 80vh;
    border: 2px solid #FFD700;
  }
}

/* Battle Background Image */
.battle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/assets/battle-background.png');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  z-index: 1;
  transform: translateY(-150px);
}

/* Exit Button */
.exit-battle-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.85);
  border: 3px solid #fff;
  border-radius: 8px;
  cursor: pointer;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
}

.exit-battle-btn:hover {
  background: rgba(255, 59, 48, 0.95);
  transform: scale(1.1);
  border-color: #FFD700;
}

.exit-icon {
  font-size: 20px;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

/* Battle Arena Layout */
.battle-arena {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* === OPPONENT AREA (Top Right) === */
.opponent-area {
  position: absolute;
  top: -10px;
  right: 165px;
  pointer-events: auto;
}

.opponent-sprite {
  margin-top: 50px;
  animation: floatIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

.sprite-image {
  width: 160px;
  height: 160px;
  object-fit: contain;
  filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.4));
}

.opponent-avatar {
  width: 170px;
  height: 170px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.sprite-placeholder {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.sprite-icon {
  width: 80px;
  height: 80px;
  color: #fff;
}

@keyframes floatIn {
  from {
    transform: translateY(-100px) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* === PLAYER AREA (Bottom Left) === */
.player-area {
  position: absolute;
  bottom: 160px;
  left: 180px;
  pointer-events: auto;
}

.player-sprite {
  margin-bottom: 70px;
  animation: slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
}

.player-back {
  width: 165px;
  height: 165px;
  filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.4));
}

@keyframes slideIn {
  from {
    transform: translateX(150px) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* === HP DISPLAYS === */
.hp-display {
  background: #fff;
  border: 4px solid #000;
  border-radius: 12px;
  padding: 16px 20px;
  width: 280px;
  box-shadow:
    0 6px 0 #000,
    0 10px 20px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.7s both;
  pointer-events: auto;
}

.opponent-hp {
  position: absolute;
  top: 20px;
  left: -280px;
}

.player-hp {
  position: absolute;
  bottom: 80px;
  left: 160px;
}

@keyframes slideDown {
  from {
    transform: translateY(-60px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.hp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.guest-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-text {
  font-size: 16px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
}

.guest-title {
  font-size: 10px;
  color: #666;
  font-weight: normal;
  letter-spacing: 0.5px;
}

.level-badge {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 4px;
  border: 2px solid #ddd;
  font-weight: bold;
}

.hp-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hp-label-small {
  font-size: 11px;
  font-weight: bold;
  color: #ef5350;
  letter-spacing: 1px;
}

.hp-bar-track {
  flex: 1;
  height: 20px;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  border: none;
  box-shadow: none;
}

.hp-bar-fill {
  height: 100%;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
  position: relative;
}

.hp-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
}

.hp-high {
  background: linear-gradient(to right, #66bb6a, #4caf50);
}

.hp-medium {
  background: linear-gradient(to right, #ffee58, #fdd835);
}

.hp-low {
  background: linear-gradient(to right, #ef5350, #e53935);
}

.hp-numeric {
  text-align: right;
  font-size: 13px;
  color: #666;
  margin-top: 6px;
  font-weight: 600;
}

/* === BATTLE UI PANEL (Bottom) - Horizontal Layout === */
.battle-ui-panel {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: min(900px, 94%);
  z-index: 10;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s both;
  pointer-events: auto;
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(100%);
  }
  to {
    transform: translateX(-50%) translateY(0);
  }
}

/* Compact Battle Box */
.pokemon-battle-box {
  position: relative;
  background: #fff;
  border: 6px solid #000;
  box-shadow: 0 6px 0 #000, 0 10px 20px rgba(0, 0, 0, 0.4);
  padding: 14px 18px;
  font-family: 'Press Start 2P', monospace, sans-serif;
}

/* Horizontal Layout: 40% / 60% Split */
.battle-layout-horizontal {
  display: flex;
  gap: 16px;
  min-height: 120px;
}

/* Left: Question Section (40%) */
.question-section {
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 16px;
  border-right: 3px solid #e0e0e0;
}

.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  border-bottom: 2px solid #f0f0f0;
}

.q-num {
  font-size: 9px;
  color: #000;
  font-weight: bold;
}

.diff-badge {
  font-size: 8px;
  color: #666;
  text-transform: uppercase;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 2px;
}

.q-text {
  flex: 1;
  font-size: 11px;
  line-height: 1.6;
  color: #000;
  display: flex;
  align-items: center;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 4px;
  padding-top: 6px;
  border-top: 2px solid #f0f0f0;
  font-size: 7px;
  color: #999;
}

.key {
  display: inline-block;
  padding: 2px 4px;
  background: #000;
  color: #fff;
  border-radius: 2px;
  font-size: 7px;
  font-weight: bold;
}

/* Right: Answers Section (60%) */
.answers-section {
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8f8f8;
  border: 2px solid #d0d0d0;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  min-height: 32px;
}

.answer-item.active {
  background: #fffbea;
  border-color: #000;
  box-shadow: inset 0 0 0 2px #ffd700;
  transform: translateX(2px);
}

.answer-item.active::before {
  content: '▶';
  position: absolute;
  left: -12px;
  font-size: 9px;
  color: #000;
  animation: cursorPulse 1s ease-in-out infinite;
}

@keyframes cursorPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.ans-num {
  font-size: 9px;
  font-weight: bold;
  color: #666;
  min-width: 12px;
}

.ans-text {
  flex: 1;
  font-size: 10px;
  line-height: 1.4;
  color: #000;
}

/* Feedback Display */
.feedback-display {
  animation: feedbackSlideIn 0.3s ease-out;
}

@keyframes feedbackSlideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 3px;
}

.result-bar.correct {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
  border: 2px solid #2e7d32;
}

.result-bar.wrong {
  background: linear-gradient(135deg, #ef5350 0%, #f44336 100%);
  border: 2px solid #c62828;
}

.result-bar .icon {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.result-bar .label {
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
}

.explain-text {
  font-size: 10px;
  line-height: 1.6;
  color: #333;
  margin: 0 0 10px 0;
  padding: 8px;
  background: #f8f8f8;
  border-radius: 3px;
}

.continue-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  color: #666;
  padding-top: 6px;
  border-top: 2px solid #e0e0e0;
}

/* Responsive Adjustments - Horizontal Layout */
@media (max-width: 1000px) {
  .sprite-image {
    width: 120px;
    height: 120px;
  }

  .player-back {
    width: 100px;
    height: 100px;
  }

  .hp-display {
    width: 220px;
    padding: 10px 14px;
  }

  .name-text {
    font-size: 12px;
  }

  .q-text {
    font-size: 10px;
  }

  .ans-text {
    font-size: 9px;
  }
}

@media (max-width: 800px) {
  .opponent-area {
    right: 140px;
    top: 20px;
  }

  .player-area {
    left: 80px;
    bottom: 230px;
  }

  .sprite-image {
    width: 100px;
    height: 100px;
  }

  .player-back {
    width: 100px;
    height: 100px;
  }

  .hp-display {
    width: 180px;
    padding: 8px 12px;
  }

  .name-text {
    font-size: 11px;
  }

  .pokemon-battle-box {
    padding: 12px 14px;
  }

  .battle-layout-horizontal {
    gap: 12px;
    min-height: 110px;
  }

  .question-section {
    padding-right: 12px;
  }

  .q-text {
    font-size: 10px;
  }

  .ans-text {
    font-size: 9px;
  }

  .answer-item {
    padding: 7px 9px;
    min-height: 28px;
  }
}

/* Mobile - Stack vertically */
@media (max-width: 768px) {
  .battle-screen {
    font-size: 90%;
  }

  .battle-layout-horizontal {
    flex-direction: column;
    gap: 10px;
    min-height: auto;
  }

  .question-section {
    flex: 1;
    padding-right: 0;
    border-right: none;
    padding-bottom: 10px;
    border-bottom: 3px solid #e0e0e0;
  }

  .answers-section {
    flex: 1;
  }

  .q-text {
    font-size: 10px !important;
  }

  .ans-text {
    font-size: 9px !important;
  }

  .hp-display {
    font-size: 10px !important;
  }

  .exit-battle-btn {
    width: 36px;
    height: 36px;
  }

  .opponent-sprite img, .player-sprite img {
    max-width: 90%;
    max-height: 90%;
  }

  .pokemon-battle-box {
    padding: 10px 12px;
  }

  .answer-item {
    padding: 7px 8px;
  }
}

@media (max-width: 480px) {
  .battle-screen {
    font-size: 85%;
  }

  .q-text {
    font-size: 9px !important;
  }

  .ans-text {
    font-size: 8px !important;
  }

  .hp-display {
    font-size: 9px !important;
  }

  .exit-battle-btn {
    width: 32px;
    height: 32px;
    top: 8px;
    right: 8px;
  }

  .pokemon-battle-box {
    padding: 8px 10px;
  }

  .answer-item {
    padding: 6px 7px;
    min-height: 24px;
  }

  .battle-layout-horizontal {
    gap: 8px;
  }
}
</style>
