<template>
  <div v-if="isActive" class="battle-result-overlay">
    <div class="result-container" :class="{ victory: won, defeat: !won }">
      <!-- Result Header -->
      <div class="result-header">
        <h1 class="result-title">{{ won ? 'VICTORY!' : 'DEFEAT' }}</h1>
        <div class="result-subtitle">{{ won ? 'You defeated' : 'You lost to' }} {{ guestName }}!</div>
      </div>

      <!-- Stats Display -->
      <div class="stats-container">
        <div class="stat-row">
          <span class="stat-label">Questions Answered:</span>
          <span class="stat-value">{{ stats.totalQuestions }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Correct Answers:</span>
          <span class="stat-value correct">{{ stats.correctAnswers }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Wrong Answers:</span>
          <span class="stat-value wrong">{{ stats.wrongAnswers }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Accuracy:</span>
          <span class="stat-value">{{ accuracy }}%</span>
        </div>
        <div v-if="won" class="stat-row highlight">
          <span class="stat-label">Score Earned:</span>
          <span class="stat-value score">+{{ stats.score }}</span>
        </div>
        <div v-if="stats.perfectBattle" class="perfect-badge">
          ⭐ PERFECT BATTLE! ⭐
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button
          v-if="!won"
          class="result-btn retry-btn"
          :class="{ selected: selectedButton === 0 }"
          @click="retry"
        >
          ▶ TRY AGAIN
        </button>
        <button
          class="result-btn continue-btn"
          :class="{ selected: won ? selectedButton === 0 : selectedButton === 1 }"
          @click="continueGame"
        >
          ▶ {{ won ? 'CONTINUE' : 'RETURN' }}
        </button>
      </div>

      <!-- Keyboard hint -->
      <div class="keyboard-hint">
        ← → Arrow keys to select | ENTER to confirm
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isActive: Boolean,
  won: Boolean,
  guestName: String,
  stats: {
    type: Object,
    default: () => ({
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      score: 0,
      perfectBattle: false
    })
  }
});

const emit = defineEmits(['continue', 'retry']);

// Keyboard navigation
const selectedButton = ref(0); // 0 = retry (if available), 1 = continue
const numButtons = computed(() => props.won ? 1 : 2); // Victory: 1 button, Defeat: 2 buttons

const accuracy = computed(() => {
  if (props.stats.totalQuestions === 0) return 0;
  return Math.round((props.stats.correctAnswers / props.stats.totalQuestions) * 100);
});

// Reset selected button when result screen opens
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    selectedButton.value = 0;
  }
});

function handleKeyPress(event) {
  console.log('BattleResult handleKeyPress called - isActive:', props.isActive, 'key:', event.key);

  if (!props.isActive) {
    console.log('BattleResult handleKeyPress - not active, returning');
    return;
  }

  const key = event.key;
  console.log('BattleResult processing key:', key, 'selectedButton:', selectedButton.value, 'won:', props.won);

  const resultKeys = ['ArrowLeft', 'ArrowRight', 'Enter', ' '];
  if (!resultKeys.includes(key)) {
    console.log('Key not in resultKeys, ignoring');
    return;
  }

  console.log('Preventing default and stopping propagation');
  event.preventDefault();
  event.stopPropagation();

  if (key === 'ArrowLeft') {
    selectedButton.value = Math.max(0, selectedButton.value - 1);
  } else if (key === 'ArrowRight') {
    selectedButton.value = Math.min(numButtons.value - 1, selectedButton.value + 1);
  } else if (key === 'Enter' || key === ' ') {
    console.log('Enter/Space pressed - calling action. selectedButton:', selectedButton.value, 'won:', props.won, 'numButtons:', numButtons.value);
    if (selectedButton.value === 0 && !props.won) {
      console.log('Calling retry()');
      retry();
    } else {
      console.log('Calling continueGame()');
      continueGame();
    }
  }
}

onMounted(() => {
  console.log('BattleResult mounted, adding keydown listener');
  window.addEventListener('keydown', handleKeyPress, true); // Use capture phase
});

onUnmounted(() => {
  console.log('BattleResult unmounting, removing keydown listener');
  window.removeEventListener('keydown', handleKeyPress, true);
});

