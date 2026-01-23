# PokéLenny - Project Handoff Documentation

## Project Overview

**PokéLenny** is a Pokemon-style RPG game featuring guests from Lenny's Podcast. Players navigate an overworld, encounter podcast guests, and battle them by answering trivia questions about their episodes. The game features a complete progression system with leveling, guest collection, leaderboards, and social sharing.

**Tech Stack:**
- **Game Engine:** Phaser 3
- **Frontend Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **Styling:** CSS with custom animations
- **Backend Ready:** Firebase integration prepared (MCP tools available)

**Game Version:** v1.1
**Last Updated:** January 23, 2026

---

## Quick Start for New Developers

```bash
# 1. Navigate to project
cd /Users/benmiro/Documents/PokeLenny/pokelenny-phaser

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser to http://localhost:5173
# 5. Enter a name and start playing!
```

**First Files to Review:**
1. `src/App.vue` - Central game state management
2. `src/game/scenes/Overworld.js` - Main gameplay scene
3. `src/components/BattleScreen.vue` - Battle UI and logic
4. `src/game/GuestData.js` - Guest data management
5. `public/assets/guest_data.json` - All guest data and questions

---

## Project Structure

```
pokelenny-phaser/
├── public/
│   ├── assets/
│   │   ├── main-front.png              # Player character (front)
│   │   ├── main-back.png               # Player character (back)
│   │   ├── main-left.png               # Player character (left)
│   │   ├── main-right.png              # Player character (right)
│   │   ├── elena-front.png             # Elena Verna sprite
│   │   ├── elena-side.png              # Elena Verna sprite
│   │   ├── avatars/                    # Guest avatar images
│   │   │   └── [GuestName]_pixel_art.png
│   │   ├── tuxemon-town.json           # Tilemap data
│   │   ├── tuxmon-sample-32px-extruded.png  # Tileset
│   │   ├── guest_data.json             # All guest info & questions
│   │   ├── bg.png                      # Background image
│   │   ├── logo.png                    # Game logo
│   │   ├── star.png                    # Star decoration
│   │   ├── overworld-music.mp3         # Main game music
│   │   ├── battle-music.mp3            # Battle music
│   │   └── victory-fanfare.mp3         # Victory sound
│   └── favicon.png                     # Site favicon
│
├── src/
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── Boot.js                 # Initial boot scene
│   │   │   ├── Preloader.js            # Asset loading scene
│   │   │   ├── MainMenu.js             # Start screen
│   │   │   └── Overworld.js            # Main gameplay scene
│   │   ├── EventBus.js                 # Phaser ↔ Vue communication
│   │   ├── GameState.js                # Global game state
│   │   ├── GuestData.js                # Guest data manager
│   │   └── main.js                     # Phaser configuration
│   │
│   ├── components/
│   │   ├── BattleScreen.vue            # Quiz battle interface
│   │   ├── BattleResult.vue            # Battle end screen
│   │   ├── CollectionScreen.vue        # Guest collection UI
│   │   ├── EncounterDialog.vue         # Pre-battle dialog
│   │   ├── GameOver.vue                # Game over modal
│   │   ├── LeaderboardPanel.vue        # Leaderboard modal
│   │   ├── ShareModal.vue              # Stats sharing modal
│   │   └── TutorialModal.vue           # First-time tutorial
│   │
│   ├── lib/
│   │   └── supabase.js                 # Supabase client config
│   │
│   ├── services/
│   │   ├── supabase-leaderboard.js     # Leaderboard API (Supabase)
│   │   └── leaderboard.js              # LocalStorage fallback (optional)
│   │
│   ├── App.vue                         # Main Vue application
│   ├── PhaserGame.vue                  # Phaser game container
│   └── main.js                         # Vue app entry point
│
├── package.json
├── vite.config.js
├── .env                                # Environment variables (gitignored)
├── .env.example                        # Template for contributors
├── .gitignore                          # Git ignore rules
├── HANDOFF.md                          # This file
├── SUPABASE_SETUP.md                   # Supabase setup guide
└── README.md
```

---

## Complete Game Flow

### 1. **Boot & Preloading** (Boot.js → Preloader.js)
- Initialize Phaser game engine
- Load all assets (sprites, tilemaps, audio, guest data)
- Parse guest_data.json and load guest avatars dynamically
- Transition to MainMenu

### 2. **Main Menu** (MainMenu.js)
- Player enters their name (HTML input overlay)
- Name validation and storage
- Character sprite preview
- Start button transitions to Overworld

### 3. **First-Time Tutorial** (TutorialModal.vue)
- Shows automatically after name entry (first play only)
- 4-step instruction guide:
  1. Explore the world (WASD/Arrow keys)
  2. Battle & Answer trivia
  3. Level up & progress
  4. Build your collection
- Stored in localStorage to prevent repeat display

### 4. **Overworld Exploration** (Overworld.js)
- Tile-based grid movement (32x32 tiles)
- Player name displays below character
- Minimap in bottom-right corner
- 50 podcast guest NPCs dynamically spawned
- Proximity detection for encounters

### 5. **Encounter Dialog** (EncounterDialog.vue)
- Pokemon-style textbox appears when near NPC
- Typewriter effect with random encounter messages
- SPACE to accept battle
- Walk away to decline

### 6. **Battle System** (BattleScreen.vue)
- Transition animation (1.5s swirl effect)
- 5 multiple-choice trivia questions
- HP bars for player and guest
- Correct answer: +10 XP, -20 guest HP
- Wrong answer: -10 player HP, -20 guest HP
- Battle ends at 0 HP or 5 questions

### 7. **Battle Result** (BattleResult.vue)
- **Victory:** Star burst animation, trophy, XP award
- **Defeat:** Broken heart, game over possibility
- Guest captured on victory
- Returns to overworld

### 8. **Level Progression**
- XP requirements scale exponentially
- Level up rewards: +20 Max HP, full HP restore
- New level spawns next batch of 10 NPCs
- Higher level guests = harder questions

### 9. **Game Over** (GameOver.vue)
- Triggered when player HP reaches 0
- Shows final stats
- Options: Restart game or Return to menu

