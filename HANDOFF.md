# PokéLenny - Project Handoff Documentation

## Project Overview

**PokéLenny** is a Pokemon-style RPG game featuring guests from Lenny's Podcast. Players navigate an overworld, encounter podcast guests, and battle them by answering trivia questions about their episodes.

**Tech Stack:**
- **Game Engine:** Phaser 3
- **Frontend Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **Styling:** CSS with custom animations

**Game Version:** v0.5

---

## Project Structure

```
pokelenny-phaser/
├── public/
│   └── assets/
│       ├── main-front.png          # Player character facing down
│       ├── main-back.png           # Player character facing up
│       ├── main-left.png           # Player character facing left
│       ├── main-right.png          # Player character facing right
│       ├── elena-front.png         # Elena Verna NPC sprite (front)
│       ├── elena-side.png          # Elena Verna NPC sprite (side)
│       ├── tuxemon-town.json       # Tilemap data (40x40 tiles)
│       ├── tuxmon-sample-32px-extruded.png  # Tileset (extruded to prevent bleeding)
│       ├── bg.png                  # Background image
│       ├── logo.png                # Game logo
│       └── star.png                # Star decoration
│
├── src/
│   ├── game/
│   │   ├── scenes/
│   │   │   ├── Boot.js             # Initial boot scene
│   │   │   ├── Preloader.js        # Asset loading scene
│   │   │   ├── MainMenu.js         # Start screen with player name input
│   │   │   ├── Overworld.js        # Main gameplay scene (tile-based movement)
│   │   │   ├── Game.js             # Unused legacy scene
│   │   │   └── GameOver.js         # Unused legacy scene
│   │   ├── EventBus.js             # Event communication between Phaser and Vue
│   │   └── main.js                 # Phaser game configuration
│   │
│   ├── components/
│   │   ├── BattleScreen.vue        # Quiz battle interface
│   │   ├── CollectionScreen.vue    # Guest collection UI
│   │   ├── EncounterDialog.vue     # Pre-battle encounter dialog
│   │   └── ShareModal.vue          # Stats sharing modal with preview card
│   │
│   ├── App.vue                     # Main Vue application
│   ├── PhaserGame.vue              # Phaser game container
│   └── main.js                     # Vue app entry point
│
├── package.json
├── vite.config.js
└── HANDOFF.md                      # This file
```

---

## Core Game Features

### 1. Start Screen (MainMenu.js)
**Location:** `src/game/scenes/MainMenu.js`

**Features:**
- Animated starfield background (static stars with varying opacity)
- Gold decorative border frame
- Player name input (HTML input element overlaid on canvas)
- Character sprite previews (Elena + Main character)
- Responsive button design
- Stores player name and passes to Overworld scene

**Key Implementation Details:**
- Canvas size: 960x640 pixels
- Input field positioned at y: 460, dynamically calculated based on canvas position
- Player name sent via scene data: `this.scene.start('Overworld', { playerName: this.playerName })`
- Name also broadcast via EventBus for Vue components

**Font Sizes:**
- Title: 64px
- Tagline: 18px
- Info text: 13px
- Button: 18px
- Name label: 12px
- Input: 14px

---

### 2. Overworld (Overworld.js)
**Location:** `src/game/scenes/Overworld.js`

**Features:**
- Tile-based grid movement (32x32 pixel tiles)
- Directional character sprites (4 directions: front, back, left, right)
- Collision detection with world layer
- NPC positioning and interaction
- Minimap in bottom-right corner (200x200px)
- Interaction prompt system ("Click SPACE to fight")
- Collection hotkey (C key)

**Technical Details:**

**Player Movement:**
- Grid-based movement with 200ms delay between moves
- Smooth tween animations (150ms duration)
- WASD + Arrow key controls
- Direction changes update sprite texture instantly

**Character Sprites:**
```javascript
// Sprite mapping
'main-front'  // Down arrow / S key
'main-back'   // Up arrow / W key
'main-right'  // Left arrow / A key (swapped in code)
'main-left'   // Right arrow / D key (swapped in code)
```

**Camera System:**
- Main camera zoom: 1.3x
- Smooth camera follow: lerp factor 0.09
- Minimap zoom: 0.15x
- Minimap follow: lerp factor 0.1

