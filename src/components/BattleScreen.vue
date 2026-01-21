<template>
  <!-- Battle Transition Animation -->
  <div v-if="showTransition" class="battle-transition">
    <div class="transition-effect"></div>
  </div>

  <div class="battle-screen" v-if="isActive && !showTransition">
    <!-- Pokemon-style battle background -->
    <div class="battle-background">
      <!-- Sky gradient -->
      <div class="sky-gradient"></div>

      <!-- Battle arena with perspective -->
      <div class="battle-arena">
        <!-- Guest info box (top left) -->
        <div class="guest-info-box">
          <div class="guest-name-row">
            <span class="guest-name">{{ battleData.guest.name }}</span>
          </div>
          <div class="hp-bar-row">
            <span class="hp-label">HP</span>
            <div class="hp-bar-outer">
              <div class="hp-bar-inner" :class="guestHPClass" :style="{ width: guestHPPercent + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Guest sprite (left side, further away) -->
        <div class="guest-sprite-container">
          <img
            v-if="battleData.guest.id === '1'"
            src="/assets/elena-front.png"
            alt="Guest"
            class="guest-sprite"
          />
          <span v-else class="guest-emoji">{{ battleData.guest.sprite }}</span>
          <div class="guest-shadow"></div>
        </div>

        <!-- Player sprite placeholder (right side, closer) -->
        <div class="player-sprite-container">
          <div class="player-sprite-placeholder">YOU</div>
          <div class="player-shadow"></div>
        </div>

        <!-- Player info box (bottom right) -->
        <div class="player-info-box">
          <div class="player-name-row">
            <span class="player-name">User</span>
            <span class="player-level">♂Lv.42</span>
          </div>
          <div class="hp-bar-row">
            <span class="hp-label">HP</span>
            <div class="hp-bar-outer">
              <div class="hp-bar-inner" :class="playerHPClass" :style="{ width: playerHPPercent + '%' }"></div>
            </div>
          </div>
          <div class="hp-numbers">{{ playerHP }}/100</div>
        </div>
      </div>

      <!-- Ground area -->
      <div class="ground-area"></div>
    </div>

    <!-- Bottom UI for questions -->
    <div class="battle-ui">
      <!-- Question text box -->
      <div class="question-box">
        <p class="question-text">{{ currentQuestion.prompt }}</p>
      </div>

      <!-- Answer choices -->
      <div class="choices-box" v-if="!answered">
        <button
          v-for="(choice, index) in currentQuestion.choices"
          :key="index"
          class="choice-btn"
          :class="`choice-${index}`"
          @click="selectAnswer(index)"
        >
          {{ choice }}
        </button>
      </div>

      <!-- Feedback after answering -->
      <div class="feedback-box" v-if="answered">
        <div class="feedback-result" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
          {{ isCorrect ? '✓ Correct!' : '✗ Wrong!' }}
        </div>
        <div class="explanation">{{ currentQuestion.explanation }}</div>
        <button class="next-btn" @click="nextQuestion">
          {{ currentQuestionIndex < 4 ? 'Next Question →' : 'Finish Battle' }}
        </button>
      </div>
    </div>

    <!-- Victory/Defeat overlay with animations -->
    <div v-if="battleEnded" class="battle-result-overlay" @click="closeBattle">
      <div class="battle-result-box" :class="{ 'victory-box': battleWon, 'defeat-box': !battleWon }" @click.stop>
        <!-- Victory animation -->
        <div v-if="battleWon" class="victory-animation">
          <div class="star star-1">⭐</div>
          <div class="star star-2">⭐</div>
          <div class="star star-3">⭐</div>
          <div class="star star-4">⭐</div>
          <div class="star star-5">⭐</div>
        </div>

        <!-- Defeat animation -->
        <div v-if="!battleWon" class="defeat-animation">
          <div class="defeat-icon">💔</div>
        </div>

        <h1 class="result-title" :class="{ 'victory-title': battleWon, 'defeat-title': !battleWon }">
          {{ battleWon ? 'Victory!' : 'Defeat!' }}
        </h1>

        <div v-if="battleWon" class="victory-badge">
          <div class="badge-shine"></div>
          🏆
        </div>

        <p class="result-message" v-if="battleWon">
          You captured {{ battleData.guest.name }}!
        </p>
        <p class="result-message" v-else>
          Better luck next time!
        </p>
        <button class="result-continue-btn" :class="{ 'victory-btn': battleWon, 'defeat-btn': !battleWon }" @click="closeBattle">
          {{ battleWon ? 'Continue' : 'Try Again' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isActive: Boolean,
  battleData: Object
});

const emit = defineEmits(['close', 'guest-captured', 'answer-submitted']);

const guestHP = ref(100);
const playerHP = ref(100);
const currentQuestionIndex = ref(0);
const selectedAnswer = ref(null);
const answered = ref(false);
const isCorrect = ref(false);
const battleEnded = ref(false);
const battleWon = ref(false);
const showTransition = ref(false);

