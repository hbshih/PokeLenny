<template>
  <div class="collection-screen" v-if="isActive">
    <div class="collection-header">
      <h1 class="collection-title">PokéLenny Collection</h1>
      <p class="collection-progress">
        {{ capturedCount }} / {{ totalGuests }} Captured
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
        v-for="(guest, idx) in paginatedGuests"
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
          <p class="guest-card-number">#{{ indexForGuest(idx) }}</p>
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
        <p class="detail-number">#{{ indexForSelected }}</p>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isActive: Boolean,
  collection: Array,
  totalGuests: Number
});

defineEmits(['close']);

const selectedGuest = ref(null);
const currentPage = ref(1);
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

// Calculate items per page based on viewport
const itemsPerPage = computed(() => {
  // Calculate columns based on screen width
  let cols = 6; // Default for large screens
  if (windowWidth.value <= 600) {
    cols = 3;
  } else if (windowWidth.value <= 800) {
    cols = 4;
  } else if (windowWidth.value <= 1200) {
    cols = 5;
  }
  
  // Calculate rows based on available height
  // Account for header (~100px), pagination (~60px), padding (~48px)
  const availableHeight = windowHeight.value - 160;
  const cardHeight = windowWidth.value <= 600 ? 140 : windowWidth.value <= 800 ? 150 : 160;
  const gap = windowWidth.value <= 600 ? 8 : windowWidth.value <= 800 ? 10 : 12;
  const rows = Math.floor((availableHeight + gap) / (cardHeight + gap));
  
  return Math.max(cols * Math.max(rows, 3), 12); // Minimum 12 items per page
});

const capturedCount = computed(() => {
  return props.collection.filter(g => g.captured).length;
});

const totalGuests = computed(() => {
  return props.totalGuests || props.collection.length;
});

const orderedCollection = computed(() => {
  return props.collection.slice();
});

const totalPages = computed(() => {
  return Math.ceil(orderedCollection.value.length / itemsPerPage.value);
});

const paginatedGuests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return orderedCollection.value.slice(start, end);
});

// Handle window resize
function handleResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Reset to page 1 when collection screen opens
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    currentPage.value = 1;
    handleResize();
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

const indexForGuest = (indexInPage) => {
  const index = (currentPage.value - 1) * itemsPerPage.value + indexInPage + 1;
  return String(index).padStart(3, '0');
};

const indexForSelected = computed(() => {
  if (!selectedGuest.value) {
    return '';
  }
  const index = orderedCollection.value.findIndex(guest => guest.id === selectedGuest.value.id);
  if (index === -1) {
    return '';
  }
  return String(index + 1).padStart(3, '0');
});
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
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  align-content: start;
  justify-items: stretch;
  grid-auto-rows: min-content;
}

.guest-card {
  background: #FFF;
  border: 2px solid #000;
  border-radius: 8px;
  padding: 12px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
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
  width: 100%;
  max-width: 70px;
  height: 70px;
  background: #F0F0F0;
  border: 2px solid #000;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.sprite-silhouette {
  font-size: 40px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #999;
}