### 10. **Collection & Sharing**
- **Collection Screen:** View all captured guests (grid layout)
- **Leaderboard:** Top 50 players with pagination
- **Share Modal:** Horizontal trainer card for social sharing

---

## Core Systems

### Guest Data Management (GuestData.js)

**Purpose:** Central manager for all guest data, questions, and avatar loading

**Key Features:**
- Loads `guest_data.json` containing 50 guests
- Dynamically loads guest avatar images
- Provides questions filtered by difficulty
- Tracks guest capture status

**API:**
```javascript
// Get all selected guests (50 guests from JSON)
const guests = guestDataManager.getSelectedGuests();

// Get questions for a specific guest
const questions = guestDataManager.getQuestionsForGuest(guestId);

// Get guest by ID
const guest = guestDataManager.getGuestById(guestId);

// Check if loaded
const isReady = guestDataManager.isLoaded();
```

**Guest Data Structure:**
```javascript
{
  "id": "elena_verna",
  "name": "Elena Verna",
  "episode": "Growth Strategy Master",
  "difficulty": "Medium",
  "avatarKey": "elena_verna_avatar",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "prompt": "What is Elena's top retention tip?",
      "choices": ["A", "B", "C", "D"],
      "correctAnswer": 2,
      "explanation": "Elena emphasizes..."
    }
  ]
}
```

---

### Dynamic NPC Spawning System

**Location:** `Overworld.js` lines 351-481

**How It Works:**
1. Game starts with Level 1, spawns first 10 guests
2. Player captures guests through battles
3. On level up, `spawn-next-level` event triggers
4. Next 10 guests spawn at random valid positions
5. Continues until all 50 guests are spawned

**Spawning Algorithm:**
- Validates tile is walkable (no collision)
- Checks minimum spacing from other NPCs (2 tiles)
- First guest (Elena) spawns near player starting position
- Others spawn randomly across the map
- Maximum 1000 attempts per NPC to find valid position

**Code:**
```javascript
// Listen for level up
EventBus.on('spawn-next-level', (data) => {
  this.currentLevel = data.level;
  this.clearAllNPCs();
  this.spawnNPCsForLevel(data.enemiesCount);
});

// Spawn NPCs
spawnNPCsForLevel(count) {
  const selectedGuests = guestDataManager.getSelectedGuests();
  const startIndex = this.spawnedGuestIndices.length;
  const guestsToSpawn = selectedGuests.slice(startIndex, startIndex + count);
  // Position and create NPC sprites...
}
```

---

### Audio System

**Location:** `Overworld.js` (lines 138-291)

**Audio Files:**
- `overworld-music.mp3` - Main exploration theme (loops)
- `battle-music.mp3` - Battle background music (loops)
- `victory-fanfare.mp3` - Victory celebration (one-shot)

**Audio Flow:**
1. **Overworld:** Plays looping overworld music
2. **Battle Start:** Pauses overworld, plays battle music
3. **Battle Victory:** Stops battle music, plays victory fanfare
4. **Battle End:** Resumes overworld music
5. **Mute Control:** Global mute toggle in App.vue

**Events:**
```javascript
// Vue → Phaser
EventBus.on('play-battle-music', ...)
EventBus.on('stop-battle-music', ...)
EventBus.on('play-victory-sound', ...)
EventBus.on('toggle-mute', (isMuted) => ...)
```

**Mute State:**
- Persisted in localStorage (`pokelenny-mute-state`)
- Applied on boot
- Button in action buttons bar

---

### Level & XP System

**Location:** `App.vue` (lines 90-175)

**XP Awards:**
- Correct answer: +10 XP
- Wrong answer: 0 XP
- Battle victory (guest captured): +50 XP

**Level Formula:**
```javascript
const getXPForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// XP Requirements:
// Level 1 → 2: 100 XP
// Level 2 → 3: 150 XP
// Level 3 → 4: 225 XP
// Level 4 → 5: 337 XP
// Level 5 → 6: 506 XP
```

**Level Up Process:**
```javascript
function levelUp() {
  playerStats.level++;
  playerStats.maxHp += 20;
  playerStats.hp = playerStats.maxHp; // Full restore

  // Calculate new enemies to spawn
  const enemiesForLevel = Math.min(10, totalGuests - capturedGuests);

  // Emit event to spawn next batch
  EventBus.emit('spawn-next-level', {
    level: playerStats.level,
    enemiesCount: enemiesForLevel
  });

  // Show level up notification
  alert(`Level Up! You are now Level ${playerStats.level}\n...`);
}
```

**HP System:**
- Starting HP: 100
- Starting Max HP: 100
- Wrong answer penalty: -10 HP
- Level up: +20 Max HP
- HP <= 0 triggers Game Over

---

### Player Stats UI

**Location:** `App.vue` (lines 495-511)

**Stats Bar Components:**
```html
<!-- Level & XP Progress -->
<div class="stat-item level-stat">
  <div class="stat-label">Level</div>
  <div class="stat-value">{{ playerStats.level }}</div>
  <div class="xp-bar">
    <div class="xp-fill" :style="{ width: xpPercentage + '%' }"></div>
  </div>
  <div class="xp-text">{{ playerStats.xp }} / {{ xpForNextLevel }} XP</div>
</div>

<!-- HP Bar -->
<div class="stat-item hp-stat">
  <div class="stat-label">HP</div>
  <div class="hp-bar">
    <div class="hp-fill" :style="{ width: hpPercentage + '%' }"></div>
  </div>
  <div class="hp-text">{{ playerStats.hp }} / {{ playerStats.maxHp }}</div>
</div>

<!-- Captured Count -->
<div class="stat-item captured-stat">
  <div class="stat-label">Captured</div>
  <div class="stat-value">{{ capturedCount }} / {{ totalGuests }}</div>
</div>
```

**Action Buttons:**
- 📚 Collection - Opens collection screen
- 🏆 Leaderboard - Opens leaderboard modal
- 📤 Share Stats - Opens share modal
- 🔊/🔇 Mute - Toggles audio

---

### Tutorial System (TutorialModal.vue)

**Trigger:** First play after name entry

**Storage:** `localStorage.getItem('pokelenny-tutorial-seen')`

