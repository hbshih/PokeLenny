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

        <div
          v-if="hpDelta < 0"
          :key="hpDeltaKey"
          class="hp-float"
        >
          -10 HP
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
              <span class="diff-badge">{{ currentQuestion.difficulty || battleData.guest.difficulty || 'Med' }}</span>
              <span v-if="currentQuestion.isBonus" class="bonus-badge">Bonus</span>
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
              @click="selectAnswer(index)"
            >
              <span class="ans-num">{{ index + 1 }}</span>
              <span class="ans-text">{{ choice }}</span>
            </div>
          </div>
        </div>

        <!-- Feedback Display -->
        <div v-if="answered" class="feedback-display" @click="nextQuestion">
          <div class="result-bar" :class="{ 'correct': isCorrect, 'wrong': !isCorrect }">
            <span class="icon">{{ isCorrect ? '✓' : '✗' }}</span>
            <span class="label">{{ isCorrect ? 'CORRECT!' : 'WRONG!' }}</span>
          </div>
          <p v-if="currentQuestion.explanation" class="explain-text">{{ currentQuestion.explanation }}</p>
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
      :episodeUrl="battleData?.guest?.episodeUrl || ''"
      :totalXp="playerStats?.xp || 0"
      :stats="battleStats"
      @retry="handleRetry"
      @continue="handleContinue"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import user from '@iconify/icons-pixelarticons/user';
import BattleResult from './BattleResult.vue';
import { useBattleState } from './battle/useBattleState';

const props = defineProps({
  isActive: Boolean,
  battleData: Object,
  playerName: String,
  playerStats: Object
});

const emit = defineEmits(['close', 'guest-captured', 'answer-submitted', 'hp-changed']);

const swirlCanvas = ref(null);
const {
  guestHP,
  playerHP,
  playerMaxHP,
  playerLevel,
  currentQuestionIndex,
  selectedAnswer,
  selectedAnswerIndex,
  answered,
  isCorrect,
  battleEnded,
  battleWon,
  showTransition,
  battleStats,
  xpPerCorrect,
  currentQuestion,
  guestHPPercent,
  playerHPPercent,
  guestHPClass,
  playerHPClass,
  hpDelta,
  hpDeltaKey,
  opponentLevel,
  guestAvatarPath,
  guestTitle,
  selectAnswer,
  nextQuestion,
  closeBattle,
  handleRetry,
  handleContinue
} = useBattleState(props, emit, swirlCanvas);
</script>

<style scoped>
/* =========================
   Battle Screen Shell
   ========================= */
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
  top: 46%;
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

/* =========================
   Responsive
   ========================= */
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
    max-height: 85vh;
    border: 2px solid #FFD700;
    top: 50%;
  }
}

/* =========================
   Background + Exit
   ========================= */
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
  touch-action: manipulation;
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

/* =========================
   Battle Arena (Sprites + HP)
   ========================= */
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

.hp-float {
  position: absolute;
  left: 160px;
  bottom: 205px;
  color: #ff4d4f;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 0 #000, 0 0 8px rgba(255, 77, 79, 0.6);
  min-width: 90px;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  animation: hpFloatUp 0.8s ease-out forwards;
}

@keyframes hpFloatUp {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-18px) scale(1.05);
  }
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
  border: none;
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

/* =========================
   Question + Answers Panel
   ========================= */
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

.bonus-badge {
  font-size: 8px;
  color: #000;
  text-transform: uppercase;
  padding: 2px 6px;
  background: #ffd700;
  border-radius: 2px;
  border: 2px solid #000;
  margin-left: 6px;
}

