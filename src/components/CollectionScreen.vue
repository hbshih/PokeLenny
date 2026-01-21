<template>
  <div class="collection-screen" v-if="isActive">
    <div class="collection-header">
      <h1 class="collection-title">PokéLenny Collection</h1>
      <p class="collection-progress">
        {{ capturedCount }} / {{ allGuests.length }} Captured
      </p>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="collection-grid">
      <div
        v-for="guest in allGuests"
        :key="guest.id"
        class="guest-card"
        :class="{ 'captured': guest.captured, 'uncaptured': !guest.captured }"
        @click="selectGuest(guest)"
      >
        <div class="guest-card-sprite">
          <div v-if="guest.captured" style="font-size: 40px;">{{ guest.sprite }}</div>
          <div v-else class="sprite-silhouette">?</div>
        </div>
        <div class="guest-card-info">
          <p class="guest-card-name">{{ guest.name }}</p>
          <p class="guest-card-number">#{{ guest.id.padStart(3, '0') }}</p>
        </div>
      </div>
    </div>

    <div v-if="selectedGuest" class="guest-detail-overlay" @click="closeDetail">
      <div class="guest-detail" @click.stop>
        <button class="detail-close-btn" @click="closeDetail">✕</button>
        <div class="detail-sprite">
          <div style="font-size: 64px;">{{ selectedGuest.sprite }}</div>
        </div>
        <h2 class="detail-name">{{ selectedGuest.name }}</h2>
        <p class="detail-number">#{{ selectedGuest.id.padStart(3, '0') }}</p>
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
import { ref, computed } from 'vue';

const props = defineProps({
  isActive: Boolean,
  collection: Array
});

defineEmits(['close']);

const selectedGuest = ref(null);

const capturedCount = computed(() => {
  return props.collection.filter(g => g.captured).length;
});

const allGuests = computed(() => {
  const total = 15;
  const result = [...props.collection];
  for (let i = props.collection.length; i < total; i++) {
    result.push({
      id: String(i + 1),
      name: '???',
      sprite: '?',
      difficulty: '???',
      episode: '???',
      captured: false
    });
  }
  return result;
});

function selectGuest(guest) {
  if (guest.captured) {
    selectedGuest.value = guest;
  }
}

function closeDetail() {
  selectedGuest.value = null;
}
</script>

<style scoped>
.collection-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  font-family: 'Press Start 2P', monospace, sans-serif;
}

.collection-header {
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 4px solid #FFD700;
  flex-wrap: wrap;
  gap: 16px;
}

.collection-title {
  font-size: 24px;
  color: #FFD700;
  margin: 0;
  text-shadow: 3px 3px 0px #000;
}

.collection-progress {
  font-size: 14px;
  color: #fff;
  margin: 0;
}

.close-btn {
  padding: 12px 16px;
  font-size: 20px;
  font-family: inherit;
  background: #F44336;
  color: #fff;
  border: 3px solid #000;
  cursor: pointer;
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
}

.close-btn:hover {
  background: #d32f2f;
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.5);
}

.collection-grid {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  align-content: start;
}

.guest-card {
  background: rgba(255, 255, 255, 0.9);
  border: 4px solid #000;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.guest-card.captured:hover {
  background: #fff;
  transform: translate(-3px, -3px);
  box-shadow: 7px 7px 0px rgba(0, 0, 0, 0.3);
}

.guest-card.uncaptured {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.3);
}

.guest-card-sprite {
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.1);
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.sprite-silhouette {
  font-size: 40px;
  color: #666;
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
}

.guest-card-info {
  text-align: center;
  width: 100%;
}

.guest-card-name {
  font-size: 12px;
  margin: 0 0 8px 0;
  color: #000;
  word-wrap: break-word;
  line-height: 1.4;
}

.guest-card-number {
  font-size: 10px;
  color: #666;
  margin: 0;
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
  background: #fff;
  border: 5px solid #000;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.detail-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 12px;
  font-size: 16px;
  font-family: inherit;
  background: #F44336;
  color: #fff;
  border: 3px solid #000;
  cursor: pointer;
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3);
}

.detail-sprite {
  width: 128px;
  height: 128px;
  margin: 0 auto 20px;
  background: rgba(0, 0, 0, 0.1);
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
}

.detail-name {
  font-size: 24px;
  margin: 0 0 8px 0;
  color: #000;
}

.detail-number {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
}

.detail-info {
  text-align: left;
  background: #f5f5f5;
  border: 3px solid #000;
  padding: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: bold;
  color: #333;
}

.detail-value {
  color: #666;
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
}
</style>