**Content:**
1. **Explore the World** - Movement controls
2. **Battle & Answer** - Combat mechanics
3. **Level Up & Progress** - XP system explanation
4. **Build Your Collection** - Collection screen (C key)

**Design:**
- Full-screen overlay with purple gradient background
- Gold border and Press Start 2P font
- Animated bounce icon
- Click anywhere to dismiss
- "Let's Go!" button

---

### Leaderboard System (LeaderboardPanel.vue)

**Access:** Button click from action buttons

**Backend:** Supabase (PostgreSQL with Row Level Security)

**Features:**
- ✅ **Global real-time leaderboard** - All players worldwide
- ✅ **Secure & open source safe** - RLS policies protect data
- Modal overlay design
- Top 50 players with pagination (10 per page)
- Medal icons for top 3 (🥇🥈🥉)
- Player stats display:
  - Level
  - Max HP
  - Captured/Total guests
  - Accuracy percentage
- Refresh button (fetches latest data)
- Current player highlighting
- Close button (✕)
- Auto-saves score after each guest capture

**Database Schema:**
```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level > 0),
  max_hp INTEGER NOT NULL CHECK (max_hp > 0),
  captured INTEGER NOT NULL CHECK (captured >= 0),
  total INTEGER NOT NULL DEFAULT 50,
  accuracy INTEGER NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast sorting
CREATE INDEX idx_leaderboard_rank
  ON leaderboard(level DESC, captured DESC);
```

**Row Level Security (RLS) Policies:**
```sql
-- Anyone can view the leaderboard (public competition)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Anyone can submit their score (anonymous gameplay)
CREATE POLICY "Anyone can submit scores"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE policies = scores are immutable
```

**API Service (src/services/supabase-leaderboard.js):**
```javascript
import { supabase } from '../lib/supabase.js';

export const leaderboardService = {
  // Get top 50 players
  async getLeaderboard() {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('level', { ascending: false })
      .order('captured', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  },

  // Save player score
  async saveScore(playerData) {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([{
        player_name: playerData.name,
        level: playerData.level,
        max_hp: playerData.maxHp,
        captured: playerData.captured,
        total: playerData.total,
        accuracy: playerData.accuracy
      }]);

    if (error) throw error;
    return data;
  }
};
```

**Auto-Save Implementation (App.vue):**
```javascript
function handleGuestCaptured(guestId) {
  // ... capture logic ...

  // Save score to global leaderboard (async, non-blocking)
  saveScoreToLeaderboard();
}

async function saveScoreToLeaderboard() {
  try {
    await leaderboardService.saveScore({
      name: playerName.value,
      level: playerStats.value.level,
      maxHp: playerStats.value.maxHp,
      captured: capturedCount.value,
      total: totalGuests.value,
      accuracy: accuracy.value
    });
  } catch (error) {
    console.warn('Failed to save score:', error);
    // Don't block gameplay if leaderboard fails
  }
}
```

**Pagination Logic:**
```javascript
const playersPerPage = 10;
const totalPages = computed(() =>
  Math.ceil(leaderboardData.value.length / playersPerPage)
);

const currentPagePlayers = computed(() => {
  const start = (currentPage.value - 1) * playersPerPage;
  const end = start + playersPerPage;

  // Map database fields to component fields
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
```

**Free Tier Limits:**
- 500MB database storage
- 50K API requests/day (~1,700 players/day)
- 2GB bandwidth/month
- Unlimited leaderboard entries (within storage limit)

---

### Share System (ShareModal.vue)

**Layout:** Horizontal trainer card (2-column grid)

**Left Column:**
- Player avatar (first letter in circle)
- Player name and level
- Stats grid:
  - Max HP
  - Total XP
  - Accuracy
  - Battles Won
- Answer breakdown (✅ Correct / ❌ Wrong)

**Right Column:**
- "Captured Guests" section
- 4-column grid of guest avatars
- Placeholder slots for uncaptured

**Share Methods:**

1. **LinkedIn Share:**
```javascript
function shareOnLinkedIn() {
  const shareText = `Just played PokéLenny - a fun game where you catch Lenny's Podcast guests and answer trivia!

My Stats:
🎮 Trainer: ${props.playerName}
⭐ Level ${props.stats.level}
🏆 ${props.stats.totalBattles} Battles Won
🎯 ${props.accuracy}% Accuracy
👥 ${props.capturedCount}/${props.totalGuests} Guests Captured

Check it out and test your knowledge of Lenny's Podcast!

https://pokelenny.com`;

  const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
  window.open(linkedInUrl, '_blank');
}
```

2. **Twitter/X Share:** Standard Web Share API or clipboard fallback

3. **Copy Stats:** Quick copy of condensed stats

---

### Collection System (CollectionScreen.vue)

**Access:** Click "📚 Collection" button or press C key

**Layout:**
- Grid display of all 50 guests
- Captured guests: Full color with checkmark
- Uncaptured: Grayscale with "???"
- Guest card shows:
  - Avatar image
  - Name
  - Episode title
  - Difficulty badge

**Filters (TODO):**
- By difficulty (Easy/Medium/Hard)
- By capture status (All/Captured/Uncaptured)
- By episode

---

### Encounter Dialog System (EncounterDialog.vue)

**Trigger:** Player within 2 tiles of NPC

**Design:** Pokemon-style white textbox with black border

**Features:**
- NPC avatar thumbnail (40x40px)
- NPC name header
- Random encounter message:
  - "wants to battle!"
  - "challenges you!"
  - "is ready to fight!"
  - "spotted you!"
  - etc.
- Typewriter effect (40ms per character)
- Blinking cursor during typing
- Animated continue arrow (▼)
- Instructions: "SPACE to battle • Walk away to cancel"

**Position:** Fixed inside game canvas at bottom

**Events:**
- Shows on `show-encounter-dialog`
- Hides on `hide-encounter-dialog`
- Accepts on SPACE/ENTER key
- Auto-hides when player walks away

---

### Battle Screen (BattleScreen.vue)

**Position:** Absolutely positioned at top: 45% of viewport

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [Guest Info Box]           [Turn Counter]  │
│  Name: Elena Verna          Question 3/5    │
│  HP: ████████░░ 80/100                      │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Question Text Here?                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [A] Choice 1              [B] Choice 2    │
│  [C] Choice 3              [D] Choice 4    │
│                                             │
│  [Player Info Box]                          │
│  Name: Your Name           HP: ████░░ 60/100│
└─────────────────────────────────────────────┘
```

