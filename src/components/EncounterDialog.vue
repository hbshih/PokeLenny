<template>
  <div class="encounter-overlay" v-if="isActive" @click="handleReject">
    <div class="encounter-dialog" @click.stop>
      <div class="npc-avatar">
        <img
          v-if="npcData.id === '1'"
          src="/assets/elena-front.png"
          alt="NPC"
          class="npc-image"
        />
        <span v-else class="npc-emoji">{{ npcData.sprite || '👤' }}</span>
      </div>

      <div class="encounter-content">
        <h2 class="npc-name">{{ npcData.name }}</h2>
        <p class="encounter-message">
          {{ npcData.name }} wants to battle!
        </p>
        <p class="encounter-subtitle">
          Test your knowledge about {{ npcData.episode || 'their expertise' }}
        </p>
      </div>

      <div class="encounter-actions">
        <button class="accept-btn" @click="handleAccept">
          <span class="btn-icon">⚔️</span>
          Accept Battle
        </button>
        <button class="reject-btn" @click="handleReject">
          <span class="btn-icon">🏃</span>
          Walk Away
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isActive: Boolean,
  npcData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['accept', 'reject']);

function handleAccept() {
  emit('accept');
}

function handleReject() {
  emit('reject');
}
</script>

<style scoped>
.encounter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.encounter-dialog {
  background: #FFF;
  border: 6px solid #000;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  font-family: 'Press Start 2P', monospace, sans-serif;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.npc-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 4px solid #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.npc-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.npc-emoji {
  font-size: 64px;
}

.encounter-content {
  text-align: center;
  margin-bottom: 24px;
}

.npc-name {
  font-size: 20px;
  margin: 0 0 16px 0;
  color: #000;
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
}

.encounter-message {
  font-size: 14px;
  margin: 0 0 12px 0;
  color: #333;
  line-height: 1.6;
}

.encounter-subtitle {
  font-size: 10px;
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.encounter-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.accept-btn,
.reject-btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 14px;
  font-family: inherit;
  font-weight: bold;
  border: 4px solid #000;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.accept-btn {
  background: linear-gradient(180deg, #4CAF50 0%, #45a049 100%);
  color: #FFF;
}

.accept-btn:hover {
  background: linear-gradient(180deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.reject-btn {
  background: linear-gradient(180deg, #999 0%, #777 100%);
  color: #FFF;
}

.reject-btn:hover {
  background: linear-gradient(180deg, #888 0%, #666 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.accept-btn:active,
.reject-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 16px;
}

@media (max-width: 800px) {
  .encounter-dialog {
    padding: 24px;
  }

  .npc-name {
    font-size: 16px;
  }

  .encounter-message {
    font-size: 12px;
  }

  .encounter-subtitle {
    font-size: 9px;
  }

  .accept-btn,
  .reject-btn {
    padding: 14px 20px;
    font-size: 12px;
  }
}
</style>