**NPC System:**
```javascript
const guestData = [
    { id: '1', name: 'Elena Verna', x: 10, y: 8, direction: 'down' },
    { id: '2', name: 'Shreyas Doshi', x: 15, y: 12, direction: 'right' },
    { id: '3', name: 'Lenny Rachitsky', x: 5, y: 6, direction: 'left' }
];
```

**Interaction System:**
- Range: 3 tiles (Manhattan distance)
- Trigger: SPACE or ENTER key
- Emits: `EventBus.emit('start-battle', { guestId, guestName })`

---

### 3. Battle System (BattleScreen.vue)
**Location:** `src/components/BattleScreen.vue`

**Features:**
- Pokemon-style battle UI with:
  - Guest info box (top left)
  - Player info box (bottom right)
  - HP bars with color coding (green > 50%, yellow > 20%, red ≤ 20%)
  - Question display with multiple choice
  - Answer feedback with explanations
  - Battle transition animation (1.5s swirling effect)
  - Victory/defeat animations

**Battle Flow:**
1. Transition animation plays (1.5s)
2. Question displays with 4 choices
3. Player selects answer
4. Feedback shows (correct/wrong + explanation)
5. HP updates (correct: -20 guest HP, wrong: -20 player HP)
6. Repeat for 5 questions or until HP = 0
7. Victory/defeat screen with animations

**Victory Animations:**
- 5 stars bursting outward
- Spinning trophy badge
- Pulsing title
- Glowing continue button

**Defeat Animations:**
- Broken heart icon scaling in
- Shake effect on title
- Fade-in defeat box

**Events Emitted:**
- `answer-submitted(isCorrect)` - Sent to App.vue for XP/HP tracking
- `guest-captured(guestId)` - Marks guest as captured
- `close` - Closes battle screen

---

### 4. Level & XP System (App.vue)
**Location:** `src/App.vue`

**Progression Mechanics:**

**XP Rewards:**
- Correct answer: 10 XP
- Wrong answer: 0 XP (but -10 HP)
- Battle victory (guest captured): 50 XP

**Level Up Formula:**
```javascript
const getXPForLevel = (level) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

// XP Requirements:
// Level 1 → 2: 100 XP
// Level 2 → 3: 150 XP
// Level 3 → 4: 225 XP
// Level 4 → 5: 337 XP
// (Exponential growth continues...)
```

**Level Up Rewards:**
- +20 Max HP
- Full HP restore
- Alert notification with new stats

**HP System:**
- Starting HP: 100
- Starting Max HP: 100
- Wrong answer penalty: -10 HP
- HP tracked separately from battle HP (App.vue maintains persistent HP)

---

### 5. Stats Display & UI (App.vue)
**Location:** `src/App.vue` (lines 181-207)

**Stats Bar (Always Visible):**
- **Level Progress:** Shows current level, XP bar, and XP needed for next level
- **HP Bar:** Green gradient bar with current/max HP display
- **Captured Count:** Shows guests captured vs total guests

**Action Buttons:**
- **📚 Collection:** Opens collection screen (blue border, hover glow)
- **📤 Share Stats:** Opens share modal (purple border, hover glow)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [Stats Bar]    [Game Canvas]    [Action Buttons]       │
│  - Level/XP     (960x640px)      - Collection           │
│  - HP Bar                         - Share Stats         │
│  - Captured                                             │
└─────────────────────────────────────────────────────────┘
│                  [Controls Info Bar]                     │
└─────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- < 1300px: Stack vertically (stats top, game middle, buttons bottom)
- < 1024px: Reduce font sizes
- < 768px: Further size reductions

---

### 6. Share System (ShareModal.vue)
**Location:** `src/components/ShareModal.vue`

**Features:**
- Beautiful trainer card preview with:
  - Player avatar (first letter of name in circle)
  - Level and stats grid (HP, XP, Accuracy, Battles)
  - Right/wrong answer breakdown
  - Captured guests with sprites
  - Pokemon-style gradient background

**Share Methods:**

1. **📤 Share Button:**
   - Uses native share API (mobile) if available
   - Falls back to clipboard copy
   - Formats as text with emojis

2. **📋 Copy Stats Button:**
   - Quick copy of condensed stats
   - Format: "Level X • X/X Captured • X% Accuracy"