function retry() {
  console.log('BattleResult: retry() called, emitting retry event');
  emit('retry');
}

function continueGame() {
  console.log('BattleResult: continueGame() called, emitting continue event');
  emit('continue');
}
</script>

<style scoped>
.battle-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-container {
  background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
  border: 8px solid #FFD700;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 90%;
  box-shadow:
    0 0 40px rgba(255, 215, 0, 0.6),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.result-container.victory {
  border-color: #4CAF50;
  box-shadow:
    0 0 40px rgba(76, 175, 80, 0.8),
    inset 0 0 20px rgba(76, 175, 80, 0.1);
}

.result-container.defeat {
  border-color: #FF6B6B;
  box-shadow:
    0 0 40px rgba(255, 107, 107, 0.8),
    inset 0 0 20px rgba(255, 107, 107, 0.1);
}

@keyframes slideIn {
  from {
    transform: translateY(-50px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Header */
.result-header {
  text-align: center;
  margin-bottom: 30px;
}

.result-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 42px;
  color: #FFD700;
  margin: 0 0 10px 0;
  text-shadow:
    3px 3px 0 #000,
    0 0 20px rgba(255, 215, 0, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

.victory .result-title {
  color: #4CAF50;
  text-shadow:
    3px 3px 0 #000,
    0 0 20px rgba(76, 175, 80, 0.8);
}

.defeat .result-title {
  color: #FF6B6B;
  text-shadow:
    3px 3px 0 #000,
    0 0 20px rgba(255, 107, 107, 0.8);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.result-subtitle {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #ECF0F1;
  text-shadow: 2px 2px 0 #000;
}

/* Stats */
.stats-container {
  background: rgba(0, 0, 0, 0.4);
  border: 4px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  font-family: 'Press Start 2P', monospace;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row.highlight {
  background: rgba(76, 175, 80, 0.2);
  padding: 15px;
  margin: 10px -10px -10px -10px;
  border-radius: 0 0 8px 8px;
  border-bottom: none;
}

.stat-label {
  font-size: 12px;
  color: #BDC3C7;
}

.stat-value {
  font-size: 14px;
  color: #ECF0F1;
  font-weight: bold;
}

.stat-value.correct {
  color: #4CAF50;
}

.stat-value.wrong {
  color: #FF6B6B;
}

.stat-value.score {
  color: #FFD700;
  font-size: 18px;
}

.perfect-badge {
  text-align: center;
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  color: #FFD700;
  padding: 15px;
  margin-top: 15px;
  background: linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.3) 50%, rgba(255,215,0,0.1) 100%);
  border-radius: 8px;
  animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { text-shadow: 0 0 10px rgba(255, 215, 0, 0.8); }
  50% { text-shadow: 0 0 20px rgba(255, 215, 0, 1); }
}

/* Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.result-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  padding: 15px 30px;
  border: 4px solid;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 2px 2px 0 #000;
}

.retry-btn {
  background: #FF6B6B;
  border-color: #C0392B;
  color: #FFF;
}

.retry-btn:hover {
  background: #E74C3C;
  transform: translateY(-2px);
  box-shadow: 0 4px 0 #C0392B;
}

.continue-btn {
  background: #4CAF50;
  border-color: #2E7D32;
  color: #FFF;
}

.continue-btn:hover {
  background: #45A049;
  transform: translateY(-2px);
  box-shadow: 0 4px 0 #2E7D32;
}

/* Keyboard selected state */
.result-btn.selected {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 4px 0 currentColor;
  border-color: #FFD700;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 4px 0 currentColor;
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 4px 0 currentColor;
  }
}

.keyboard-hint {
  margin-top: 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  letter-spacing: 1px;
}

/* Responsive */
@media (max-width: 768px) {
  .result-container {
    padding: 30px 20px;
  }

  .result-title {
    font-size: 28px;
  }

  .result-subtitle {
    font-size: 11px;
  }

  .stat-label, .stat-value {
    font-size: 10px;
  }

  .result-btn {
    font-size: 11px;
    padding: 12px 20px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
