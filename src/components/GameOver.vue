<template>
  <div v-if="show" class="game-over-overlay">
    <div class="game-over-modal">
      <!-- Falling particles animation -->
      <div class="falling-particles">
        <div class="particle" v-for="i in 15" :key="i"></div>
      </div>

      <!-- Game Over Icon -->
      <div class="game-over-icon">💔</div>

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
      </div>

      <!-- Encouragement Message -->
      <p class="encouragement">Don't give up! Try again and meet more guests! 🎙️</p>

      <!-- Restart Button -->
      <button class="restart-button" @click="handleRestart">
        🔄 Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
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
  }
});

const emit = defineEmits(['restart']);

function handleRestart() {
  emit('restart');
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
  background: linear-gradient(135deg, #4a1c40 0%, #2c1810 100%);
  border-radius: 24px;
  padding: 48px 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  color: white;
  text-align: center;
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
  font-size: 80px;
  margin-bottom: 24px;
  animation: heartbeat 1.5s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(233, 69, 96, 0.5));
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
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 12px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
  color: #ff6b6b;
}

.game-over-subtitle {
  font-size: 18px;
  margin: 0 0 32px 0;
  opacity: 0.9;
  font-weight: 500;
}

/* Stats Grid (matching LevelComplete) */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #ffd700;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
  line-height: 1.4;
}

/* Encouragement */
.encouragement {
  font-size: 16px;
  margin: 24px 0 32px 0;
  opacity: 0.9;
  font-weight: 500;
  color: #a8dadc;
}

/* Restart Button */
.restart-button {
  width: 100%;
  padding: 18px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.restart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  background: linear-gradient(135deg, #7c8ff2 0%, #8a5eb8 100%);
}

.restart-button:active {
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .game-over-modal {
    padding: 32px 24px;
  }

  .game-over-title {
    font-size: 28px;
  }

  .game-over-subtitle {
    font-size: 16px;
  }

  .game-over-icon {
    font-size: 60px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 10px;
  }

  .restart-button {
    font-size: 16px;
    padding: 16px 24px;
  }

  .encouragement {
    font-size: 14px;
  }
}
</style>