**Share Text Format:**
```
🎮 PokéLenny Trainer Card 🎮

👤 Trainer: [Name]
⭐ Level: [Level]
💚 HP: [HP]/[MaxHP]

📊 Stats:
🏆 Battles Won: [Count]
🎯 Accuracy: [Percentage]%
✅ Correct Answers: [Count]
❌ Wrong Answers: [Count]
👥 Guests Captured: [Count]/[Total]

🌟 Captured Guests:
  • [Guest 1]
  • [Guest 2]
  ...

Play PokéLenny and catch your favorite Lenny's Podcast guests!
```

---

### 7. Collection Screen (CollectionScreen.vue)
**Location:** `src/components/CollectionScreen.vue`

**Features:**
- Grid display of all guests
- Captured/uncaptured visual states
- Guest details: name, difficulty, episode
- Filter/sort capabilities (to be implemented)

---

## Technical Implementation Details

### Event Communication (EventBus.js)

**Phaser → Vue Events:**
```javascript
EventBus.emit('current-scene-ready', scene)  // Scene loaded
EventBus.emit('start-battle', { guestId, guestName })  // Battle initiated
EventBus.emit('open-collection')  // Collection requested
EventBus.emit('player-name-set', name)  // Player name set
```

**Vue → Phaser Events:**
```javascript
EventBus.emit('battle-rejected')  // Player declined battle
```

### Asset Loading (Preloader.js)

**Critical Assets:**
```javascript
// Tilesets
this.load.image('tiles', 'tuxmon-sample-32px-extruded.png');
this.load.tilemapTiledJSON('map', 'tuxemon-town.json');

// Character sprites (all 4 directions)
this.load.image('main-front', 'main-front.png');
this.load.image('main-back', 'main-back.png');
this.load.image('main-left', 'main-left.png');
this.load.image('main-right', 'main-right.png');

// NPC sprites
this.load.image('elena-front', 'elena-front.png');
this.load.image('elena-side', 'elena-side.png');
```

**Note on Extruded Tileset:**
- Uses extruded version to prevent texture bleeding at tile edges
- Original tileset: 512x512px, 16x16 tiles, 32px tile size
- Extruded adds 1px margin around each tile

---

### Phaser Configuration (src/game/main.js)

```javascript
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,  // Important: prevents texture smoothing
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Overworld,
        Game,
        GameOver
    ]
};
```

---

## Data Structures

### Player Stats Object
```javascript
{
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  rightAnswers: 0,
  wrongAnswers: 0,
  totalBattles: 0
}
```

### Guest Collection Item
```javascript
{
  id: "1",
  name: "Elena Verna",
  sprite: "👩",  // Fallback emoji if no sprite
  difficulty: "Medium",
  episode: "Growth Strategy",
  captured: false
}
```

### Battle Question Format
```javascript
{
  id: 1,
  type: "mcq",  // or "tf" for true/false
  prompt: "Question text here?",
  choices: ["Option A", "Option B", "Option C", "Option D"],
  correctAnswer: 1,  // Index of correct answer (0-based)
  explanation: "Explanation of the correct answer."
}
```

---

## Styling & Design System

### Color Palette
- **Primary Gold:** `#FFD700` (borders, highlights, titles)
- **Background Gradient:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **HP Bar Green:** `linear-gradient(90deg, #4ade80, #22c55e)`
- **XP Bar Blue:** `linear-gradient(90deg, #60a5fa, #3b82f6)`
- **Dark Overlay:** `rgba(0, 0, 0, 0.85)`

### Typography
- **Primary Font:** 'Press Start 2P', monospace (pixel art style)
- **Font Loading:** Via Google Fonts CDN

### Button States
```css
.action-btn {
  /* Normal */
  background: rgba(0, 0, 0, 0.85);
  border: 3px solid #FFD700;

  /* Hover */
  transform: translateY(-2px);
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3);

  /* Active */
  transform: translateY(2px);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}
```

---

## Key Formulas & Calculations

### Manhattan Distance (NPC Interaction)
```javascript
const distance = Math.abs(npc.tileX - player.tileX) +
                Math.abs(npc.tileY - player.tileY);
// Interaction range: distance <= 3
```

### HP Bar Percentage
```javascript
const hpPercent = (currentHP / maxHP) * 100;
```