// Reset battle when it becomes active with transition
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    showTransition.value = true;
    setTimeout(() => {
      showTransition.value = false;
      resetBattle();
    }, 1500); // 1.5 second transition
  }
});

const currentQuestion = computed(() => {
  return props.battleData?.questions[currentQuestionIndex.value] || {};
});

const guestHPPercent = computed(() => {
  return (guestHP.value / (props.battleData?.guest.hp || 100)) * 100;
});

const playerHPPercent = computed(() => {
  return (playerHP.value / 100) * 100;
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
  playerHP.value = 100;
  currentQuestionIndex.value = 0;
  selectedAnswer.value = null;
  answered.value = false;
  isCorrect.value = false;
  battleEnded.value = false;
  battleWon.value = false;
}

function selectAnswer(index) {
  if (answered.value) return;

  selectedAnswer.value = index;
  answered.value = true;
  isCorrect.value = index === currentQuestion.value.correctAnswer;

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
    isCorrect.value = false;
  } else {
    endBattle(guestHP.value === 0);
  }
}

function endBattle(won) {
  battleEnded.value = true;
  battleWon.value = won;
  if (won && props.battleData?.guest) {
    emit('guest-captured', props.battleData.guest.id);
  }
}

function closeBattle() {
  emit('close');
}
</script>

<style scoped>
/* Battle Transition Animation */
.battle-transition {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.transition-effect {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, #FFD700, #FF6B6B, #4ECDC4, #000);
  animation: pokemonSwirl 1.5s ease-in-out;
}

@keyframes pokemonSwirl {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(20) rotate(720deg);
    opacity: 1;
  }
  100% {
    transform: scale(50) rotate(1440deg);
    opacity: 0;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Victory Animations */
.victory-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  font-size: 48px;
  animation: starBurst 1.5s ease-out forwards;
}

.star-1 {
  top: 50%;
  left: 50%;
  animation-delay: 0s;
}

.star-2 {
  top: 50%;
  left: 50%;
  animation-delay: 0.1s;
}

.star-3 {
  top: 50%;
  left: 50%;
  animation-delay: 0.2s;
}

.star-4 {
  top: 50%;
  left: 50%;
  animation-delay: 0.3s;
}

.star-5 {
  top: 50%;
  left: 50%;
  animation-delay: 0.4s;
}

@keyframes starBurst {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + var(--x, 200px)),
      calc(-50% + var(--y, -200px))
    ) scale(1.5) rotate(360deg);
    opacity: 0;
  }
}

.star-1 { --x: 150px; --y: -150px; }
.star-2 { --x: -150px; --y: -150px; }
.star-3 { --x: 200px; --y: 100px; }
.star-4 { --x: -200px; --y: 100px; }
.star-5 { --x: 0px; --y: -250px; }

.victory-title {
  animation: victoryPulse 1s ease-in-out infinite;
  color: #FFD700 !important;
}

@keyframes victoryPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.victory-badge {
  font-size: 72px;
  margin: 20px 0;
  animation: badgeSpin 2s ease-in-out infinite;
  position: relative;
}

@keyframes badgeSpin {
  0%, 100% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(360deg);
  }
}

.badge-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.victory-box {
  animation: victoryBounce 0.6s ease-out;
}

@keyframes victoryBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.victory-btn {
  background: #4CAF50 !important;
  animation: btnGlow 2s ease-in-out infinite;
}

@keyframes btnGlow {
  0%, 100% {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.6), 0 0 30px rgba(76, 175, 80, 0.4);
  }
}

/* Defeat Animations */
.defeat-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.defeat-icon {
  font-size: 120px;
  animation: heartBreak 1s ease-out;
}

@keyframes heartBreak {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.5) rotate(10deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.3;
  }
}

.defeat-title {
  animation: defeatShake 0.5s ease-in-out;
  color: #F44336 !important;
}

@keyframes defeatShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.defeat-box {
  animation: defeatFade 0.6s ease-out;
}

@keyframes defeatFade {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.defeat-btn {
  background: #FF6B6B !important;
}

.defeat-btn:hover {
  background: #FF5252 !important;
}

.battle-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  font-family: 'Press Start 2P', monospace, sans-serif;
  overflow: hidden;
  background: #000;
}

/* Battle background - top 65% */
.battle-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 65%;
  overflow: hidden;
}

/* Sky gradient */
.sky-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(180deg, #5AB9EA 0%, #A8E0F8 100%);
}