**HP Bar Colors:**
- Green: > 50% HP
- Yellow: 20-50% HP
- Red: < 20% HP

**Battle Transition:**
- 1.5s swirling animation
- Shrinking circle effect
- Purple/pink gradient background

**Answer Feedback:**
- ✅ Correct: Green background, explanation shown
- ❌ Wrong: Red background, explanation shown
- 2-second display before next question

**Victory Animation:**
- 5 stars burst outward from center
- Spinning trophy badge (360° rotation)
- Pulsing "Victory!" title
- Glowing "Continue" button
- +50 XP award message

**Defeat Animation:**
- Broken heart icon (💔) scaling in
- Shake effect on "Defeat" title
- Red fade-in background
- "Try Again" button

---

### Game Over System (GameOver.vue)

**Trigger:** Player HP reaches 0 in battle

**Display:**
- Full-screen overlay
- Final stats summary:
  - Level reached
  - Guests captured
  - Total battles
  - Accuracy
- Animated broken heart background
- Shake effect on title

**Actions:**
- **Restart Game:** Resets all progress, returns to overworld
- **Return to Menu:** Goes back to main menu (name entry)

**Restart Process:**
```javascript
EventBus.emit('restart-game');
// Resets in Overworld.js:
// - currentLevel = 1
// - spawnedGuestIndices = []
// - Clears all NPCs
// - Spawns fresh level 1 NPCs
// - Resets player position
```

---

## Player Character System

### Sprite Display
**Location:** `Overworld.js` (lines 335-361)

**Character Sprites:**
- `main-front.png` - Facing down (default)
- `main-back.png` - Facing up
- `main-left.png` - Facing right (moving right)
- `main-right.png` - Facing left (moving left)
- Scale: 0.15x (smaller to match zoom)
- Depth: 10 (renders above NPCs at depth 5)