### Accuracy Calculation
```javascript
const total = rightAnswers + wrongAnswers;
const accuracy = total > 0 ? Math.round((rightAnswers / total) * 100) : 0;
```

---

## File Changes Log

### Added Files:
1. `/src/components/ShareModal.vue` - Complete share card system
2. `/public/assets/main-front.png` - Player front sprite
3. `/public/assets/main-back.png` - Player back sprite
4. `/public/assets/main-left.png` - Player left sprite
5. `/public/assets/main-right.png` - Player right sprite
6. `/HANDOFF.md` - This documentation

### Modified Files:

**src/game/scenes/MainMenu.js:**
- Added player name input system (HTML overlay)
- Removed all animations (title float, button pulse, star twinkle)
- Increased font sizes for better visibility
- Added character sprite previews
- Improved layout spacing

**src/game/scenes/Overworld.js:**
- Added `init()` method to receive player name from MainMenu
- Implemented directional sprite system (4-way movement)
- Added minimap with gold border and label
- Reduced player scale from 0.25 to 0.15
- Reduced camera zoom from 2x to 1.3x
- Implemented interaction prompt system (3-tile range)
- Added EventBus listeners for battle rejection and player name

**src/game/scenes/Preloader.js:**
- Updated to load all 4 directional character sprites
- Changed 'main-character' to 'main-front', 'main-back', 'main-left', 'main-right'

**src/components/BattleScreen.vue:**
- Added battle transition animation (1.5s swirling effect)
- Added victory/defeat animations (stars, trophy, broken heart)
- Added `answer-submitted` event emission for XP tracking
- Implemented Pokemon-style HP bars with color coding

**src/App.vue:**
- Added complete XP and leveling system
- Added player stats tracking (level, XP, HP, answers)
- Added stats bar UI (level, HP, captured count)
- Added action buttons (Collection, Share Stats)
- Added handleAnswerResult() for XP/HP management
- Added gainXP() and levelUp() functions
- Added ShareModal integration
- Implemented player name storage and passing

**src/game/main.js:**
- Changed canvas size from 640x480 to 960x640

---

## Known Issues & Limitations

### Current Limitations:
1. **Static Battle Data:** Questions are hardcoded in App.vue, not loaded dynamically
2. **No Save System:** Progress resets on page reload
3. **Limited NPCs:** Only 3 NPCs implemented (Elena, Shreyas, Lenny)
4. **No NPC Sprites:** Shreyas and Lenny use placeholder rectangles
5. **No Walking Animation:** Character sprites are static (no frame animation)
6. **Single Map:** Only one map (tuxemon-town) implemented
7. **No Music/SFX:** No audio implementation

### Sprite Direction Mapping Issue:
The code swaps left/right sprite assignments because the original images were uploaded with reversed naming:
```javascript
// In movePlayer():
dx < 0  → setTexture('main-right')  // Moving left shows right sprite
dx > 0  → setTexture('main-left')   // Moving right shows left sprite
```
This was fixed by physically swapping the files in the assets folder.

---

## Development Setup

### Prerequisites:
```bash
node >= 16.x
npm >= 8.x
```

### Installation:
```bash
cd /Users/benmiro/Documents/PokeLenny/pokelenny-phaser
npm install
```

### Development Server:
```bash
npm run dev
# Runs on http://localhost:8080
```

### Build for Production:
```bash
npm run build
# Output in dist/
```

---

## Future Improvements & TODOs

### High Priority:
1. **Save System:** LocalStorage or backend integration for progress persistence
2. **Dynamic Question Loading:** Load questions from API or JSON files
3. **More NPCs:** Add remaining podcast guests with proper sprites
4. **Walking Animation:** Implement frame-by-frame walking cycles
5. **Audio:** Add background music and sound effects

### Medium Priority:
6. **Multiple Maps:** Create new areas to explore
7. **Items System:** Potions, power-ups, etc.
8. **Difficulty Scaling:** Adjust question difficulty based on player level
9. **Leaderboard:** Compare stats with other players
10. **Mobile Optimization:** Touch controls and responsive design

### Low Priority:
11. **Particle Effects:** Battle effects, level up sparkles
12. **Cutscenes:** Story introduction and NPC dialogues
13. **Achievements:** Unlock badges for milestones
14. **Trading System:** Share captured guests (future multiplayer)
15. **Dark Mode:** Alternative color scheme

