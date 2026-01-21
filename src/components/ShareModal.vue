<template>
  <div v-if="isActive" class="share-modal-overlay" @click="closeModal">
    <div class="share-modal" @click.stop>
      <button class="close-btn" @click="closeModal">×</button>

      <div class="share-card">
        <!-- Header -->
        <div class="card-header">
          <h2 class="card-title">PokéLenny</h2>
          <p class="card-subtitle">Trainer Card</p>
        </div>

        <!-- Player Info -->
        <div class="player-section">
          <div class="player-avatar">{{ playerName.charAt(0).toUpperCase() }}</div>
          <div class="player-info">
            <h3 class="player-name">{{ playerName }}</h3>
            <p class="player-level">Level {{ stats.level }} Trainer</p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💚</div>
            <div class="stat-label">HP</div>
            <div class="stat-value">{{ stats.hp }}/{{ stats.maxHp }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-label">XP</div>
            <div class="stat-value">{{ stats.xp }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">{{ accuracy }}%</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-label">Battles</div>
            <div class="stat-value">{{ stats.totalBattles }}</div>
          </div>
        </div>

        <!-- Answer Stats -->
        <div class="answer-stats">
          <div class="answer-stat correct">
            <span class="answer-icon">✅</span>
            <span class="answer-count">{{ stats.rightAnswers }}</span>
            <span class="answer-label">Correct</span>
          </div>
          <div class="answer-stat incorrect">
            <span class="answer-icon">❌</span>
            <span class="answer-count">{{ stats.wrongAnswers }}</span>
            <span class="answer-label">Wrong</span>
          </div>
        </div>

        <!-- Captured Guests -->
        <div class="captured-section">
          <h4 class="section-title">Captured Guests ({{ capturedCount }}/{{ totalGuests }})</h4>
          <div class="captured-grid">
            <div
              v-for="guest in capturedGuests"
              :key="guest.id"
              class="guest-card"
            >
              <div class="guest-sprite">
                <img v-if="guest.id === '1'" src="/assets/elena-front.png" alt="Guest" />
                <span v-else>{{ guest.sprite }}</span>
              </div>
              <p class="guest-name">{{ guest.name }}</p>
            </div>
            <div v-if="capturedCount === 0" class="no-captures">
              No guests captured yet!
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <p class="footer-text">Play PokéLenny at pokelenny.com</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="modal-actions">
        <button class="action-btn share-btn" @click="shareCard">
          📤 Share
        </button>
        <button class="action-btn copy-btn" @click="copyStats">
          📋 Copy Stats
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isActive: Boolean,
  playerName: String,
  stats: Object,
  collection: Array,
  capturedCount: Number,
  totalGuests: Number,
  accuracy: Number
});

const emit = defineEmits(['close']);

const capturedGuests = computed(() => {
  return props.collection.filter(g => g.captured);
});

function closeModal() {
  emit('close');
}

function shareCard() {
  const shareText = `🎮 PokéLenny Trainer Card 🎮

👤 Trainer: ${props.playerName}
⭐ Level: ${props.stats.level}
💚 HP: ${props.stats.hp}/${props.stats.maxHp}

📊 Stats:
🏆 Battles Won: ${props.stats.totalBattles}
🎯 Accuracy: ${props.accuracy}%
✅ Correct Answers: ${props.stats.rightAnswers}
❌ Wrong Answers: ${props.stats.wrongAnswers}
👥 Guests Captured: ${props.capturedCount}/${props.totalGuests}

${capturedGuests.value.length > 0 ? '🌟 Captured Guests:\n' + capturedGuests.value.map(g => `  • ${g.name}`).join('\n') : ''}

Play PokéLenny and catch your favorite Lenny's Podcast guests!`;

  if (navigator.share) {
    navigator.share({
      title: `${props.playerName}'s PokéLenny Stats`,
      text: shareText
    }).catch(() => {
      copyToClipboard(shareText);
    });
  } else {
    copyToClipboard(shareText);
  }
}

function copyStats() {
  const statsText = `🎮 ${props.playerName}'s PokéLenny Stats 🎮\n\nLevel ${props.stats.level} • ${props.capturedCount}/${props.totalGuests} Captured • ${props.accuracy}% Accuracy`;
  copyToClipboard(statsText);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Stats copied to clipboard! 📋');
  }).catch(() => {
    alert(text);
  });
}
</script>

<style scoped>
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.share-modal {
  position: relative;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #fff;
  color: #fff;
  font-size: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.share-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 4px solid #FFD700;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: 'Press Start 2P', monospace, sans-serif;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 3px solid rgba(255, 215, 0, 0.3);
}

.card-title {
  font-size: 28px;
  color: #FFD700;
  margin: 0 0 8px 0;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
}

.card-subtitle {
  font-size: 12px;
  color: #fff;
  margin: 0;
  opacity: 0.9;
}

.player-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 12px;
}

.player-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #000;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 18px;
  color: #FFD700;
  margin: 0 0 6px 0;
}

.player-level {
  font-size: 10px;
  color: #fff;
  margin: 0;
  opacity: 0.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 8px;
  color: #FFD700;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.stat-value {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.answer-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.answer-stat {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.answer-stat.correct {
  border-color: rgba(74, 222, 128, 0.5);
}

.answer-stat.incorrect {
  border-color: rgba(248, 113, 113, 0.5);
}

.answer-icon {
  display: block;
  font-size: 24px;
  margin-bottom: 6px;
}

.answer-count {
  display: block;
  font-size: 20px;
  color: #fff;
  margin-bottom: 4px;
}

.answer-label {
  display: block;
  font-size: 8px;
  color: #fff;
  opacity: 0.8;
}

.captured-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  color: #FFD700;
  margin: 0 0 12px 0;
  text-align: center;
}

.captured-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.guest-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.guest-sprite {
  width: 50px;
  height: 50px;
  margin: 0 auto 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guest-sprite img {
  max-width: 100%;
  max-height: 100%;
}

.guest-sprite span {
  font-size: 32px;
}

.guest-name {
  font-size: 7px;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.no-captures {
  grid-column: 1 / -1;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  padding: 20px;
}

.card-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 3px solid rgba(255, 215, 0, 0.3);
}

.footer-text {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  flex: 1;
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 11px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border: 3px solid #FFD700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);
  background: rgba(20, 20, 20, 0.9);
}

.action-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

.share-btn {
  border-color: #a78bfa;
}

.share-btn:hover {
  border-color: #8b5cf6;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 20px rgba(167, 139, 250, 0.4);
}

.copy-btn {
  border-color: #60a5fa;
}

.copy-btn:hover {
  border-color: #3b82f6;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 20px rgba(96, 165, 250, 0.4);
}

@media (max-width: 600px) {
  .share-card {
    padding: 16px;
  }

  .card-title {
    font-size: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .captured-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-btn {
    font-size: 9px;
    padding: 12px;
  }
}
</style>