**Player Name Display:**
- Positioned 35px below sprite
- Font: Press Start 2P, 10px
- Color: Gold (#FFD700)
- Black stroke (3px thickness)
- Follows player smoothly with tweens
- Updates dynamically if name changes

**Movement System:**
- Grid-based: 32x32 pixel tiles
- Move delay: 200ms between moves
- Tween duration: 150ms (smooth glide)
- Controls: WASD + Arrow keys + Mobile touch
- Direction changes sprite texture instantly

---

## Mobile Controls

**Location:** `Overworld.js` (lines 741-852)

**Visibility:** Touch devices or screen width ≤ 1024px

**D-Pad Layout:**
```
     ▲
   ◀ A ▶
     ▼
```

**Controls:**
- 4 directional buttons (60px circles)
- Center "A" button for interactions (green)
- Bottom-left corner positioning
- Pointerdown: Gold highlight
- Pointerup/out: Returns to normal
- Hidden during battles

**Mobile Direction Logic:**
```javascript
if (this.mobileDirection) {
  dx = 0;
  dy = 0;
  if (this.mobileDirection === 'up') dy = -1;
  else if (this.mobileDirection === 'down') dy = 1;
  else if (this.mobileDirection === 'left') dx = -1;
  else if (this.mobileDirection === 'right') dx = 1;
}
```

---

## Event System (EventBus.js)

**Purpose:** Communication bridge between Phaser and Vue

### Phaser → Vue Events

```javascript
// Scene Management
EventBus.emit('current-scene-ready', scene);

// Battle Flow
EventBus.emit('start-battle', { guestId, guestName });
EventBus.emit('battle-starting');
EventBus.emit('battle-ended');
EventBus.emit('battle-rejected');

// Encounter System
EventBus.emit('show-encounter-dialog', { id, name, sprite, episode });
EventBus.emit('hide-encounter-dialog');

// Player Actions
EventBus.emit('player-name-set', name);
EventBus.emit('open-collection');

// Game State
EventBus.emit('spawn-next-level', { level, enemiesCount });
EventBus.emit('remove-npc', guestId);
EventBus.emit('restart-game');
EventBus.emit('return-to-menu');

// Assets
EventBus.emit('guests-loaded', guests);
```

### Vue → Phaser Events

```javascript
// Audio Control
EventBus.emit('play-battle-music');
EventBus.emit('stop-battle-music');
EventBus.emit('play-victory-sound');
EventBus.emit('toggle-mute', isMuted);

// Battle Flow
EventBus.emit('battle-rejected');
EventBus.emit('battle-ended');
```

---

## Environment Variables & Security

**Location:** `.env` (gitignored), `.env.example` (template)

### Supabase Configuration

**Why These Keys Are Safe to Expose:**

The project uses **Supabase anon key** which is designed to be public and safe to expose in frontend code. It's protected by Row Level Security (RLS) policies on the database.

**Environment Variables:**
```bash
# .env (NOT committed to git)
VITE_SUPABASE_URL=https://ssgkpypmkiagwdxmemri.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# .env.example (committed to git as template)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security Measures:**

1. **Row Level Security (RLS)** protects the database:
   - Anyone can READ leaderboard (public competition)
   - Anyone can INSERT scores (anonymous gameplay)
   - NO ONE can UPDATE scores (prevents cheating)
   - NO ONE can DELETE scores (preserves history)

2. **No service role key** used in frontend:
   - Service role keys bypass RLS
   - Only anon key is used (safe for public exposure)

3. **Gitignore protection:**
   - `.env` is in `.gitignore` (won't be committed)
   - `.env.example` is a template for contributors

**Setup for Contributors:**

```bash
# Option 1: Use production keys (safe - RLS protected)
cp .env.example .env
# Add production Supabase keys

# Option 2: Create own Supabase project (for development)
# 1. Go to supabase.com
# 2. Create free project
# 3. Follow SUPABASE_SETUP.md
# 4. Add your own keys to .env
```

**Client Configuration (src/lib/supabase.js):**
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // No auth needed for this game
  }
});
```

**What's Safe to Share:**
- ✅ Supabase URL (public endpoint)
- ✅ Anon key (protected by RLS)
- ✅ Database schema (public design)
- ❌ Service role key (NEVER use in frontend)

**Security Verification:**
```bash
# Check .env is gitignored
git check-ignore -v .env
# Output: .gitignore:16:.env	.env

# Confirm .env is not in git
git ls-files | grep "^\.env$"
# Output: (empty - good!)
```

---

## Responsive Design

### Breakpoints

**Desktop (> 1600px):**
- Horizontal layout: Stats | Game | Buttons
- Full canvas size: 960x640px
- All features visible

**Tablet (1024px - 1600px):**
- Vertical stack layout
- Canvas centered
- Stats bar on top
- Action buttons below game

**Mobile (< 1024px):**
- Touch controls enabled
- Font sizes reduced
- Canvas scales to fit
- Modals adjust to 95% width

### Media Queries

```css
/* Tablet */
@media (max-width: 1600px) {
  .game-wrapper {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .leaderboard-title { font-size: 10px; }
  .player-name { font-size: 8px; }
  .stat { font-size: 6px; }
}

@media (max-width: 600px) {
  .tutorial-title { font-size: 16px; }
  .instruction-text h3 { font-size: 10px; }
  .start-button { font-size: 12px; }
}
```

---

## Asset Management

### Preloader System (Preloader.js)

**Loading Sequence:**
```javascript
// 1. Set asset path
this.load.setPath('assets');

// 2. Load tilemap & tileset
this.load.image('tiles', 'tuxmon-sample-32px-extruded.png');
this.load.tilemapTiledJSON('map', 'tuxemon-town.json');

// 3. Load player sprites (4 directions)
this.load.image('main-front', 'main-front.png');
this.load.image('main-back', 'main-back.png');
this.load.image('main-left', 'main-left.png');
this.load.image('main-right', 'main-right.png');

// 4. Load UI assets
this.load.image('bg', 'bg.png');
this.load.image('logo', 'logo.png');
this.load.image('star', 'star.png');

// 5. Load audio
this.load.audio('overworld-music', 'overworld-music.mp3');
this.load.audio('battle-music', 'battle-music.mp3');
this.load.audio('victory-fanfare', 'victory-fanfare.mp3');

// 6. Load guest data JSON
this.load.json('guestData', 'guest_data.json');

// 7. Load Elena's special sprites
this.load.image('elena-front', 'elena-front.png');
this.load.image('elena-side', 'elena-side.png');
```

**Dynamic Guest Avatar Loading:**
```javascript
// After guest data loads
const guestData = this.cache.json.get('guestData');
guestData.guests.forEach(guest => {
  const avatarPath = `avatars/${guest.name}_pixel_art.png`;
  this.load.image(guest.avatarKey, avatarPath);
});

// Start loading
this.load.start();
```

**Progress Bar:**
- Shows loading percentage
- Gold (#FFD700) fill color
- Positioned center screen

---

## Styling & Design System

### Color Palette

```css
/* Primary Colors */
--gold: #FFD700;           /* Borders, highlights, titles */
--purple-start: #667eea;   /* Gradient start */
--purple-end: #764ba2;     /* Gradient end */

/* HP Colors */
--hp-green: #4ade80;       /* > 50% HP */
--hp-yellow: #fbbf24;      /* 20-50% HP */
--hp-red: #ef4444;         /* < 20% HP */

/* XP Colors */
--xp-blue-start: #60a5fa;
--xp-blue-end: #3b82f6;

/* Backgrounds */
--dark-overlay: rgba(0, 0, 0, 0.85);
--dark-panel: rgba(0, 0, 0, 0.95);

/* Accent Colors */
--green: #4CAF50;          /* Success, action buttons */
--red: #ff4560;            /* Danger, close buttons */
```

### Typography

**Primary Font:**
```css
font-family: 'Press Start 2P', monospace, sans-serif;
```

**Font Sizes:**
- Main Title: 64px (MainMenu)
- Modal Titles: 20px
- Section Headers: 14-16px
- Body Text: 10-12px
- Small Text: 7-9px
- Stats: 8-10px

**Font Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

### Button States

```css
.action-btn {
  /* Default */
  background: rgba(0, 0, 0, 0.85);
  border: 3px solid #FFD700;
  border-radius: 8px;
  padding: 12px 20px;

  /* Hover */
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  background: rgba(255, 215, 0, 0.1);

  /* Active */
  transform: translateY(0);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}
```

### Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up:**
```css
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
```

**Bounce:**
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

**Spin:**
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## Key Algorithms

### Manhattan Distance (Interaction Range)
```javascript
const distance = Math.abs(npc.tileX - player.tileX) +
                 Math.abs(npc.tileY - player.tileY);

// Interaction range: distance <= 2 tiles
if (distance <= 2) {
  // Show encounter dialog
}
```

### HP Bar Percentage
```javascript
const hpPercent = (currentHP / maxHP) * 100;

// Color coding
if (hpPercent > 50) color = 'green';
else if (hpPercent > 20) color = 'yellow';
else color = 'red';
```

### Accuracy Calculation
```javascript
const total = rightAnswers + wrongAnswers;
const accuracy = total > 0
  ? Math.round((rightAnswers / total) * 100)
  : 0;
```

### XP Progress Percentage
```javascript
const xpForNextLevel = getXPForLevel(playerStats.level + 1);
const xpForCurrentLevel = getXPForLevel(playerStats.level);
const xpInCurrentLevel = playerStats.xp - xpForCurrentLevel;
const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
const xpPercentage = (xpInCurrentLevel / xpNeededForLevel) * 100;
```

### Valid NPC Position Check
```javascript
function isValidPosition(x, y, existingPositions) {
  // Check bounds (2 tile margin)
  if (x < 2 || x >= mapWidth - 2 || y < 2 || y >= mapHeight - 2) {
    return false;
  }

  // Check tile is walkable
  const tile = worldLayer.getTileAt(x, y);
  if (!tile || tile.collides) {
    return false;
  }

  // Check spacing from existing NPCs (minimum 2 tiles)
  for (const pos of existingPositions) {
    const distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
    if (distance < 2) {
      return false;
    }
  }

  return true;
}
```

---

## Configuration Files

### Phaser Config (src/game/main.js)

```javascript
const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  parent: 'game-container',
  backgroundColor: '#028af8',
  pixelArt: true,  // Critical for crisp pixel art
  scene: [Boot, Preloader, MainMenu, Overworld]
};

export default new Phaser.Game(config);
```

### Vite Config (vite.config.js)

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
```

---

## Data Structures

### Player Stats Object
```javascript
const playerStats = ref({
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  rightAnswers: 0,
  wrongAnswers: 0,
  totalBattles: 0
});
```

### Guest Object (from guest_data.json)
```javascript
{
  "id": "elena_verna",
  "name": "Elena Verna",
  "episode": "Growth Strategy Master",
  "difficulty": "Medium",
  "avatarKey": "elena_verna_avatar",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "prompt": "What is Elena's core growth philosophy?",
      "choices": [
        "Growth at all costs",
        "Retention comes before acquisition",
        "Viral loops are everything",
        "Focus only on paid acquisition"
      ],
      "correctAnswer": 1,
      "explanation": "Elena emphasizes that retention must come before acquisition for sustainable growth."
    }
  ]
}
```

### NPC Object (in Overworld.js)
```javascript
const npc = {
  id: guestId,
  name: guestName,
  tileX: x,
  tileY: y,
  direction: 'down',
  sprite: spriteObject,
  challenged: false,
  defeated: false,
  episode: guest.episode,
  difficulty: guest.difficulty
};
```

### Battle State (BattleScreen.vue)
```javascript
const battleState = ref({
  stage: 'transition', // 'transition', 'question', 'feedback', 'victory', 'defeat'
  currentQuestion: 0,
  totalQuestions: 5,
  playerHP: 100,
  playerMaxHP: 100,
  guestHP: 100,
  guestMaxHP: 100,
  selectedAnswer: null,
  isCorrect: false,
  feedback: ''
});
```

---

## Performance Considerations

### Asset Optimization
- Use extruded tileset to prevent bleeding
- Compress images (PNG-8 when possible)
- Lazy load guest avatars after initial boot
- Cache audio files in browser

### Rendering Optimization
- Set `pixelArt: true` in Phaser config
- Use sprite depths to control render order
- Limit concurrent tweens
- Disable animations during battles

### Memory Management
- Destroy removed NPC sprites
- Clear event listeners on component unmount
- Use computed properties in Vue for derived state
- Reuse audio objects (don't recreate)

### Code Splitting
- Phaser library in separate chunk
- Lazy load modals only when needed
- Guest data loads after boot

---

## Testing Checklist

### Core Functionality
- [x] Player can enter name on start screen
- [x] Tutorial shows on first play only
- [x] Character sprite changes based on movement direction
- [x] Player name displays below character
- [x] Minimap follows player correctly
- [x] NPC encounter dialog appears within 2-tile range
- [x] Battle starts when pressing SPACE near NPC
- [x] Questions display correctly with 4 choices
- [x] Correct answers award +10 XP and damage guest
- [x] Wrong answers deduct -10 HP and damage guest
- [x] Battle ends at 0 HP or 5 questions
- [x] Victory animation plays on win
- [x] Defeat animation plays on loss
- [x] Guest marked as captured after victory
- [x] Guest removed from map after capture
- [x] XP bar updates and levels up correctly
- [x] HP bar updates and changes color based on %
- [x] Level up spawns next batch of NPCs
- [x] Game over triggers at 0 HP
- [x] Collection screen shows captured guests
- [x] Leaderboard modal opens with pagination
- [x] Leaderboard fetches real data from Supabase
- [x] Scores auto-save after guest capture
- [x] Leaderboard refresh button works
- [x] Share modal displays correct stats
- [x] LinkedIn share opens with prepopulated text
- [x] Audio plays and pauses correctly
- [x] Mute button toggles all audio
- [x] Mobile controls appear on touch devices

### Visual Testing
- [x] All sprites load correctly (no broken images)
- [x] Text is readable at all screen sizes
- [x] Buttons have proper hover effects
- [x] Animations play smoothly (no stuttering)
- [x] Layout responsive on mobile, tablet, desktop
- [x] Minimap border and label visible
- [x] HP bars show correct colors (green/yellow/red)
- [x] Modal overlays center correctly
- [x] Encounter dialog positioned inside canvas

### Edge Cases
- [x] Empty name defaults to "Player"
- [x] Can't walk through walls or NPCs
- [x] Can't interact with captured NPCs
- [x] Level up at exactly required XP
- [x] HP can't go below 0
- [x] Collection works with 0 captures
- [x] Leaderboard pagination handles last page
- [x] Tutorial doesn't show on subsequent plays
- [x] Audio resumes after battle
- [x] Game restarts properly from game over

---

## Known Issues & Limitations

### Current Limitations
1. **No Save System:** Progress resets on page reload (LocalStorage TODO)
2. **Static Guest Data:** Loaded from JSON, not dynamic API
3. **No Walking Animation:** Character sprites are static (no frame cycles)
4. **Single Map:** Only one tilemap implemented
5. **Fixed Question Pool:** 5 questions per guest, no randomization beyond order
6. **No User Authentication:** No login system (optional - anonymous play supported)

### Minor Issues
- Mobile controls may overlap with minimap on very small screens
- Encounter dialog typewriter can be interrupted by movement
- Audio context may not start until user interaction (browser policy)

### Future Browser Compatibility
- Web Audio API required (no IE support)
- Native Share API fallback to clipboard on desktop
- Touch events for mobile controls

---

## Future Improvements & Roadmap

### Phase 1: Backend Integration (Partially Complete)
- [x] **Supabase leaderboard** - Global real-time rankings ✅
- [ ] Player progress persistence (save/load game state)
- [ ] User authentication (optional - currently anonymous)
- [ ] Cloud Functions for question generation
- [ ] User profile system with avatars

### Phase 2: Enhanced Gameplay (Medium Priority)
- [ ] Multiple maps with transitions
- [ ] Items system (HP potions, XP boosts)
- [ ] Walking animations (4-frame cycles)
- [ ] Difficulty scaling based on player level
- [ ] Daily challenges
- [ ] Achievement system
- [ ] Guest rarity system (Common/Rare/Legendary)

### Phase 3: Social Features (Medium Priority)
- [ ] Friend system
- [ ] Trading captured guests
- [ ] Battle other players
- [ ] Guild/team system
- [ ] Social media integration improvements

### Phase 4: Polish & Optimization (Low Priority)
- [ ] Particle effects (battle hits, level up sparkles)
- [ ] Cutscenes and story mode
- [ ] NPC idle animations
- [ ] Environmental animations (water, grass)
- [ ] Sound effects (footsteps, menu clicks)
- [ ] Background music variations
- [ ] Dark mode / theme system

### Phase 5: Advanced Features (Future)
- [ ] Procedurally generated maps
- [ ] Dynamic question generation (AI)
- [ ] Voice acting for NPCs
- [ ] Mini-games between battles
- [ ] Seasonal events
- [ ] Battle replays
- [ ] Spectator mode

---

## Deployment Guide

### Production Build

```bash
# 1. Build for production
npm run build

