<template>
  <div v-if="show" class="level-complete-overlay" @click.self="handleContinue">
    <div class="level-complete-modal">
      <div class="level-header">
        <Icon class="trophy-icon" :icon="trophy" />
        <div class="level-header-text">
          <h1 class="level-title">LEVEL UP!</h1>
          <p class="level-subtitle">Map {{ currentLevel }} Unlocked</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-item full">
          <div class="stat-label">New opponents unlocked</div>
          <div class="stat-value small">
            +{{ unlockedOpponents.length }}
          </div>
          <div class="stat-list">
            {{ unlockedOpponentsPreview }}
          </div>
        </div>
        <div class="stat-item full">
          <div class="stat-label">XP per correct answer</div>
          <div class="stat-value">{{ oldXpPerCorrect }} → {{ newXpPerCorrect }}</div>
          <div class="stat-list">Each correct answer now gives more XP.</div>
        </div>
      </div>

      <button class="continue-button" @click="handleContinue">
        <Icon class="btn-icon" :icon="trophy" />
        Continue
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import trophy from '@iconify/icons-pixelarticons/trophy';
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
  oldXpPerCorrect: {
    type: Number,
    default: 10
  },
  newXpPerCorrect: {
    type: Number,
    default: 15
  },
  unlockedOpponents: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['continue']);

const unlockedOpponentsPreview = computed(() => {
  if (!props.unlockedOpponents || props.unlockedOpponents.length === 0) return 'None';
  const names = props.unlockedOpponents.slice(0, 6).join(', ');
  return props.unlockedOpponents.length > 6 ? `${names}…` : names;
});

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
  background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
  border: 6px solid #FFD700;
  border-radius: 18px;
  padding: 32px 28px;
  max-width: 520px;
  width: 90%;
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  color: white;
  text-align: left;
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

/* Header */
.level-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.trophy-icon {
  width: 52px;
  height: 52px;
  color: #FFD700;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.level-header-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  text-shadow: 3px 3px 0 #000;
  letter-spacing: 1px;
  color: #FFD700;
}

.level-subtitle {
  font-size: 12px;
  margin: 0;
  color: #ECF0F1;
  text-shadow: 2px 2px 0 #000;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin: 22px 0 10px;
}

.stat-item {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 12px;
  padding: 16px;
  border: 3px solid rgba(255, 215, 0, 0.35);
  text-align: left;
}

.stat-item.full {
  text-align: left;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 6px;
  color: #ffd700;
}

.stat-value.small {
  font-size: 14px;
}

.stat-label {
  font-size: 9px;
  opacity: 0.9;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-list {
  font-size: 9px;
  color: #fff;
  line-height: 1.4;
  margin-top: 6px;
}

/* Level Up Badge (unused in new layout) */

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
  padding: 14px 18px;
  background: #4CAF50;
  color: #fff;
  border: 4px solid #2E7D32;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Press Start 2P', monospace, sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.continue-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.4);
  background: #45A049;
}

.continue-button:active {
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .level-complete-modal {
    padding: 24px 20px;
  }

  .level-title {
    font-size: 20px;
  }

  .level-subtitle {
    font-size: 10px;
  }

  .stats-grid {
    gap: 10px;
  }

  .stat-value {
    font-size: 16px;
  }

  .stat-label {
    font-size: 9px;
  }

  .stat-list {
    font-size: 8px;
  }

  .trophy-icon {
    width: 44px;
    height: 44px;
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
