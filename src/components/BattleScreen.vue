<template>
  <!-- Battle Transition Animation - Pokemon Style -->
  <div v-if="showTransition" class="battle-transition">
    <!-- Screen flash effect first -->
    <div class="screen-flash"></div>
    <!-- Zigzag pattern effect (like Pokemon) -->
    <div class="zigzag-pattern"></div>
    <!-- Circular iris transition (expanding from center) -->
    <div class="iris-wipe">
      <svg class="iris-svg" viewBox="0 0 960 640" preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id="irisMask">
            <rect width="960" height="640" fill="black"/>
            <circle cx="480" cy="320" r="0" fill="white" class="iris-circle-animated"/>
          </mask>
        </defs>
        <rect width="960" height="640" fill="#000" mask="url(#irisMask)"/>
      </svg>
    </div>
  </div>

  <div class="battle-screen" v-if="isActive && !showTransition">
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
            <span class="name-text">{{ battleData.guest.name }}</span>
            <span class="level-badge">Lv{{ Math.floor(Math.random() * 20) + 30 }}</span>
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
            v-if="battleData.guest.id === '1'"
            src="/assets/elena-front.png"
            alt="Opponent"
            class="sprite-image"
          />
          <div v-else class="sprite-placeholder">
            <span class="sprite-emoji">{{ battleData.guest.sprite || '👤' }}</span>
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

    <!-- Battle UI (Questions at Bottom) - Pokemon Style -->
    <div class="battle-ui-panel">
      <div class="pokemon-battle-box">
        <!-- Inner border decoration -->
        <div class="textbox-inner-border"></div>

        <div v-if="!answered" class="pokemon-battle-layout">
          <!-- Left: Question Display -->
          <div class="pokemon-question-section">
            <div class="question-meta">
              <span class="question-badge">Q{{ currentQuestionIndex + 1 }}/5</span>
              <span class="difficulty-indicator">{{ battleData.guest.difficulty || 'Medium' }}</span>
            </div>
            <p class="pokemon-question-text">{{ currentQuestion.prompt }}</p>

            <!-- Instructions -->
            <div class="pokemon-instructions">
              <span class="key-indicator">↑↓</span> Navigate
              <span class="divider">•</span>
              <span class="key-indicator">ENTER</span> Confirm
            </div>
          </div>

          <!-- Right: Answer Choices -->
          <div class="pokemon-answers-section">
            <div
              v-for="(choice, index) in currentQuestion.choices"
              :key="index"
              class="pokemon-answer-choice"
              :class="{ 'selected': selectedAnswerIndex === index }"
            >
              <span class="answer-cursor" v-if="selectedAnswerIndex === index">▶</span>
              <span class="answer-number">{{ index + 1 }}.</span>
              <span class="answer-choice-text">{{ choice }}</span>
            </div>
          </div>
        </div>

        <!-- Feedback Display -->
        <div v-if="answered" class="pokemon-feedback-section">
          <div class="feedback-result" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
            <span class="result-icon">{{ isCorrect ? '✓' : '✗' }}</span>
            <span class="result-text">{{ isCorrect ? 'CORRECT!' : 'WRONG!' }}</span>
          </div>
          <p class="feedback-text">{{ currentQuestion.explanation }}</p>
          <div class="continue-prompt">
            <span class="key-indicator">ENTER</span>
            {{ currentQuestionIndex < 4 ? 'Next Question' : 'Finish Battle' }}
            <span class="continue-arrow">▼</span>
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
import BattleResult from './BattleResult.vue';
import gameState from '../game/GameState';
import { EventBus } from '../game/EventBus';

const props = defineProps({
  isActive: Boolean,
  battleData: Object,
  playerName: String,
  playerStats: Object
});

const emit = defineEmits(['close', 'guest-captured', 'answer-submitted']);

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
  score: 0,
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

// Reset battle when it becomes active with transition
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    showTransition.value = true;
    // Start battle music
    EventBus.emit('play-battle-music');
    setTimeout(() => {
      showTransition.value = false;
      resetBattle();
    }, 1800); // 1.8 second transition (matches animation duration)
  } else {
    // Stop battle music when battle screen closes
    EventBus.emit('stop-battle-music');
  }
});