# Output: dist/ folder contains:
# - index.html
# - assets/ (bundled JS, CSS)
# - public/ (images, audio)
```

### Deployment Checklist

- [ ] Update Firebase config (if using)
- [ ] Set correct base URL in vite.config.js
- [ ] Optimize images (compress PNGs)
- [ ] Test on multiple devices
- [ ] Verify audio files load
- [ ] Check CORS for API calls
- [ ] Enable HTTPS (required for audio)
- [ ] Configure CDN for assets
- [ ] Set up analytics
- [ ] Monitor error logging

### Hosting Options

**Recommended:**
- **Firebase Hosting** (best for Firebase integration)
- **Vercel** (easy deployment, great DX)
- **Netlify** (drag-and-drop deploy)

**Deploy to Firebase:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Environment Variables

```bash
# .env.production
VITE_API_URL=https://api.pokelenny.com
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## Backend API Specification (TODO)

### Endpoints Needed

**Authentication:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

**Player Data:**
```
GET  /api/player/:id
POST /api/player/save
GET  /api/player/:id/progress
POST /api/player/:id/capture
```

**Leaderboard:**
```
GET  /api/leaderboard?page=1&limit=10
GET  /api/leaderboard/rank/:playerId
```

**Guests & Questions:**
```
GET  /api/guests
GET  /api/guests/:id
GET  /api/guests/:id/questions?difficulty=medium
POST /api/questions/report (for incorrect questions)
```

