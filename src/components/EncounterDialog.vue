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
  "wants to quiz you!",
  "has a question for you!",
  "is ready for a trivia round!",
  "would like to test your knowledge!",
  "is looking for a sparring partner!",
  "waves you over!",
  "spotted you and smiles!",
  "wants to talk product!",
  "is up for a quick challenge!",
  "invites you to a knowledge duel!",
  "wants to compare notes!",
  "has a 3-question challenge!",
  "is eager to share ideas!",
  "is ready to learn together!",
  "wants to see what you know!",
  "is excited to play!",
  "has a quick prompt for you!",
  "would love your take on this!",
  "is hosting a mini quiz!",
  "is curious what you'd choose!",
  "is ready to brainstorm!",
  "brought a fresh perspective!",
  "is ready for a friendly match!",
  "has a new scenario to explore!",
  "is ready to swap strategies!",
  "has a few insights to test!",
  "has a challenge worth sharing!",
  "is ready for round one!",
  "has a short quiz queued up!",
  "is ready to test ideas!",
  "wants your best answer!",
  "is ready to hear your reasoning!",
  "has a question from the podcast!",
  "is ready for a quick round!",
  "would like your opinion!",
  "is ready to explore an idea!"
];

const displayedMessage = ref('');
const isTyping = ref(false);
let typewriterTimeout = null;

// Helper function to get avatar path
function getNpcAvatarPath(guestName) {
  if (guestName.includes('Elena Verna')) {
    return '/assets/elena-front.png';
  }
  // Transform name to match renamed files (spaces to hyphens, special chars removed)
  const safeName = guestName
    .replace(/\s+/g, '-')
    .replace(/[&+,]/g, '-')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ä/g, 'a')
    .replace(/-+/g, '-');
  return `/assets/avatars/${safeName}_pixel_art.png`;
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
  z-index: 800;
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

@keyframes dialogSlideDown {
  from {
    transform: translateX(-50%) translateY(-100px);
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
    width: 64vw;
    max-width: 72vw;
    bottom: 20px;
    left: 65%;
    transform: translateX(-50%);
  }
}

@media (max-width: 800px) {
  .pokemon-textbox {
    padding: 14px 12px 14px 28px;
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

/* Small height devices - landscape phones */
@media (max-height: 600px) and (orientation: landscape) {
  .pokemon-dialog-container {
    bottom: 10px;
    width: 70vw;
    max-width: 70vw;
  }

  .pokemon-textbox {
    padding: 10px 14px;
    border-width: 4px;
  }

  .npc-avatar-small {
    width: 32px;
    height: 32px;
  }

  .name-text {
    font-size: 11px;
  }

  .title-text {
    font-size: 8px;
  }

  .dialog-text {
    font-size: 10px;
    line-height: 1.5;
  }

  .message-content {
    min-height: 40px;
    margin-bottom: 8px;
  }

  .instruction-text {
    font-size: 7px;
  }

  .key-prompt {
    font-size: 6px;
    padding: 2px 4px;
  }

  .continue-arrow {
    font-size: 12px;
  }
}

/* Extra small height devices */
@media (max-height: 500px) and (orientation: landscape) {
  .pokemon-dialog-container {
    bottom: 8px;
    width: 65vw;
  }

  .pokemon-textbox {
    padding: 8px 12px;
    border-width: 3px;
  }

  .npc-avatar-small {
    width: 28px;
    height: 28px;
  }

  .npc-name-header {
    margin-bottom: 8px;
    padding-bottom: 6px;
    gap: 8px;
  }

  .name-text {
    font-size: 10px;
  }

  .title-text {
    font-size: 7px;
  }

  .dialog-text {
    font-size: 9px;
    line-height: 1.4;
  }

  .message-content {
    min-height: 32px;
    margin-bottom: 6px;
  }

  .dialog-footer {
    padding-top: 8px;
  }

  .instruction-text {
    font-size: 6px;
  }

  .key-prompt {
    font-size: 5px;
    padding: 2px 3px;
  }

  .continue-arrow {
    font-size: 10px;
  }

  .textbox-inner-border {
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
  }
}

/* Mobile portrait mode - dialog appears from top */
@media (max-width: 1024px) {
  .pokemon-dialog-container {
    top: 16px;
    bottom: auto;
    left: 16px;
    right: 16px;
    width: auto;
    max-width: none;
    transform: none;
    animation: dialogSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pokemon-textbox {
    padding: 16px 20px;
    border-width: 5px;
  }

  .npc-avatar-small {
    width: 36px;
    height: 36px;
  }

  .name-text {
    font-size: 13px;
  }

  .title-text {
    font-size: 9px;
  }

  .dialog-text {
    font-size: 12px;
    line-height: 1.6;
  }

  .message-content {
    min-height: 50px;
  }

  .instruction-text {
    font-size: 9px;
  }

  .key-prompt {
    font-size: 8px;
    padding: 3px 6px;
  }
}

/* Small mobile screens */
@media (max-width: 480px) {
  .pokemon-dialog-container {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .pokemon-textbox {
    padding: 12px 16px;
    border-width: 4px;
  }

  .npc-avatar-small {
    width: 32px;
    height: 32px;
  }

  .npc-name-header {
    gap: 10px;
  }

  .name-text {
    font-size: 11px;
  }

  .title-text {
    font-size: 8px;
  }

  .dialog-text {
    font-size: 11px;
    line-height: 1.5;
  }

  .message-content {
    min-height: 45px;
  }

  .instruction-text {
    font-size: 8px;
  }

  .key-prompt {
    font-size: 7px;
    padding: 2px 5px;
  }

  .continue-arrow {
    font-size: 13px;
  }
}
</style>
