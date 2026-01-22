<template>
  <div class="collection-screen" v-if="isActive">
    <div class="collection-header">
      <h1 class="collection-title">PokéLenny Collection</h1>
      <p class="collection-progress">
        {{ capturedCount }} / {{ props.collection.length }} Captured
      </p>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="pagination-controls">
      <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">
        ◀ Prev
      </button>
      <span class="page-info">
        Page {{ currentPage }} / {{ totalPages }}
      </span>
      <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">
        Next ▶
      </button>
    </div>

    <div class="collection-grid">
      <div
        v-for="guest in paginatedGuests"
        :key="guest.id"
        class="guest-card"
        :class="{ 'captured': guest.captured, 'uncaptured': !guest.captured }"
        @click="selectGuest(guest)"
      >
        <div class="guest-card-sprite">
          <img
            v-if="guest.captured"
            :src="getGuestAvatarPath(guest.name)"
            :alt="guest.name"
            class="collection-avatar"
          />
          <div v-else class="sprite-silhouette">?</div>
        </div>
        <div class="guest-card-info">
          <p class="guest-card-name">{{ guest.name }}</p>
          <p class="guest-card-number">#{{ guest.id }}</p>
        </div>
      </div>
    </div>

    <div v-if="selectedGuest" class="guest-detail-overlay" @click="closeDetail">
      <div class="guest-detail" @click.stop>
        <button class="detail-close-btn" @click="closeDetail">✕</button>
        <div class="detail-sprite">
          <img
            :src="getGuestAvatarPath(selectedGuest.name)"
            :alt="selectedGuest.name"
            class="detail-avatar"
          />
        </div>
        <h2 class="detail-name">{{ selectedGuest.name }}</h2>
        <p class="detail-number">#{{ selectedGuest.id }}</p>
        <div class="detail-info">
          <div class="detail-row">
            <span class="detail-label">Episode:</span>
            <span class="detail-value">{{ selectedGuest.episode }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Difficulty:</span>
            <span class="detail-value" :class="'difficulty-' + selectedGuest.difficulty.toLowerCase()">
              {{ selectedGuest.difficulty }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isActive: Boolean,
  collection: Array
});

defineEmits(['close']);

const selectedGuest = ref(null);
const currentPage = ref(1);
const itemsPerPage = 18; // 3x6 grid fits nicely on screen

const capturedCount = computed(() => {
  return props.collection.filter(g => g.captured).length;
});

const totalPages = computed(() => {
  return Math.ceil(props.collection.length / itemsPerPage);
});

const paginatedGuests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return props.collection.slice(start, end);
});

// Reset to page 1 when collection screen opens
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    currentPage.value = 1;
  }
});

// Helper function to get avatar path
function getGuestAvatarPath(guestName) {
  // Special case for Elena
  if (guestName.includes('Elena Verna')) {
    return '/assets/elena-front.png';
  }
  return `/assets/avatars/${guestName}_pixel_art.png`;
}

function selectGuest(guest) {
  if (guest.captured) {
    selectedGuest.value = guest;
  }
}

function closeDetail() {
  selectedGuest.value = null;
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
</script>

<style scoped>
.collection-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  font-family: 'Press Start 2P', monospace, sans-serif;
}

.collection-header {
  background: rgba(0, 0, 0, 0.85);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #FFD700;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.collection-title {
  font-size: 24px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #FFD700;
  margin: 0;
  letter-spacing: 1px;
}

.collection-progress {
  font-size: 14px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #FFF;
  margin: 0;
  letter-spacing: 1px;
}

.pagination-controls {
  background: rgba(0, 0, 0, 0.75);
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.page-btn {
  padding: 8px 16px;
  font-size: 11px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  background: #4CAF50;
  color: #FFF;
  border: 3px solid #FFD700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.page-btn:active:not(:disabled) {
  transform: translateY(0);
}

.page-btn:disabled {
  background: #666;
  border-color: #444;
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info {
  font-size: 12px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #FFD700;
  min-width: 140px;
  text-align: center;
}

.close-btn {
  padding: 10px 16px;
  font-size: 18px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-weight: bold;
  background: #F44336;
  color: #FFF;
  border: 3px solid #000;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-btn:hover {
  background: #D32F2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.collection-grid {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  align-content: start;
}

.guest-card {
  background: #FFF;
  border: 3px solid #000;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.guest-card.captured:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  border-color: #FFD700;
}

.guest-card.uncaptured {
  opacity: 0.4;
  cursor: not-allowed;
  background: #DDD;
}

.guest-card-sprite {
  width: 80px;
  height: 80px;
  background: #F0F0F0;
  border: 2px solid #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sprite-silhouette {
  font-size: 40px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #999;
}

.collection-avatar {
  width: 76px;
  height: 76px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.guest-card-info {
  text-align: center;
  width: 100%;
}

.guest-card-name {
  font-size: 11px;
  font-weight: bold;
  margin: 0 0 6px 0;
  color: #000;
  word-wrap: break-word;
  line-height: 1.4;
}

.guest-card-number {
  font-size: 10px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #666;
  margin: 0;
  letter-spacing: 1px;
}

.guest-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.guest-detail {
  background: #FFF;
  border: 3px solid #000;
  border-radius: 12px;
  padding: 32px;
  max-width: 450px;
  width: 100%;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.detail-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 12px;
  font-size: 16px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-weight: bold;
  background: #F44336;
  color: #FFF;
  border: 3px solid #000;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.detail-close-btn:hover {
  background: #D32F2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.detail-sprite {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  background: #F0F0F0;
  border: 3px solid #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-avatar {
  width: 110px;
  height: 110px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.detail-name {
  font-size: 20px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  margin: 0 0 10px 0;
  color: #000;
  letter-spacing: 1px;
}

.detail-number {
  font-size: 14px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #666;
  margin: 0 0 24px 0;
  letter-spacing: 1px;
}

.detail-info {
  text-align: left;
  background: #F0F0F0;
  border: 2px solid #000;
  border-radius: 8px;
  padding: 16px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 11px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: bold;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.detail-value {
  color: #333;
  font-weight: bold;
  text-align: right;
}

.difficulty-easy {
  color: #4CAF50;
}

.difficulty-medium {
  color: #FF9800;
}

.difficulty-hard {
  color: #F44336;
}

@media (max-width: 800px) {
  .collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .collection-title {
    font-size: 18px;
  }

  .collection-progress {
    font-size: 12px;
  }

  .page-info {
    font-size: 10px;
    min-width: 120px;
  }

  .page-btn {
    font-size: 10px;
    padding: 8px 12px;
  }
}

@media (max-width: 600px) {
  .collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    padding: 12px;
  }

  .collection-header {
    padding: 16px;
  }

  .collection-title {
    font-size: 14px;
  }

  .collection-progress {
    font-size: 10px;
  }

  .close-btn {
    font-size: 14px;
    padding: 8px 12px;
  }

  .pagination-controls {
    padding: 10px 16px;
    gap: 12px;
  }

  .page-info {
    font-size: 9px;
    min-width: 100px;
  }

  .page-btn {
    font-size: 9px;
    padding: 6px 10px;
  }

  .guest-card-sprite {
    font-size: 32px;
  }

  .guest-card-name {
    font-size: 9px;
  }

  .guest-card-number {
    font-size: 8px;
  }
}
</style>