/* Battle arena - grass field */
.battle-arena {
  position: absolute;
  top: 25%;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(180deg, #90EE90 0%, #6FBF6F 100%);
  position: relative;
}

/* Ground area */
.ground-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 35%;
  background: linear-gradient(180deg, #5A8E5A 0%, #3D6B3D 100%);
}

/* Guest info box (top left) */
.guest-info-box {
  position: absolute;
  top: 5%;
  left: 3%;
  background: #FFF;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 8px 12px;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.guest-name-row {
  margin-bottom: 6px;
}

.guest-name {
  font-size: 13px;
  color: #000;
  font-weight: bold;
}

/* Player info box (bottom right) */
.player-info-box {
  position: absolute;
  bottom: 8%;
  right: 3%;
  background: #FFF;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 240px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.player-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.player-name {
  font-size: 13px;
  color: #000;
  font-weight: bold;
}

.player-level {
  font-size: 11px;
  color: #666;
}

/* HP bar styling */
.hp-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.hp-label {
  font-size: 10px;
  font-weight: bold;
  color: #F85858;
  min-width: 20px;
}

.hp-bar-outer {
  flex: 1;
  height: 6px;
  background: #CCC;
  border: 1px solid #000;
  border-radius: 3px;
  overflow: hidden;
}

.hp-bar-inner {
  height: 100%;
  transition: width 0.5s ease, background-color 0.3s ease;
}

.hp-high {
  background: #58D058;
}

.hp-medium {
  background: #F8D030;
}

.hp-low {
  background: #F85858;
}

.hp-numbers {
  text-align: right;
  font-size: 11px;
  color: #000;
}

/* Sprite containers */
.guest-sprite-container {
  position: absolute;
  top: 20%;
  left: 20%;
  text-align: center;
}

.guest-sprite {
  width: 120px;
  height: 120px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.guest-emoji {
  font-size: 80px;
  display: block;
}

.guest-shadow {
  width: 80px;
  height: 12px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.3) 0%, transparent 70%);
  margin: 10px auto 0;
}

.player-sprite-container {
  position: absolute;
  bottom: 15%;
  right: 25%;
  text-align: center;
}

.player-sprite-placeholder {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #FFF;
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
}

.player-shadow {
  width: 60px;
  height: 10px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, transparent 70%);
  margin: 8px auto 0;
}

/* Bottom UI - 35% */
.battle-ui {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 35%;
  background: #000;
  border-top: 4px solid #FFD700;
  display: flex;
  padding: 16px;
  gap: 16px;
}

/* Question box */
.question-box {
  flex: 1;
  background: #FFF;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 14px 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
}

.question-text {
  font-size: 13px;
  line-height: 1.8;
  margin: 0;
  color: #000;
}

/* Choices box */
.choices-box {
  width: 45%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.choice-btn {
  background: #FF69B4;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 14px 12px;
  font-size: 12px;
  font-family: inherit;
  color: #FFF;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: bold;
  line-height: 1.4;
}

.choice-btn:hover {
  background: #FF1493;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.choice-btn:active {
  transform: translateY(0);
}

/* Alternate colors for choices */
.choice-0 { background: #FF69B4; }
.choice-0:hover { background: #FF1493; }
.choice-1 { background: #87CEEB; }
.choice-1:hover { background: #5DADE2; }
.choice-2 { background: #98D982; }
.choice-2:hover { background: #76C760; }
.choice-3 { background: #FFD700; color: #000; }
.choice-3:hover { background: #FFA500; }

/* Feedback box */
.feedback-box {
  width: 45%;
  background: #FFF;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 14px 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-result {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
}

.feedback-result.correct {
  color: #4CAF50;
}

.feedback-result.incorrect {
  color: #F44336;
}

.explanation {
  font-size: 11px;
  line-height: 1.6;
  color: #333;
  flex: 1;
}

.next-btn {
  width: 100%;
  background: #FFD700;
  border: 3px solid #000;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 12px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  color: #000;
}

.next-btn:hover {
  background: #FFA500;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

/* Result overlay */
.battle-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.battle-result-box {
  background: #FFF;
  border: 6px solid #000;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
}

.result-title {
  font-size: 36px;
  margin: 0 0 20px 0;
  color: #FFD700;
  text-shadow: 3px 3px 0px #000;
}

.result-message {
  font-size: 14px;
  margin: 0 0 30px 0;
  line-height: 1.6;
  color: #000;
}

.result-continue-btn {
  padding: 16px 40px;
  font-size: 16px;
  font-family: inherit;
  background: #4CAF50;
  color: #FFF;
  border: 4px solid #000;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  font-weight: bold;
  transition: all 0.2s ease;
}

.result-continue-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

@media (max-width: 800px) {
  .question-text {
    font-size: 11px;
  }

  .choice-btn {
    font-size: 10px;
    padding: 12px 8px;
  }

  .guest-sprite {
    width: 80px;
    height: 80px;
  }

  .player-sprite-placeholder {
    width: 70px;
    height: 70px;
    font-size: 12px;
  }

  .guest-info-box,
  .player-info-box {
    min-width: 150px;
    padding: 6px 10px;
  }

  .guest-name,
  .player-name {
    font-size: 11px;
  }
}
</style>
