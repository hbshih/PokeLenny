<template>
  <div v-if="isActive" class="leaderboard-overlay" @click="handleClose">
    <div class="leaderboard-panel" @click.stop>
      <div class="leaderboard-header">
        <h3 class="leaderboard-title">
          <Icon class="title-icon" :icon="trophy" />
          Hall of Fame
        </h3>
        <button class="close-modal-btn" @click="handleClose">✕</button>
      </div>

    <div class="leaderboard-content" v-if="!loading">
      <div class="leaderboard-list">
        <div
          v-for="(player, index) in currentPagePlayers"
          :key="player.id"
          class="leaderboard-item"
          :class="[
            getRankTier(getRank(index)),
            { 'current-player': player.isCurrentPlayer }
          ]"
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
            <span v-else class="rank-badge" :class="getRankTier(getRank(index))">
              #{{ getRank(index) }}
            </span>
          </div>
          <div class="player-info">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-stats">
              <span class="stat stat-level">Lv.{{ player.level }}</span>
              <span class="stat stat-xp"><Icon class="stat-icon" :icon="zap" /> XP {{ player.xp }}</span>
              <span class="stat stat-caught"><Icon class="stat-icon" :icon="users" /> {{ player.captured }}/{{ player.total }}</span>
              <span class="stat stat-correct"><Icon class="stat-icon" :icon="check" /> {{ player.correct }}</span>
              <span class="stat stat-wrong"><Icon class="stat-icon" :icon="close" /> {{ player.wrong }}</span>
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
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-num-btn"
            :class="{ active: currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button
          class="page-btn"
          @click="nextPage"
          :disabled="currentPage === totalPages"
        >
          <Icon class="page-icon" :icon="arrowRight" />
        </button>
      </div>

      <button class="refresh-btn" @click="handleRefresh" :disabled="loading">
        <Icon :class="['refresh-icon', { spinning: loading }]" :icon="loading ? loader : reload" />
        Refresh
      </button>
    </div>

    <div class="loading-state" v-else>
      <div class="loading-spinner">
        <Icon class="loading-icon" :icon="loader" />
      </div>
      <p>Loading leaderboard...</p>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import trophy from '@iconify/icons-pixelarticons/trophy';
import reload from '@iconify/icons-pixelarticons/reload';
import loader from '@iconify/icons-pixelarticons/loader';
import zap from '@iconify/icons-pixelarticons/zap';
import users from '@iconify/icons-pixelarticons/users';
import check from '@iconify/icons-pixelarticons/check';
import close from '@iconify/icons-pixelarticons/close';
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
    xp: player.xp ?? 0,
    captured: player.captured,
    total: player.total,
    correct: player.correct ?? 0,
    wrong: player.wrong ?? 0,
    isCurrentPlayer: player.player_name === props.currentPlayer.name
  }));
});

function getRank(index) {
  return (currentPage.value - 1) * playersPerPage + index + 1;
}

function getRankTier(rank) {
  if (rank <= 3) return 'tier-gold';
  if (rank <= 10) return 'tier-blue';
  if (rank <= 20) return 'tier-green';
  if (rank <= 30) return 'tier-purple';
  if (rank <= 40) return 'tier-red';
  return 'tier-orange';
}

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      for (let i = current - 2; i <= current + 2; i++) {
        pages.push(i);
      }
    }
  }

  return pages;
});

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
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
  max-width: 520px;
  height: fit-content;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  font-family: 'Press Start 2P', monospace, sans-serif;
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

.leaderboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid #FFD700;
}

.title-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: -2px;
}

.refresh-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
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

.close-modal-btn {
  background: #F44336;
  border: 3px solid #000;
  border-radius: 8px;
  color: #FFF;
  font-size: 16px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-modal-btn:hover {
  background: #D32F2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
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

/* Tier color definitions */
.leaderboard-item.tier-gold {
  --tier-color: #FFD700;
}

.leaderboard-item.tier-blue {
  --tier-color: #4A90E2;
}

.leaderboard-item.tier-green {
  --tier-color: #50C878;
}

.leaderboard-item.tier-purple {
  --tier-color: #9B59B6;
}

.leaderboard-item.tier-red {
  --tier-color: #E74C3C;
}

.leaderboard-item.tier-orange {
  --tier-color: #FF8C42;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 3px solid var(--tier-color, #FFD700);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.leaderboard-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.leaderboard-item.current-player {
  background: rgba(255, 215, 0, 0.15);
  border-width: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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

.rank-badge {
  font-size: 10px;
  color: var(--tier-color);
  font-weight: bold;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--tier-color);
  border-radius: 6px;
  display: inline-block;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  font-size: 11px;
  color: #fff;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: bold;
}

.current-player .player-name {
  color: #FFD700;
}

.player-stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.stat {
  font-size: 7px;
  color: #aaa;
  background: rgba(0, 0, 0, 0.4);
  padding: 3px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-height: 20px;
}

.stat-level {
  border-color: #FFD700;
  color: #FFD700;
}

.stat-caught {
  border-color: #4A90E2;
  color: #4A90E2;
}

.stat-xp {
  border-color: #f5a623;
  color: #f5a623;
}

.stat-correct {
  border-color: #50C878;
  color: #50C878;
}

.stat-wrong {
  border-color: #e74c3c;
  color: #e74c3c;
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
  background: #4CAF50;
  border: 3px solid #FFD700;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 10px;
  color: #FFF;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace, sans-serif;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.page-btn:disabled {
  background: #666;
  border-color: #444;
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-num-btn {
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 8px;
  color: #aaa;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace, sans-serif;
  transition: all 0.2s ease;
  min-width: 32px;
  text-align: center;
}

.page-num-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

.page-num-btn.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #FFD700;
  color: #FFD700;
  font-weight: bold;
}

.refresh-btn {
  margin-top: 12px;
  width: 100%;
  background: #4CAF50;
  border: 3px solid #FFD700;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 9px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #FFF;
  font-family: 'Press Start 2P', monospace, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  margin-bottom: 12px;
}

.loading-state p {
  font-size: 8px;
  color: #aaa;
  margin: 0;
}

/* Scrollbar styling */
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