const currentQuestion = computed(() => {
  return props.battleData?.questions[currentQuestionIndex.value] || {};
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
  battleStats.value = {
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    score: 0,
    perfectBattle: false
  };
}

function selectAnswer(index) {
  if (answered.value) return;

  selectedAnswer.value = index;
  answered.value = true;
  isCorrect.value = index === currentQuestion.value.correctAnswer;

  // Track battle stats
  battleStats.value.totalQuestions++;
  if (isCorrect.value) {
    battleStats.value.correctAnswers++;
    battleStats.value.score += 20; // 20 points per correct answer
  } else {
    battleStats.value.wrongAnswers++;
  }

  // Emit answer result to parent
  emit('answer-submitted', isCorrect.value);

  setTimeout(() => {
    if (isCorrect.value) {
      guestHP.value = Math.max(0, guestHP.value - 20);
      if (guestHP.value === 0) {
        endBattle(true);
      }
    } else {
      playerHP.value = Math.max(0, playerHP.value - 20);
      if (playerHP.value === 0) {
        endBattle(false);
      }
    }
  }, 100);
}

function nextQuestion() {
  if (currentQuestionIndex.value < 4) {
    currentQuestionIndex.value++;
    answered.value = false;
    selectedAnswer.value = null;
    selectedAnswerIndex.value = 0;
    isCorrect.value = false;
  } else {
    endBattle(guestHP.value === 0);
  }
}

function endBattle(won) {
  battleEnded.value = true;
  battleWon.value = won;

  // Check for perfect battle (no wrong answers)
  battleStats.value.perfectBattle = won && battleStats.value.wrongAnswers === 0;

  // Add bonus points for perfect battle
  if (battleStats.value.perfectBattle) {
    battleStats.value.score += 50; // 50 bonus points for perfect battle
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
      score: battleStats.value.score
    });

    if (won) {
      emit('guest-captured', props.battleData.guest.id);
    }
  }
}

function closeBattle() {
  emit('close');
}

function handleRetry() {
  // Reset battle and restart
  battleEnded.value = false;
  battleWon.value = false;
  resetBattle();
}

function handleContinue() {
  // Close battle screen
  closeBattle();
}
</script>

<style scoped>
/* Pokemon Game Boy Battle Transition */
.battle-transition {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 960px;
  height: 640px;
  background: #fff;
  z-index: 10000;
  overflow: hidden;
  border: 4px solid #FFD700;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.8);
}

/* Screen flash effect (classic Pokemon white flash) */
.screen-flash {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  animation: screenFlash 0.4s ease-out;
  z-index: 1;
  pointer-events: none;
}

@keyframes screenFlash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* Zigzag pattern (Pokemon battle entry effect) */
.zigzag-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(
      45deg,
      #000 0px,
      #000 20px,
      transparent 20px,
      transparent 40px
    ),
    repeating-linear-gradient(
      -45deg,
      #000 0px,
      #000 20px,
      transparent 20px,
      transparent 40px
    );
  animation: zigzagSlide 0.6s steps(8) 0.3s forwards;
  z-index: 2;
  opacity: 1;
}

@keyframes zigzagSlide {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

/* Iris wipe effect container with SVG */
.iris-wipe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  animation: fadeOut 0.3s ease-out 1.5s forwards;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

.iris-svg {
  width: 100%;
  height: 100%;
}

/* Animate the circle radius */
.iris-circle-animated {
  animation: irisExpand 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
}

@keyframes irisExpand {
  0% {
    r: 0;
  }
  100% {
    r: 1000;
  }
}

/* === BATTLE SCREEN - Authentic Pokemon Layout === */
.battle-screen {
  position: absolute;
  top: 50%;
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
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
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
  top: 40px;
  right: 200px;
  pointer-events: auto;
}

.opponent-sprite {
  margin-top: 70px;
  animation: floatIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

.sprite-image {
  width: 160px;
  height: 160px;
  object-fit: contain;
  filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.4));
}

