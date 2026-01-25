<template>
  <div v-if="show" class="game-over-overlay">
    <div class="game-over-modal">
      <!-- Falling particles animation -->
      <div class="falling-particles">
        <div class="particle" v-for="i in 15" :key="i"></div>
      </div>

      <!-- Game Over Icon -->
      <Icon class="game-over-icon" :icon="heart" />

      <!-- Game Over Message -->
      <h1 class="game-over-title">Game Over</h1>
      <p class="game-over-subtitle">You ran out of HP!</p>

      <!-- Stats Grid (matching LevelComplete style) -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ guestsCaptured }}</div>
          <div class="stat-label">Guests Captured</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ questionsAnswered }}</div>
          <div class="stat-label">Questions Answered</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ accuracy }}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ totalXp }}</div>
          <div class="stat-label">Total XP</div>
        </div>
      </div>

      <!-- Encouragement Message -->
      <p class="encouragement">
        Don't give up! Try again and meet more guests!
        <Icon class="inline-icon" :icon="radioOn" />
      </p>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="share-button primary" @click="handleShare">
          <Icon class="btn-icon" :icon="share" />
          Share Results
        </button>
        <button class="restart-button secondary" @click="handleRestart">
          <Icon class="btn-icon" :icon="reload" />
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import heart from '@iconify/icons-pixelarticons/heart';
import radioOn from '@iconify/icons-pixelarticons/radio-on';
import reload from '@iconify/icons-pixelarticons/reload';
import share from '@iconify/icons-pixelarticons/upload';
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  guestsCaptured: {
    type: Number,
    default: 0
  },
  questionsAnswered: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  totalXp: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['restart', 'share']);

function handleRestart() {
  emit('restart');
}

function handleShare() {
  emit('share');
}
</script>

<style scoped>
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3500;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.game-over-modal {
  position: relative;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  padding: 36px 32px;
  max-width: 520px;
  width: 90%;
  border: 3px solid #FFD700;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  color: white;
  text-align: center;
  font-family: 'Press Start 2P', monospace;
}

@keyframes slideUp {
  from {
    transform: translateY(50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Falling Particles */
.falling-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(233, 69, 96, 0.6);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(233, 69, 96, 0.4);
  animation: particleFall 3s linear infinite;
}

.particle:nth-child(odd) {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

@keyframes particleFall {
  0% {
    transform: translateY(-10px) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(20px);
    opacity: 0;
  }
}

.particle:nth-child(1) { left: 10%; animation-delay: 0s; }
.particle:nth-child(2) { left: 20%; animation-delay: 0.3s; }
.particle:nth-child(3) { left: 30%; animation-delay: 0.6s; }
.particle:nth-child(4) { left: 40%; animation-delay: 0.9s; }
.particle:nth-child(5) { left: 50%; animation-delay: 1.2s; }
.particle:nth-child(6) { left: 60%; animation-delay: 1.5s; }
.particle:nth-child(7) { left: 70%; animation-delay: 1.8s; }
.particle:nth-child(8) { left: 80%; animation-delay: 2.1s; }
.particle:nth-child(9) { left: 90%; animation-delay: 2.4s; }
.particle:nth-child(10) { left: 15%; animation-delay: 0.4s; }
.particle:nth-child(11) { left: 35%; animation-delay: 1s; }
.particle:nth-child(12) { left: 55%; animation-delay: 1.6s; }
.particle:nth-child(13) { left: 75%; animation-delay: 2.2s; }
.particle:nth-child(14) { left: 85%; animation-delay: 0.7s; }
.particle:nth-child(15) { left: 25%; animation-delay: 1.3s; }

/* Game Over Icon */
.game-over-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  animation: heartbeat 1.5s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(255, 107, 107, 0.5));
  color: #ff6b6b;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  10%, 30% {
    transform: scale(1.1);
  }
  20%, 40% {
    transform: scale(1);
  }
}

/* Text Styles */
.game-over-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow:
    3px 3px 0 rgba(0, 0, 0, 0.8),
    0 0 10px rgba(255, 215, 0, 0.35);
  letter-spacing: 2px;
  color: #FFD700;
  text-transform: uppercase;
}

.game-over-subtitle {
  font-size: 10px;
  margin: 0 0 24px 0;
  opacity: 0.9;
}

/* Stats Grid (matching LevelComplete) */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 14px 12px;
  border: 2px solid rgba(255, 215, 0, 0.4);
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.6);
}

.stat-label {
  font-size: 7px;
  opacity: 0.85;
  line-height: 1.5;
  color: #FFD700;
  text-transform: uppercase;
}

/* Encouragement */
.encouragement {
  font-size: 9px;
  margin: 20px 0 24px 0;
  opacity: 0.9;
  color: #fff;
}

.inline-icon {
  width: 14px;
  height: 14px;
  margin-left: 6px;
  vertical-align: -2px;
  color: #FFD700;
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Restart Button */
.restart-button {
  width: 100%;
  font-family: 'Press Start 2P', monospace, sans-serif;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border: 3px solid #FFD700;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.restart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  background: rgba(20, 20, 20, 0.9);
}

.restart-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-button {
  width: 100%;
  font-family: 'Press Start 2P', monospace, sans-serif;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border: 3px solid #60a5fa;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.share-button.primary {
  border-color: #FFD700;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3), 0 0 16px rgba(255, 215, 0, 0.35);
}

.share-button.primary:hover {
  border-color: #FFD700;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 22px rgba(255, 215, 0, 0.45);
}

.restart-button.secondary {
  border-color: #60a5fa;
}

.share-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  background: rgba(20, 20, 20, 0.9);
}

.share-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .game-over-modal {
    padding: 28px 20px;
  }

  .game-over-title {
    font-size: 18px;
  }

  .game-over-subtitle {
    font-size: 9px;
  }

  .game-over-icon {
    font-size: 60px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-label {
    font-size: 6px;
  }

  .restart-button {
    font-size: 10px;
    padding: 12px 16px;
  }

  .share-button {
    font-size: 10px;
    padding: 12px 16px;
  }

  .encouragement {
    font-size: 8px;
  }
}
</style>
