<template>
  <div v-if="show" class="tutorial-overlay" @click="handleClose">
    <div class="tutorial-modal" @click.stop>
      <div class="tutorial-header">
        <h2 class="tutorial-title">Welcome to PokéLenny!</h2>
        <Icon class="tutorial-icon" :icon="gamepad" />
      </div>

      <div class="tutorial-content">
        <div class="instruction-item">
          <div class="instruction-number">1</div>
          <div class="instruction-text">
            <h3>Explore the World</h3>
            <p>Use Arrow Keys or WASD to move around and find podcast guests!</p>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-number">2</div>
          <div class="instruction-text">
            <h3>Battle & Answer</h3>
            <p>Walk near guests to start battles. Answer trivia questions correctly to capture them!</p>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-number">3</div>
          <div class="instruction-text">
            <h3>Level Up & Progress</h3>
            <p>Correct answers earn XP. Level up to unlock more challenging leaders around the world!</p>
          </div>
        </div>

        <div class="instruction-item">
          <div class="instruction-number">4</div>
          <div class="instruction-text">
            <h3>Build Your Collection</h3>
            <p>Press C to view your captured guests. Can you catch them all?</p>
          </div>
        </div>
      </div>

      <button class="start-button" @click="handleClose">
        <Icon class="btn-icon" :icon="bullseye" />
        Let's Go!
      </button>

      <p class="skip-hint">Click anywhere to skip</p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import gamepad from '@iconify/icons-pixelarticons/gamepad';
import bullseye from '@iconify/icons-pixelarticons/bullseye';
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15000;
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

.tutorial-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 4px solid #FFD700;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: white;
  font-family: 'Press Start 2P', monospace, sans-serif;
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

.tutorial-header {
  text-align: center;
  margin-bottom: 32px;
}

.tutorial-title {
  font-size: 20px;
  color: #FFD700;
  margin: 0 0 16px 0;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
  line-height: 1.4;
}

.tutorial-icon {
  width: 48px;
  height: 48px;
  animation: bounce 2s ease-in-out infinite;
  color: #FFD700;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: -2px;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.tutorial-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.instruction-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.instruction-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #FFD700;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.instruction-text {
  flex: 1;
}

.instruction-text h3 {
  font-size: 12px;
  margin: 0 0 8px 0;
  color: #FFD700;
  line-height: 1.4;
}

.instruction-text p {
  font-size: 9px;
  margin: 0;
  line-height: 1.6;
  color: #fff;
  opacity: 0.95;
}

.start-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Press Start 2P', monospace, sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
}

.start-button:active {
  transform: translateY(0);
}

.skip-hint {
  text-align: center;
  font-size: 7px;
  margin: 12px 0 0 0;
  opacity: 0.6;
  color: #fff;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .tutorial-modal {
    padding: 24px;
  }

  .tutorial-title {
    font-size: 16px;
  }

  .tutorial-icon {
    font-size: 36px;
  }

  .instruction-item {
    padding: 12px;
    gap: 12px;
  }

  .instruction-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .instruction-text h3 {
    font-size: 10px;
  }

  .instruction-text p {
    font-size: 8px;
  }

  .start-button {
    font-size: 12px;
    padding: 14px;
  }
}
</style>
