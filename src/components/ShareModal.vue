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

        <!-- Horizontal Content Grid -->
        <div class="card-content">
          <!-- Left Column: Player & Stats -->
          <div class="left-column">
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
          </div>

          <!-- Right Column: Captured Guests -->
          <div class="right-column">
            <div class="captured-section">
              <h4 class="section-title">Captured Guests ({{ capturedCount }}/{{ totalGuests }})</h4>
              <div class="captured-grid">
                <div
                  v-for="guest in capturedGuests"
                  :key="guest.id"
                  class="guest-card"
                >
                  <div class="guest-sprite">
                    <img
                      :src="getGuestAvatarPath(guest)"
                      :alt="guest.name"
                      @error="handleImageError"
                    />
                  </div>
                  <p class="guest-name">{{ guest.name }}</p>
                </div>
                <div v-if="capturedCount === 0" class="no-captures">
                  No guests captured yet!
                </div>
              </div>
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
        <button class="action-btn linkedin-btn" @click="shareOnLinkedIn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Share on LinkedIn
        </button>
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

function getGuestAvatarPath(guest) {
  if (!guest.name) return '/assets/avatars/default.png';

  // Special case for Elena - use elena-front.png
  if (guest.name.includes('Elena Verna')) {
    return '/assets/elena-front.png';
  }

  // Use the avatar naming convention from the assets folder
  return `/assets/avatars/${guest.name}_pixel_art.png`;
}

function handleImageError(event) {
  // Fallback to a default avatar if image fails to load
  event.target.style.display = 'none';
  event.target.parentElement.textContent = '👤';
}

function closeModal() {
  emit('close');
}

function shareOnLinkedIn() {
  const shareText = `Just played PokéLenny - a fun game where you catch Lenny's Podcast guests and answer trivia!

My Stats:
🎮 Trainer: ${props.playerName}
⭐ Level ${props.stats.level}
🏆 ${props.stats.totalBattles} Battles Won
🎯 ${props.accuracy}% Accuracy
👥 ${props.capturedCount}/${props.totalGuests} Guests Captured

${capturedGuests.value.length > 0 ? 'Captured Guests: ' + capturedGuests.value.slice(0, 5).map(g => g.name).join(', ') + (capturedGuests.value.length > 5 ? '...' : '') : ''}

Check it out and test your knowledge of Lenny's Podcast!

https://pokelenny.com`;

  const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;

  window.open(linkedInUrl, '_blank', 'width=700,height=700');
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
  max-width: 900px;
  width: 95%;
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
  font-family: 'DotGothic16', monospace, sans-serif;
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

/* Horizontal Layout Grid */
.card-content {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  margin-bottom: 20px;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-column {
  display: flex;
  flex-direction: column;
}

.player-section {
  display: flex;
  align-items: center;
  gap: 16px;
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
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 12px;
  color: #FFD700;
  margin: 0 0 12px 0;
  text-align: center;
}

.captured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex: 1;
  align-content: start;
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
  font-family: 'DotGothic16', monospace, sans-serif;
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

.linkedin-btn {
  border-color: #0077b5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.linkedin-btn:hover {
  border-color: #005582;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 119, 181, 0.4);
}

.linkedin-btn svg {
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .card-content {
    grid-template-columns: 1fr;
  }

  .captured-grid {
    grid-template-columns: repeat(3, 1fr);
  }
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
    padding: 10px 8px;
  }

  .linkedin-btn {
    font-size: 8px;
  }

  .modal-actions {
    flex-wrap: wrap;
  }
}
</style>
