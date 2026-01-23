<template>
  <div v-if="show" class="level-complete-overlay" @click.self="handleContinue">
    <div class="level-complete-modal">
      <!-- Celebration Animation -->
      <div class="celebration-stars">
        <div class="star" v-for="i in 20" :key="i"></div>
      </div>

      <!-- Trophy Icon -->
      <Icon class="trophy-icon" :icon="trophy" />

      <!-- Level Complete Message -->
      <h1 class="level-title">Level {{ currentLevel }} Complete!</h1>
      <p class="level-subtitle">Amazing work! You've mastered this level.</p>

      <!-- Stats Summary -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ enemiesDefeated }}</div>
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

      <!-- Level Up Badge -->
      <div class="level-up-badge">
        <div class="badge-glow"></div>
        <div class="badge-content">
          <div class="level-number">{{ currentLevel + 1 }}</div>
          <div class="level-up-text">Level Up!</div>
        </div>
      </div>

      <!-- Continue Button -->
      <button class="continue-button" @click="handleContinue">
        <span v-if="hasMoreLevels">Continue to Level {{ currentLevel + 1 }}</span>
        <span v-else>
          <Icon class="btn-icon" :icon="trophy" />
          Game Complete!
        </span>
      </button>

      <!-- Progress Info -->
      <p class="progress-info" v-if="hasMoreLevels">
        {{ remainingGuests }} more guests to discover!
      </p>
      <p class="progress-info" v-else>
        You've met all {{ totalGuests }} guests from Lenny's Podcast!
        <Icon class="inline-icon" :icon="radioOn" />
      </p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import trophy from '@iconify/icons-pixelarticons/trophy';
import radioOn from '@iconify/icons-pixelarticons/radio-on';
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  currentLevel: {
    type: Number,
    default: 1
  },
  enemiesDefeated: {
    type: Number,
    default: 10
  },
  questionsAnswered: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  totalGuests: {
    type: Number,
    default: 0
  },
  remainingGuests: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['continue']);

const hasMoreLevels = computed(() => props.remainingGuests > 0);

function handleContinue() {
  emit('continue');
}
</script>

<style scoped>
.level-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
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

.level-complete-modal {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* Celebration Stars */
.celebration-stars {
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
  width: 4px;
  height: 4px;
  background: #ffd700;
  border-radius: 50%;
  box-shadow: 0 0 10px #ffd700;
  animation: starFloat 3s ease-in-out infinite;
}

.star:nth-child(odd) {
  background: #fff;
  box-shadow: 0 0 10px #fff;
}

@keyframes starFloat {
  0%, 100% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
}

.star:nth-child(1) { left: 10%; animation-delay: 0s; }
.star:nth-child(2) { left: 20%; animation-delay: 0.2s; }
.star:nth-child(3) { left: 30%; animation-delay: 0.4s; }
.star:nth-child(4) { left: 40%; animation-delay: 0.6s; }
.star:nth-child(5) { left: 50%; animation-delay: 0.8s; }
.star:nth-child(6) { left: 60%; animation-delay: 1s; }
.star:nth-child(7) { left: 70%; animation-delay: 1.2s; }
.star:nth-child(8) { left: 80%; animation-delay: 1.4s; }
.star:nth-child(9) { left: 90%; animation-delay: 1.6s; }
.star:nth-child(10) { left: 15%; animation-delay: 1.8s; }
.star:nth-child(11) { left: 25%; animation-delay: 0.3s; }
.star:nth-child(12) { left: 35%; animation-delay: 0.5s; }
.star:nth-child(13) { left: 45%; animation-delay: 0.7s; }
.star:nth-child(14) { left: 55%; animation-delay: 0.9s; }
.star:nth-child(15) { left: 65%; animation-delay: 1.1s; }
.star:nth-child(16) { left: 75%; animation-delay: 1.3s; }
.star:nth-child(17) { left: 85%; animation-delay: 1.5s; }
.star:nth-child(18) { left: 95%; animation-delay: 1.7s; }
.star:nth-child(19) { left: 5%; animation-delay: 0.1s; }
.star:nth-child(20) { left: 50%; animation-delay: 1.9s; }

/* Trophy Icon */
.trophy-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  animation: bounce 1s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  color: #FFD700;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: -2px;
}

.inline-icon {
  width: 14px;
  height: 14px;
  margin-left: 6px;
  vertical-align: -2px;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Text Styles */
.level-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 12px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
}

.level-subtitle {
  font-size: 18px;
  margin: 0 0 32px 0;
  opacity: 0.9;
  font-weight: 500;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
  color: #ffd700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
}

/* Level Up Badge */
.level-up-badge {
  position: relative;
  margin: 32px auto;
  width: 140px;
  height: 140px;
}

.badge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.5;
  }
}

.badge-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.level-number {
  font-size: 48px;
  font-weight: 900;
  color: #667eea;
  line-height: 1;
  animation: none;
  transform: rotate(0deg);
}

.level-up-text {
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 1px;
  animation: none;
  transform: rotate(0deg);
}

/* Continue Button */
.continue-button {
  width: 100%;
  padding: 18px 32px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: #f0f0f0;
}

.continue-button:active {
  transform: translateY(0);
}

/* Progress Info */
.progress-info {
  margin-top: 20px;
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .level-complete-modal {
    padding: 32px 24px;
  }

  .level-title {
    font-size: 28px;
  }

  .level-subtitle {
    font-size: 16px;
  }

  .stats-grid {
    gap: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-label {
    font-size: 11px;
  }

  .trophy-icon {
    font-size: 60px;
  }

  .level-up-badge {
    width: 120px;
    height: 120px;
  }

  .badge-glow {
    width: 120px;
    height: 120px;
  }

  .level-number {
    font-size: 40px;
  }

  .level-up-text {
    font-size: 12px;
  }

  .continue-button {
    font-size: 16px;
    padding: 16px 24px;
  }
}
</style>
