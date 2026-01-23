<template>
  <!-- Pokemon-style dialog positioned over game canvas -->
  <div class="pokemon-dialog-container" v-if="isActive">
    <div class="pokemon-textbox">
      <!-- Inner border decoration -->
      <div class="textbox-inner-border"></div>

      <!-- NPC avatar and name header -->
      <div class="npc-name-header">
        <img
          v-if="npcData.name"
          :src="getNpcAvatarPath(npcData.name)"
          :alt="npcData.name"
          class="npc-avatar-small"
        />
        <div class="npc-info">
          <span class="name-text">{{ npcData.name }}</span>
          <span class="title-text" v-if="guestTitle">{{ guestTitle }}</span>
        </div>
      </div>

      <!-- Message content with typewriter effect -->
      <div class="message-content">
        <p class="dialog-text">
          {{ displayedMessage }}
          <span v-if="isTyping" class="typing-cursor">|</span>
        </p>
      </div>

      <!-- Instructions footer -->
      <div class="dialog-footer">
        <div class="instruction-text">
          <span class="key-prompt">SPACE</span> to battle
          <span class="divider">•</span>
          Walk away to cancel
        </div>
        <div class="continue-arrow" v-if="!isTyping">▼</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getGuestTitle } from '../game/GuestTitles.js';

const props = defineProps({
  isActive: Boolean,
  npcData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['accept', 'reject']);

// Get guest title
const guestTitle = computed(() => {
  if (!props.npcData?.name) return '';
  return getGuestTitle(props.npcData.name);
});

// Random encounter messages
const encounterMessages = [
  "wants to battle!",
  "challenges you!",
  "is ready to fight!",
  "would like to battle!",
  "is looking for a trainer!",
  "blocks your way!",
  "spotted you!",
  "wants to test your knowledge!"
];

const displayedMessage = ref('');
const isTyping = ref(false);
let typewriterTimeout = null;

// Helper function to get avatar path
function getNpcAvatarPath(guestName) {
  if (guestName.includes('Elena Verna')) {
    return '/assets/elena-front.png';
  }
  return `/assets/avatars/${guestName}_pixel_art.png`;
}

// Generate random message
function getRandomMessage() {
  const randomMsg = encounterMessages[Math.floor(Math.random() * encounterMessages.length)];
  return `${randomMsg}`;
}

// Typewriter effect
function typeMessage(message) {
  isTyping.value = true;
  displayedMessage.value = '';
  let index = 0;

  function typeChar() {
    if (index < message.length) {
      displayedMessage.value += message[index];
      index++;
      typewriterTimeout = setTimeout(typeChar, 40); // 40ms per character
    } else {
      isTyping.value = false;
    }
  }

  typeChar();
}

// Watch for dialog activation
watch(() => props.isActive, (newVal) => {
  if (newVal) {
    const message = getRandomMessage();
    typeMessage(message);
  } else {
    // Clear typewriter on close
    if (typewriterTimeout) {
      clearTimeout(typewriterTimeout);
    }
    displayedMessage.value = '';
  }
});

// Handle keyboard input
function handleKeyPress(event) {
  if (!props.isActive) return;

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    console.log('EncounterDialog: SPACE/ENTER pressed, accepting battle');
    emit('accept');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  if (typewriterTimeout) {
    clearTimeout(typewriterTimeout);
  }
});
</script>

<style scoped>
/* Pokemon-style dialog positioned inside game canvas */
.pokemon-dialog-container {
  position: fixed;
  bottom: calc(55% - 320px + 20px); /* Position inside game canvas (640px height / 2 = 320px, adjusted for 45% top) */
  left: 50%;
  transform: translateX(-50%);
  width: 880px; /* Match game canvas width minus padding */
  max-width: 880px;
  z-index: 1500;
  animation: dialogSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dialogSlideUp {
  from {
    transform: translateX(-50%) translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

/* Classic Pokemon textbox */
.pokemon-textbox {
  position: relative;
  background: #fff;
  border: 8px solid #000;
  box-shadow:
    inset 0 0 0 4px #e8e8e8,
    0 8px 0 #000,
    0 12px 24px rgba(0, 0, 0, 0.5);
  padding: 20px 28px;
  font-family: 'Press Start 2P', monospace, sans-serif;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Inner decorative border */
.textbox-inner-border {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: 12px;
  border: 2px solid #d0d0d0;
  pointer-events: none;
}

/* NPC name header */
.npc-name-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 3px solid #000;
  display: flex;
  align-items: center;
  gap: 12px;
}

.npc-avatar-small {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  border: 2px solid #000;
  border-radius: 4px;
  background: #f0f0f0;
}

.npc-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name-text {
  font-size: 16px;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.title-text {
  font-size: 10px;
  color: #666;
  font-weight: normal;
  letter-spacing: 0.5px;
}

/* Message content */
.message-content {
  min-height: 60px;
  margin-bottom: 12px;
}

.dialog-text {
  font-size: 14px;
  line-height: 1.8;
  color: #000;
  margin: 0;
  word-wrap: break-word;
}

.typing-cursor {
  display: inline-block;
  animation: cursorBlink 0.5s step-end infinite;
  margin-left: 2px;
}

@keyframes cursorBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Footer with instructions */
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 3px solid #000;
}

.instruction-text {
  font-size: 10px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-prompt {
  display: inline-block;
  padding: 4px 8px;
  background: #000;
  color: #fff;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
}

.divider {
  color: #999;
  font-size: 10px;
}

/* Blinking continue arrow */
.continue-arrow {
  font-size: 16px;
  color: #000;
  animation: arrowBounce 1s ease-in-out infinite;
  font-family: monospace;
}

@keyframes arrowBounce {
  0%, 100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(4px);
    opacity: 0.6;
  }
}

/* Responsive adjustments */
@media (max-width: 1000px) {
  .pokemon-dialog-container {
    width: calc(100% - 40px);
    max-width: none;
  }
}

@media (max-width: 800px) {
  .pokemon-textbox {
    padding: 16px 20px;
    border-width: 6px;
  }

  .name-text {
    font-size: 13px;
  }

  .dialog-text {
    font-size: 12px;
  }

  .instruction-text {
    font-size: 9px;
  }

  .key-prompt {
    font-size: 8px;
    padding: 3px 6px;
  }

  .continue-arrow {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .pokemon-textbox {
    padding: 12px 16px;
    border-width: 5px;
  }

  .name-text {
    font-size: 11px;
  }

  .dialog-text {
    font-size: 10px;
    line-height: 1.6;
  }

  .message-content {
    min-height: 48px;
  }

  .instruction-text {
    font-size: 8px;
    gap: 6px;
  }

  .key-prompt {
    font-size: 7px;
    padding: 2px 5px;
  }
}
</style>