.collection-avatar {
  width: 100%;
  height: 100%;
  max-width: 66px;
  max-height: 66px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.guest-card-info {
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.guest-card-name {
  font-size: 9px;
  font-weight: bold;
  margin: 0;
  padding: 0 2px;
  color: #000;
  word-wrap: break-word;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-align: center;
  width: 100%;
  min-height: 20px;
}

.guest-card-number {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  color: #666;
  margin: 0;
  padding: 0 2px;
  letter-spacing: 0.5px;
  min-height: 12px;
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

@media (max-width: 1200px) {
  .collection-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    padding: 18px;
  }
}

@media (max-width: 800px) {
  .collection-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
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

  .guest-card {
    padding: 10px 8px;
    gap: 6px;
  }

  .guest-card-sprite {
    max-width: 60px;
    height: 60px;
    font-size: 28px;
  }

  .collection-avatar {
    max-width: 56px;
    max-height: 56px;
  }

  .guest-card-name {
    font-size: 8px;
  }

  .guest-card-number {
    font-size: 7px;
  }
}

@media (max-width: 600px) {
  .collection-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 14px;
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

  .guest-card {
    padding: 10px 6px;
    gap: 6px;
  }

  .guest-card-sprite {
    max-width: 50px;
    height: 50px;
    font-size: 24px;
  }

  .collection-avatar {
    max-width: 46px;
    max-height: 46px;
  }

  .guest-card-name {
    font-size: 7px;
    -webkit-line-clamp: 2;
  }

  .guest-card-number {
    font-size: 6px;
  }
}

/* Small height devices - landscape phones */
@media (max-height: 600px) and (orientation: landscape) {
  .collection-header {
    padding: 8px 12px;
  }

  .collection-title {
    font-size: 12px;
  }

  .collection-progress {
    font-size: 9px;
  }

  .close-btn {
    font-size: 12px;
    padding: 6px 10px;
  }

  .pagination-controls {
    padding: 6px 12px;
  }

  .page-info {
    font-size: 8px;
    min-width: 90px;
  }

  .page-btn {
    font-size: 7px;
    padding: 5px 8px;
  }

  .collection-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
    padding: 12px;
  }

  .guest-card {
    padding: 8px 6px;
    gap: 5px;
  }

  .guest-card-sprite {
    max-width: 45px;
    height: 45px;
    font-size: 20px;
  }

  .collection-avatar {
    max-width: 41px;
    max-height: 41px;
  }

  .guest-card-name {
    font-size: 6px;
    -webkit-line-clamp: 2;
    line-height: 1.2;
  }

  .guest-card-number {
    font-size: 5px;
  }

  .guest-detail {
    padding: 20px;
    max-width: 350px;
  }

  .detail-sprite {
    width: 90px;
    height: 90px;
    margin-bottom: 12px;
  }

  .detail-avatar {
    width: 80px;
    height: 80px;
  }

  .detail-name {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .detail-number {
    font-size: 10px;
    margin-bottom: 16px;
  }

  .detail-row {
    font-size: 9px;
    margin-bottom: 8px;
  }
}

/* Extra small height devices */
@media (max-height: 500px) and (orientation: landscape) {
  .collection-header {
    padding: 6px 10px;
  }

  .collection-title {
    font-size: 10px;
  }

  .collection-progress {
    font-size: 7px;
  }

  .close-btn {
    font-size: 10px;
    padding: 5px 8px;
  }

  .pagination-controls {
    padding: 4px 10px;
  }

  .page-info {
    font-size: 7px;
    min-width: 80px;
  }

  .page-btn {
    font-size: 6px;
    padding: 4px 6px;
  }

  .collection-grid {
    grid-template-columns: repeat(10, 1fr);
    gap: 6px;
    padding: 10px;
  }

  .guest-card {
    padding: 6px 4px;
    gap: 4px;
  }

  .guest-card-sprite {
    max-width: 35px;
    height: 35px;
    font-size: 16px;
  }

  .collection-avatar {
    max-width: 31px;
    max-height: 31px;
  }

  .guest-card-name {
    font-size: 5px;
    -webkit-line-clamp: 2;
    line-height: 1.1;
  }

  .guest-card-number {
    font-size: 4px;
  }

  .guest-detail {
    padding: 16px;
    max-width: 300px;
  }

  .detail-close-btn {
    top: 10px;
    right: 10px;
    padding: 6px 8px;
    font-size: 12px;
  }

  .detail-sprite {
    width: 70px;
    height: 70px;
    margin-bottom: 10px;
  }

  .detail-avatar {
    width: 60px;
    height: 60px;
  }

  .detail-name {
    font-size: 12px;
    margin-bottom: 5px;
  }

  .detail-number {
    font-size: 9px;
    margin-bottom: 12px;
  }

  .detail-info {
    padding: 12px;
  }

  .detail-row {
    font-size: 8px;
    margin-bottom: 6px;
  }
}
</style>