.q-text {
  flex: 1;
  font-size: 14px;
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
  padding-right: 12px;
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
  touch-action: manipulation;
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

/* Mobile portrait - Vertical layout */
@media (max-width: 1024px) {
  .battle-screen {
    font-size: 90%;
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    top: 0;
    left: 0;
    transform: none;
    border: none;
  }

  .battle-background {
    background-image: none;
    background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
    transform: none;
  }

  /* Top 40%: Battle arena with both players side by side */
  .battle-arena {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 40%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px;
    gap: 8px;
  }

  /* Opponent area - Left side */
  .opponent-area {
    position: static;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }

  .opponent-sprite {
    margin: 0;
    order: 2;
  }

  .opponent-avatar {
    width: 110px;
    height: 110px;
  }

  .opponent-hp {
    position: static;
    order: 1;
    margin: 0;
    width: 100%;
    max-width: 180px;
  }

  /* Player area - Right side */
  .player-area {
    position: static;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }

  .player-sprite {
    margin: 0;
    order: 2;
    display: block;
  }

  .player-back {
    width: 110px;
    height: 110px;
  }

  .player-hp {
    position: static;
    order: 1;
    margin: 0;
    width: 100%;
    max-width: 180px;
  }

  /* HP displays */
  .hp-display {
    padding: 8px 10px;
    width: 100%;
    font-size: 8px;
  }

  .name-text {
    font-size: 11px;
  }

  .guest-title {
    font-size: 7px;
  }

  .level-badge {
    font-size: 9px;
    padding: 3px 6px;
  }

  .hp-bar-track {
    height: 16px;
  }

  .hp-numeric {
    font-size: 10px;
    margin-top: 4px;
  }

  /* Bottom 60%: Battle UI with questions and answers */
  .battle-ui-panel {
    position: absolute;
    top: 40%;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 60%;
    transform: none;
    animation: none;
    display: flex;
    flex-direction: column;
  }

  .pokemon-battle-box {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 0;
  }

  .battle-layout-horizontal {
    flex-direction: column;
    gap: 12px;
    min-height: auto;
    flex: 1;
    overflow-y: auto;
  }

  .question-section {
    flex: 0 0 auto;
    padding-right: 0;
    border-right: none;
    padding-bottom: 12px;
    border-bottom: 3px solid #e0e0e0;
  }

  .q-text {
    font-size: 13px !important;
    line-height: 1.6;
  }

  .q-num {
    font-size: 9px;
  }

  .diff-badge {
    font-size: 8px;
  }

  .controls {
    font-size: 8px;
  }

  .key {
    font-size: 7px;
  }

  .answers-section {
    flex: 1;
    overflow-y: auto;
    padding-right: 0;
  }

  .answer-item {
    min-height: 40px;
    padding: 10px 12px;
    margin-bottom: 8px;
  }

  .ans-text {
    font-size: 12px !important;
    line-height: 1.5;
  }

  .ans-num {
    font-size: 10px;
  }

  /* Feedback display */
  .feedback-display {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .result-bar {
    padding: 12px;
    margin-bottom: 12px;
  }

  .result-bar .icon {
    font-size: 18px;
  }

  .result-bar .label {
    font-size: 12px;
  }

  .explain-text {
    font-size: 11px;
    line-height: 1.6;
    padding: 10px;
    flex: 1;
    overflow-y: auto;
  }

  .continue-bar {
    font-size: 9px;
    padding-top: 8px;
  }

  .continue-bar .key {
    font-size: 8px;
  }

  /* Exit button */
  .exit-battle-btn {
    width: 38px;
    height: 38px;
    top: 12px;
    right: 12px;
    z-index: 3000;
  }

  .exit-icon {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .battle-screen {
    font-size: 85%;
  }

  .opponent-avatar {
    width: 90px;
    height: 90px;
  }

  .player-back {
    width: 90px;
    height: 90px;
  }

  .hp-display {
    padding: 6px 8px;
    font-size: 7px;
  }

  .name-text {
    font-size: 10px;
  }

  .guest-title {
    font-size: 6px;
  }

  .level-badge {
    font-size: 8px;
    padding: 2px 5px;
  }

  .hp-bar-track {
    height: 14px;
  }

  .hp-numeric {
    font-size: 9px;
  }

  .pokemon-battle-box {
    padding: 12px;
  }

  .q-text {
    font-size: 12px !important;
  }

  .q-num {
    font-size: 8px;
  }

  .diff-badge {
    font-size: 7px;
  }

  .ans-text {
    font-size: 11px !important;
  }

  .ans-num {
    font-size: 9px;
  }

  .answer-item {
    padding: 9px 10px;
    min-height: 36px;
  }

  .explain-text {
    font-size: 10px;
  }

  .result-bar .icon {
    font-size: 16px;
  }

  .result-bar .label {
    font-size: 11px;
  }

  .exit-battle-btn {
    width: 34px;
    height: 34px;
    top: 10px;
    right: 10px;
  }

  .exit-icon {
    font-size: 16px;
  }
}

</style>