**Stats & Analytics:**
```
POST /api/stats/battle-result
GET  /api/stats/global
GET  /api/stats/player/:id
```

### Data Models

**User:**
```javascript
{
  id: String,
  username: String,
  email: String,
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

**PlayerProgress:**
```javascript
{
  userId: String,
  level: Number,
  xp: Number,
  hp: Number,
  maxHp: Number,
  capturedGuests: Array<String>,
  rightAnswers: Number,
  wrongAnswers: Number,
  totalBattles: Number,
  updatedAt: Timestamp
}
```

**LeaderboardEntry:**
```javascript
{
  playerId: String,
  playerName: String,
  level: Number,
  maxHp: Number,
  capturedCount: Number,
  totalGuests: Number,
  accuracy: Number,
  rank: Number,
  updatedAt: Timestamp
}
```

---

## Firebase Integration Guide

### MCP Tools Available

The project has Firebase MCP tools integrated and ready:

```bash
# Login to Firebase
firebase_login

# Get current project
firebase_get_project

# List projects
firebase_list_projects

# Initialize features
firebase_init features={...}

# Deploy
firebase deploy
```

### Firebase Services to Use

1. **Authentication:** User accounts
2. **Firestore:** Player progress, leaderboard
3. **Storage:** User uploaded content (future)
4. **Cloud Functions:** Server-side logic
5. **Hosting:** Deploy the game

### Firestore Collections Structure

```
users/
  {userId}/
    profile: { name, createdAt, ... }
    progress: { level, xp, hp, ... }
    captured: { guestIds: [...] }

leaderboard/
  {entryId}: { playerId, rank, stats, ... }

guests/
  {guestId}: { name, episode, difficulty, ... }

questions/
  {questionId}: { guestId, prompt, choices, ... }
```

---

## Troubleshooting Common Issues

### Audio Won't Play
**Cause:** Browser autoplay policy blocks audio until user interaction
**Fix:** Audio starts after first user click (button, movement)

### Sprites Not Loading
**Cause:** Incorrect asset path or cache issue
**Fix:** Hard refresh (Cmd+Shift+R), check console for 404 errors

### TypeScript Errors in IDE
**Cause:** Phaser types not recognized
**Fix:** Install `@types/phaser` or add `// @ts-ignore`

### Battle Screen Misaligned
**Cause:** CSS positioning changed
**Fix:** Verify `top: 45%` in BattleScreen.vue

### NPCs Spawn Inside Walls
**Cause:** Collision detection not checking tiles
**Fix:** Ensure `worldLayer.getTileAt()` validates position

### Leaderboard Doesn't Update
**Cause:** Using mock data, not connected to backend
**Fix:** Implement backend API calls (see lines 86, 149 in LeaderboardPanel.vue)

### Name Doesn't Persist
**Cause:** No LocalStorage or backend save
**Fix:** Add `localStorage.setItem('playerName', name)` in App.vue

---

## Code Style & Conventions

### Naming Conventions

**Files:**
- Components: PascalCase (BattleScreen.vue)
- Scenes: PascalCase (Overworld.js)
- Utilities: camelCase (gameState.js)

**Variables:**
- Refs: camelCase (playerStats)
- Constants: UPPER_SNAKE_CASE (MAX_HP)
- Functions: camelCase (handleBattle)
- Components: PascalCase (<BattleScreen />)

**Events:**
- kebab-case ('start-battle', 'player-name-set')

### Vue Composition API Patterns

