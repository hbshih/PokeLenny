<template>
  <div v-if="isActive" class="leaderboard-overlay" @click="handleClose">
    <div class="leaderboard-panel" @click.stop>
      <div class="leaderboard-header">
      <h3 class="leaderboard-title">
        <Icon class="title-icon" :icon="trophy" />
        Leaderboard
      </h3>
      <button class="refresh-btn" @click="handleRefresh" :disabled="loading">
        <Icon :class="['refresh-icon', { spinning: loading }]" :icon="loading ? loader : reload" />
      </button>
    </div>

    <div class="leaderboard-content" v-if="!loading">
      <div class="leaderboard-list">
        <div
          v-for="(player, index) in currentPagePlayers"
          :key="player.id"
          class="leaderboard-item"
          :class="{ 'current-player': player.isCurrentPlayer }"
        >
          <div class="rank">
            <span v-if="getRank(index) === 1" class="medal gold">
              <Icon class="medal-icon" :icon="trophy" />
            </span>
            <span v-else-if="getRank(index) === 2" class="medal silver">
              <Icon class="medal-icon" :icon="trophy" />
            </span>
            <span v-else-if="getRank(index) === 3" class="medal bronze">
              <Icon class="medal-icon" :icon="trophy" />
            </span>
            <span v-else class="rank-number">#{{ getRank(index) }}</span>
          </div>
          <div class="player-info">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-stats">
              <span class="stat">Lv.{{ player.level }}</span>
              <span class="stat"><Icon class="stat-icon" :icon="heart" /> {{ player.maxHp }}</span>
              <span class="stat"><Icon class="stat-icon" :icon="users" /> {{ player.captured }}/{{ player.total }}</span>
              <span class="stat"><Icon class="stat-icon" :icon="bullseye" /> {{ player.accuracy }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button
          class="page-btn"
          @click="prevPage"
          :disabled="currentPage === 1"
        >
          <Icon class="page-icon" :icon="arrowLeft" />
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          @click="nextPage"
          :disabled="currentPage === totalPages"
        >
          <Icon class="page-icon" :icon="arrowRight" />
        </button>
      </div>
    </div>

    <div class="loading-state" v-else>
      <div class="loading-spinner">
        <Icon class="loading-icon" :icon="loader" />
      </div>
      <p>Loading leaderboard...</p>
    </div>

    <button class="close-modal-btn" @click="handleClose">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import trophy from '@iconify/icons-pixelarticons/trophy';
import reload from '@iconify/icons-pixelarticons/reload';
import loader from '@iconify/icons-pixelarticons/loader';
import heart from '@iconify/icons-pixelarticons/heart';
import users from '@iconify/icons-pixelarticons/users';
import bullseye from '@iconify/icons-pixelarticons/bullseye';
import arrowLeft from '@iconify/icons-pixelarticons/arrow-left';
import arrowRight from '@iconify/icons-pixelarticons/arrow-right';
import { leaderboardService } from '../services/supabase-leaderboard.js';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  currentPlayer: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'refresh']);

const loading = ref(false);
const currentPage = ref(1);
const playersPerPage = 10;
const leaderboardData = ref([]);

const totalPages = computed(() => Math.ceil(leaderboardData.value.length / playersPerPage));

const currentPagePlayers = computed(() => {
  const start = (currentPage.value - 1) * playersPerPage;
  const end = start + playersPerPage;

  // Map database fields to component fields and mark current player
  return leaderboardData.value.slice(start, end).map(player => ({
    id: player.id,
    name: player.player_name,
    level: player.level,
    maxHp: player.max_hp,
    captured: player.captured,
    total: player.total,
    accuracy: player.accuracy,
    isCurrentPlayer: player.player_name === props.currentPlayer.name
  }));
});

function getRank(index) {
  return (currentPage.value - 1) * playersPerPage + index + 1;
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function handleClose() {
  emit('close');
}

async function fetchLeaderboard() {
  loading.value = true;
  try {
    const data = await leaderboardService.getLeaderboard();
    leaderboardData.value = data;
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    // Keep existing data on error
  } finally {
    loading.value = false;
  }
}

async function handleRefresh() {
  await fetchLeaderboard();
  emit('refresh');
}

// Fetch leaderboard when modal opens
watch(() => props.isActive, (isActive) => {
  if (isActive && leaderboardData.value.length === 0) {
    fetchLeaderboard();
  }
});

onMounted(() => {
  // Fetch on mount if modal is already active
  if (props.isActive) {
    fetchLeaderboard();
  }
});
</script>

<style scoped>
.leaderboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
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

.leaderboard-panel {
  position: relative;
  background: rgba(0, 0, 0, 0.95);
  border: 4px solid #FFD700;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  height: fit-content;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3);
  font-family: 'Press Start 2P', monospace, sans-serif;
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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

.leaderboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.title-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: -2px;
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.medal-icon {
  width: 16px;
  height: 16px;
}

.stat-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  vertical-align: -2px;
}

.page-icon {
  width: 12px;
  height: 12px;
}

.loading-icon {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.leaderboard-title {
  font-size: 12px;
  color: #FFD700;
  margin: 0;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
}

.refresh-btn {
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #FFD700;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #FFD700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.4);
  transform: scale(1.05);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.leaderboard-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.leaderboard-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
}

.leaderboard-list::-webkit-scrollbar {
  width: 8px;
}

.leaderboard-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.leaderboard-list::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.5);
  border-radius: 4px;
}

.leaderboard-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.7);
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.leaderboard-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateX(4px);
}

.leaderboard-item.current-player {
  background: rgba(255, 215, 0, 0.2);
  border-color: #FFD700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

.rank {
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.medal.gold {
  color: #FFD700;
}

.medal.silver {
  color: #C0C0C0;
}

.medal.bronze {
  color: #CD7F32;
}

.rank-number {
  font-size: 10px;
  color: #FFD700;
  font-weight: bold;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 9px;
  color: #fff;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat {
  font-size: 7px;
  color: #aaa;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 2px solid rgba(255, 215, 0, 0.3);
}

.page-btn {
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #FFD700;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 10px;
  color: #FFD700;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace, sans-serif;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.4);
  transform: scale(1.05);
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 8px;
  color: #FFD700;
  min-width: 60px;
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  font-size: 32px;
  margin-bottom: 12px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 8px;
  color: #aaa;
  margin: 0;
}

.close-modal-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 69, 96, 0.2);
  border: 2px solid #ff4560;
  border-radius: 6px;
  color: #ff4560;
  font-size: 18px;
  font-weight: bold;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.close-modal-btn:hover {
  background: rgba(255, 69, 96, 0.4);
  transform: rotate(90deg) scale(1.1);
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .leaderboard-panel {
    width: 95%;
    max-height: 85vh;
    padding: 20px;
  }

  .leaderboard-list {
    max-height: 50vh;
  }
}

@media (max-width: 768px) {
  .leaderboard-title {
    font-size: 10px;
  }

  .player-name {
    font-size: 8px;
  }

  .stat {
    font-size: 6px;
  }
}
</style>