---

## Testing Checklist

### Core Functionality:
- [ ] Player can enter name on start screen
- [ ] Player name appears in share modal
- [ ] Character sprite changes based on movement direction
- [ ] Minimap follows player correctly
- [ ] NPC interaction prompt appears within 3-tile range
- [ ] Battle starts when pressing SPACE near NPC
- [ ] Questions display correctly with 4 choices
- [ ] Correct answers award +10 XP and damage guest
- [ ] Wrong answers deduct -10 HP and damage player
- [ ] Battle ends at 0 HP or 5 questions
- [ ] Victory animation plays on win
- [ ] Defeat animation plays on loss
- [ ] Guest marked as captured after victory
- [ ] XP bar updates and levels up correctly
- [ ] HP bar updates and changes color based on %
- [ ] Collection screen shows captured guests
- [ ] Share modal displays correct stats
- [ ] Share button copies to clipboard or uses native share

### Visual Testing:
- [ ] All sprites load correctly (no broken images)
- [ ] Text is readable at all screen sizes
- [ ] Buttons have proper hover effects
- [ ] Animations play smoothly (no stuttering)
- [ ] Layout fits within 100vh on desktop
- [ ] Minimap border and label visible
- [ ] HP bars show correct colors (green/yellow/red)

### Edge Cases:
- [ ] Empty name defaults to "Player"
- [ ] Can't walk through walls or NPCs
- [ ] Can't interact with already-captured NPCs
- [ ] Level up at exactly required XP
- [ ] HP can't go below 0
- [ ] Collection button works without any captures

---

## Contact & Handoff Notes

**Original Developer:** Claude (AI Assistant)
**Handoff Date:** January 20, 2026
**Project Status:** Functional MVP with core gameplay loop complete

**Critical Files to Review First:**
1. `src/App.vue` - Central game state management
2. `src/game/scenes/Overworld.js` - Main gameplay scene
3. `src/components/BattleScreen.vue` - Battle UI and logic

**Quick Start for New Developer:**
```bash
# 1. Clone/navigate to project
cd /Users/benmiro/Documents/PokeLenny/pokelenny-phaser

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open browser to http://localhost:8080
# 5. Enter a name and start playing!
```

**Important Notes:**
- All assets must be in `public/assets/` folder
- Phaser loads assets relative to `public/assets/` via `this.load.setPath('assets')`
- EventBus is crucial for Phaser ↔ Vue communication
- Player stats are managed in Vue (App.vue), not Phaser scenes
- Hard refresh (Cmd+Shift+R) required when changing image assets

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Vue App (App.vue)                    │
│  - Game State Management                                     │
│  - Player Stats (Level, XP, HP)                             │
│  - Collection Data                                           │
│  - Event Handling                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                    EventBus
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────┐      ┌──────────────┐     ┌─────────────┐
│ Phaser  │      │ BattleScreen │     │ ShareModal  │
│ Scenes  │      │   (Vue)      │     │   (Vue)     │
└─────────┘      └──────────────┘     └─────────────┘
    │
    ├─ Boot
    ├─ Preloader (loads assets)
    ├─ MainMenu (player name input)
    └─ Overworld (main gameplay)
```

---

## Version History

**v0.5 (Current)** - January 20, 2026
- Added directional character sprites
- Implemented XP and leveling system
- Added share modal with trainer card
- Improved start screen layout
- Removed all animations per design requirements

**v0.4**
- Added battle animations (transition, victory, defeat)
- Implemented stats bar and action buttons

**v0.3**
- Added minimap functionality
- Implemented NPC interaction system
- Created battle screen UI

**v0.2**
- Basic overworld with tile-based movement
- Collision detection
- Camera system

**v0.1**
- Initial Phaser + Vue setup
- Asset loading system

---

## License & Credits

**Game Assets:**
- Tuxemon tileset: Open source (Tuxemon project)
- Character sprites: Custom created
- Font: Press Start 2P by Google Fonts (SIL Open Font License)

**Libraries:**
- Phaser 3: MIT License
- Vue 3: MIT License
- Vite: MIT License

---

**End of Handoff Documentation**

For questions or clarifications, refer to inline code comments or create detailed documentation tickets.