```javascript
// Refs for reactive state
const playerStats = ref({...});

// Computed for derived state
const accuracy = computed(() => ...);

// Functions for actions
function handleBattle() {...}

// Lifecycle hooks
onMounted(() => {...});
onUnmounted(() => {...});

// Props
const props = defineProps({...});

// Emits
const emit = defineEmits(['close', 'update']);
```

### Phaser Scene Patterns

```javascript
export class SceneName extends Scene {
  constructor() {
    super('SceneName');
  }

  init(data) {
    // Receive data from previous scene
  }

  preload() {
    // Load assets (usually in Preloader)
  }

  create() {
    // Initialize scene
  }

  update(time, delta) {
    // Game loop
  }
}
```

### Event Handling

```javascript
// Listen to events
EventBus.on('event-name', (data) => {...});

// Emit events
EventBus.emit('event-name', data);

// Clean up on unmount
onUnmounted(() => {
  EventBus.off('event-name');
});
```

---

## Git Commit History

### Recent Major Commits

```
79a1354 - Convert leaderboard to modal and display player name below character
03d8718 - Add leaderboard panel to show top 50 players with competition stats
0ab2bfc - Add first-time tutorial modal to explain game mechanics
4c0f89d - Move battle screen and encounter dialog up to match game window position
59d7ee2 - Revert to Press Start 2P font
681b8ca - Add LinkedIn share button to ShareModal with horizontal layout
5a3b2e1 - Add audio system (overworld, battle, victory music)
2c1f4de - Implement dynamic NPC spawning with level progression
1d8e9ab - Add game over system with restart functionality
9f4c6ba - Integrate GuestData manager with 50 guests
...
```

---

## Contact & Support

**Project Owner:** Ben Miro
**Development AI:** Claude (Anthropic)
**Project Repository:** (Add GitHub link)
**Live Demo:** (Add deployed URL)

**For Questions:**
- Check inline code comments first
- Review this HANDOFF.md
- Check `public/assets/guest_data.json` for data structure
- Console logs in Overworld.js show NPC spawn debugging

**Critical Files for New Developers:**
1. `src/App.vue` - Game state orchestration
2. `src/game/scenes/Overworld.js` - Core gameplay
3. `src/components/BattleScreen.vue` - Battle mechanics
4. `src/game/GuestData.js` - Data management
5. `public/assets/guest_data.json` - Content database
6. `src/services/supabase-leaderboard.js` - Leaderboard API
7. `SUPABASE_SETUP.md` - Backend setup guide

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Vue App (App.vue)                     │
│  • Global State (Stats, HP, XP, Captured)              │
│  • Event Orchestration                                  │
│  • Modal Management                                     │
│  • Audio Control                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                EventBus
                     │
    ┌────────────────┼────────────────────┐
    │                │                    │
    ▼                ▼                    ▼
┌──────────┐  ┌──────────────┐  ┌────────────────┐
│ Phaser   │  │ BattleScreen │  │ UI Components  │
│ Scenes   │  │   (Vue)      │  │ (Vue Modals)   │
└──────────┘  └──────────────┘  └────────────────┘
    │              │                     │
    ├─ Boot        ├─ Questions         ├─ Tutorial
    ├─ Preloader   ├─ Feedback          ├─ Leaderboard
    ├─ MainMenu    ├─ Victory/Defeat    ├─ Collection
    └─ Overworld   └─ HP/XP Display     ├─ ShareModal
         │                               └─ GameOver
         ├─ Player
         ├─ NPCs (50 guests)
         ├─ Minimap
         └─ Mobile Controls

┌─────────────────────────────────────────────────────────┐
│                  Data Layer                             │
│  • GuestData.js (manager)                               │
│  • guest_data.json (50 guests, questions)              │
│  • GameState.js (global flags)                          │
│  • LocalStorage (tutorial seen, mute state)            │
└─────────────────────────────────────────────────────────┘
```

---

## Version History

**v1.1 (Current)** - January 23, 2026
- ✅ **Global Supabase leaderboard** - Real-time worldwide rankings
- ✅ **Secure open source setup** - RLS policies, .env gitignored
- ✅ Auto-save scores after each guest capture
- ✅ Environment variables configuration
- ✅ Full documentation (SUPABASE_SETUP.md)

**v1.0** - January 23, 2026
- ✅ Complete game loop with 50 guests
- ✅ Tutorial modal for first-time players
- ✅ Mock leaderboard system with pagination
- ✅ Player name display below character
- ✅ Audio system (music + SFX)
- ✅ Game over and restart functionality
- ✅ Dynamic NPC spawning with level progression
- ✅ LinkedIn sharing with horizontal trainer card
- ✅ Mobile touch controls
- ✅ Responsive design for all devices

**v0.5** - January 20, 2026
- Directional character sprites
- XP and leveling system
- Share modal with trainer card
- Improved start screen layout

**v0.4** - January 18, 2026
- Battle animations (transition, victory, defeat)
- Stats bar and action buttons
- Encounter dialog system

**v0.3** - January 15, 2026
- Minimap functionality
- NPC interaction system
- Battle screen UI

**v0.2** - January 12, 2026
- Tile-based overworld movement
- Collision detection
- Camera system

**v0.1** - January 10, 2026
- Initial Phaser + Vue setup
- Asset loading system

---

## License & Credits

**Game Design:** PokéLenny Team
**Development:** Claude AI + Ben Miro
**Podcast Content:** Lenny's Podcast (Lenny Rachitsky)

**Assets:**
- Tuxemon Tileset: Open source (Tuxemon project)
- Character Sprites: Custom created
- Guest Avatars: Custom pixel art
- Font: Press Start 2P by Google Fonts (SIL Open Font License)

**Libraries:**
- Phaser 3: MIT License
- Vue 3: MIT License
- Vite: MIT License

---

**End of Handoff Documentation**

This document contains everything a new developer needs to understand, maintain, and extend PokéLenny. For specific implementation details, refer to inline code comments and the files mentioned throughout this document.

**Last Updated:** January 23, 2026
**Status:** Production-ready v1.1 with global leaderboard

**Major Update v1.1:**
- ✅ Supabase integration for global leaderboard
- ✅ Open source safe (RLS security, .env gitignored)
- ✅ Auto-save player scores
- ✅ Real-time worldwide competition

Good luck, and happy coding! 🎮