.sprite-placeholder {
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.sprite-emoji {
  font-size: 80px;
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
  bottom: 280px;
  left: 100px;
  pointer-events: auto;
}

.player-sprite {
  margin-bottom: 70px;
  animation: slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
}

.player-back {
  width: 140px;
  height: 140px;
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
  top: 0;
  left: -320px;
}

.player-hp {
  position: absolute;
  bottom: 0;
  left: 0;
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

.name-text {
  font-size: 16px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
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
  height: 12px;
  background: #e0e0e0;
  border: 2px solid #000;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
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

/* === BATTLE UI PANEL (Bottom) - Pokemon Style === */
.battle-ui-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
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

/* Pokemon Battle Textbox */
.pokemon-battle-box {
  position: relative;
  background: #fff;
  border: 8px solid #000;
  box-shadow:
    inset 0 0 0 4px #e8e8e8,
    0 8px 0 #000,
    0 12px 24px rgba(0, 0, 0, 0.5);
  padding: 24px 32px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Inner decorative border */
.textbox-inner-border {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border: 2px solid #d0d0d0;
  pointer-events: none;
}

/* Battle Layout - Horizontal */
.pokemon-battle-layout {
  display: flex;
  gap: 24px;
  height: 100%;
}

/* Question Section (Left Side) */
.pokemon-question-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-right: 24px;
  border-right: 3px solid #000;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-badge {
  font-size: 10px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
}

.difficulty-indicator {
  font-size: 9px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pokemon-question-text {
  font-size: 13px;
  line-height: 1.8;
  margin: 0 0 auto 0;
  color: #000;
  flex: 1;
  display: flex;
  align-items: center;
}

/* Answers Section (Right Side) */
.pokemon-answers-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pokemon-answer-choice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 8px;
  position: relative;
  font-size: 12px;
  line-height: 1.6;
  color: #000;
  transition: background 0.2s ease;
}

.pokemon-answer-choice.selected {
  background: rgba(255, 215, 0, 0.2);
  border-left: 4px solid #000;
  padding-left: 12px;
}

.answer-cursor {
  font-size: 14px;
  color: #000;
  animation: cursorPulse 1s ease-in-out infinite;
  position: absolute;
  left: 0;
}

@keyframes cursorPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.answer-number {
  font-size: 11px;
  font-weight: bold;
  color: #666;
  min-width: 20px;
}

.answer-choice-text {
  flex: 1;
}

/* Instructions */
.pokemon-instructions {
  font-size: 9px;
  color: #666;
  text-align: center;
  padding-top: 12px;
  margin-top: 16px;
  border-top: 2px solid #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.key-indicator {
  display: inline-block;
  padding: 3px 6px;
  background: #000;
  color: #fff;
  border-radius: 3px;
  font-size: 8px;
  font-weight: bold;
  letter-spacing: 1px;
}

.divider {
  color: #999;
  font-size: 10px;
}

/* Feedback Section */
.pokemon-feedback-section {
  animation: feedbackSlideIn 0.3s ease-out;
}

@keyframes feedbackSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-result {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid #000;
}

.feedback-result.correct {
  border-bottom-color: #4caf50;
}

.feedback-result.incorrect {
  border-bottom-color: #ef5350;
}

.result-icon {
  font-size: 24px;
  font-weight: bold;
}

.feedback-result.correct .result-icon {
  color: #4caf50;
}

.feedback-result.incorrect .result-icon {
  color: #ef5350;
}

.result-text {
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.feedback-result.correct .result-text {
  color: #4caf50;
}

.feedback-result.incorrect .result-text {
  color: #ef5350;
}

.feedback-text {
  font-size: 12px;
  line-height: 1.8;
  color: #000;
  margin: 0 0 16px 0;
}

.continue-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 10px;
  color: #666;
  padding-top: 12px;
  border-top: 2px solid #d0d0d0;
}

.continue-arrow {
  font-size: 12px;
  color: #000;
  animation: arrowBounce 1s ease-in-out infinite;
}

@keyframes arrowBounce {
  0%, 100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(4px);
    opacity: 0.6;
  }
}

/* Responsive Adjustments */
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

  .pokemon-question-text {
    font-size: 12px;
  }

  .answer-choice-text {
    font-size: 11px;
  }

  .battle-ui-panel {
    width: 800px;
  }

  .pokemon-battle-box {
    padding: 20px 24px;
  }

  .pokemon-battle-layout {
    gap: 20px;
  }

  .pokemon-question-section {
    padding-right: 20px;
  }
}

@media (max-width: 800px) {
  .opponent-area {
    right: 150px;
    top: 30px;
  }

  .player-area {
    left: 80px;
    bottom: 300px;
  }

  .sprite-image {
    width: 100px;
    height: 100px;
  }

  .player-back {
    width: 80px;
    height: 80px;
  }

  .hp-display {
    width: 180px;
    padding: 8px 12px;
  }

  .name-text {
    font-size: 11px;
  }

  .battle-ui-panel {
    width: 700px;
  }

  .pokemon-battle-box {
    padding: 16px 20px;
  }

  .pokemon-question-text {
    font-size: 11px;
  }

  .answer-choice-text {
    font-size: 10px;
  }

  .pokemon-answer-choice {
    padding: 8px 12px;
  }

  .pokemon-battle-layout {
    gap: 16px;
  }

  .pokemon-question-section {
    padding-right: 16px;
  }
}

/* Mobile-specific font scaling */
@media (max-width: 768px) {
  .battle-screen {
    font-size: 90%; /* Scale down all em/rem-based fonts */
  }

  .pokemon-question-text {
    font-size: 11px !important;
  }

  .pokemon-answer-choice {
    font-size: 10px !important;
    padding: 10px 14px !important;
  }

  .hp-display {
    font-size: 10px !important;
  }

  .battle-instructions {
    font-size: 8px !important;
  }

  .exit-battle-btn {
    width: 36px;
    height: 36px;
  }

  .opponent-sprite img, .player-sprite img {
    max-width: 90%;
    max-height: 90%;
  }
}

@media (max-width: 480px) {
  .battle-screen {
    font-size: 85%;
  }

  .pokemon-question-text {
    font-size: 10px !important;
  }

  .pokemon-answer-choice {
    font-size: 9px !important;
    padding: 8px 12px !important;
  }

  .hp-display {
    font-size: 9px !important;
  }

  .battle-instructions {
    font-size: 7px !important;
  }

  .exit-battle-btn {
    width: 32px;
    height: 32px;
    top: 8px;
    right: 8px;
  }
}
</style>
