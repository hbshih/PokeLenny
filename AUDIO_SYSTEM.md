# Audio System Documentation

## Overview

PokéLenny now features a complete audio system with background music and sound effects that enhance the gaming experience. The audio system uses royalty-free 8-bit/chiptune music that matches the retro Pokemon aesthetic.

## Audio Files

All audio files are located in `/public/assets/audio/`

### Music Tracks

| File | Usage | Description | Duration |
|------|-------|-------------|----------|
| `music/menu-theme.ogg` | Main Menu | Uplifting opening theme for the title screen | Loops |
| `music/overworld-theme.ogg` | Overworld | Adventurous exploration music | Loops |
| `music/battle-theme.ogg` | Battle | Intense battle music | Loops |
| `music/victory-fanfare.ogg` | Victory | Short victory fanfare (plays once) | ~12 seconds |
| `music/victory-theme.ogg` | Victory (extended) | Full victory theme (not currently used) | Loops |

## Implementation

### Audio Loading

Audio files are loaded in `/src/game/scenes/Preloader.js`:

```javascript
this.load.audio('menu-music', 'audio/music/menu-theme.ogg');
this.load.audio('overworld-music', 'audio/music/overworld-theme.ogg');
this.load.audio('battle-music', 'audio/music/battle-theme.ogg');
this.load.audio('victory-fanfare', 'audio/music/victory-fanfare.ogg');
this.load.audio('victory-music', 'audio/music/victory-theme.ogg');
```

### Scene Music

#### MainMenu Scene (`/src/game/scenes/MainMenu.js`)

- **Music**: `menu-music`
- **Volume**: 0.5
- **Behavior**: Loops continuously, stops when transitioning to Overworld

```javascript
this.music = this.sound.add('menu-music', {
    loop: true,
    volume: 0.5
});
this.music.play();
```

#### Overworld Scene (`/src/game/scenes/Overworld.js`)

- **Music**: `overworld-music`
- **Volume**: 0.4
- **Behavior**:
  - Loops continuously during exploration
  - Pauses when battle starts
  - Resumes when battle ends

```javascript
this.music = this.sound.add('overworld-music', {
    loop: true,
    volume: 0.4
});
this.music.play();
```

#### Battle System (`/src/components/BattleScreen.vue`)

The BattleScreen Vue component uses the EventBus to communicate with Phaser for audio control:

**Events Emitted:**
- `play-battle-music` - When battle starts (after transition)
- `stop-battle-music` - When battle screen closes
- `play-victory-sound` - When player wins the battle

**Music Behavior:**
- Battle music (`battle-music`) loops at volume 0.5
- Victory fanfare (`victory-fanfare`) plays once at volume 0.6
- Overworld music resumes after battle ends

### EventBus Audio Architecture

The audio system uses EventBus for communication between Vue components and Phaser scenes:

```javascript
// BattleScreen.vue emits:
EventBus.emit('play-battle-music');
EventBus.emit('stop-battle-music');
EventBus.emit('play-victory-sound');

// Overworld.js listens:
EventBus.on('play-battle-music', () => { /* ... */ });
EventBus.on('stop-battle-music', () => { /* ... */ });
EventBus.on('play-victory-sound', () => { /* ... */ });
```

This architecture keeps audio management centralized in Phaser while allowing Vue components to trigger audio events.

## Audio Flow

### Gameplay Audio Flow

1. **Game Start**
   - Boot → Preloader (loads all audio)
   - MainMenu scene starts → Menu music plays

2. **Enter Overworld**
   - Menu music stops
   - Overworld music starts looping

3. **Battle Encounter**
   - Overworld music pauses
   - Battle music starts looping
   - Player answers questions

4. **Battle Victory**
   - Battle music stops
   - Victory fanfare plays (12 seconds)
   - Battle result screen shows

5. **Return to Overworld**
   - Battle screen closes
   - Overworld music resumes

6. **Battle Defeat**
   - Battle music stops
   - Battle result screen shows
   - Overworld music resumes when closed

## Volume Levels

Carefully balanced to prevent audio fatigue:

- **Menu Music**: 0.5 (50%) - Moderate for title screen
- **Overworld Music**: 0.4 (40%) - Lower to allow extended play
- **Battle Music**: 0.5 (50%) - Higher for intensity
- **Victory Fanfare**: 0.6 (60%) - Prominent celebration

## Attribution

### Music Credits

All music tracks are from the **"Generic 8-bit JRPG Soundtrack"** by **Avgvst**.

- **License**: Creative Commons Attribution (CC-BY 4.0)
- **Source**: [OpenGameArt.org](https://opengameart.org/content/generic-8-bit-jrpg-soundtrack)
- **Attribution Required**: Yes - "Music by Avgvst (OpenGameArt.org)"

**Original Track Names:**
- menu-theme.ogg = "01 - Opening"
- overworld-theme.ogg = "08 - Overworld"
- battle-theme.ogg = "13 - Danger"
- victory-fanfare.ogg = "21 - Fanfare"
- victory-theme.ogg = "17 - Victory"

## Future Enhancements

Potential audio improvements:

1. **Sound Effects** (sfx folder ready):
   - Button click sounds
   - Correct/wrong answer feedback
   - HP damage sounds
   - Menu navigation beeps
   - NPC encounter sounds

2. **Additional Music**:
   - Different battle themes for different guests
   - Boss battle music for special guests
   - Game over theme
   - Credits music

3. **Audio Settings**:
   - Master volume control
   - Music volume slider
   - SFX volume slider
   - Mute toggle

4. **Advanced Features**:
   - Audio crossfading between scenes
   - Dynamic music intensity based on HP
   - Spatial audio for NPCs
   - Web Audio API effects (reverb, filters)

## Troubleshooting

### Music Not Playing

1. **Check browser autoplay policy**: Some browsers block autoplay. User must interact with page first.
2. **Check console for loading errors**: Open DevTools and look for 404 or audio format errors
3. **Verify file paths**: Audio files must be in `/public/assets/audio/music/`
4. **Test audio format support**: OGG is widely supported, but Safari may need AAC/MP3

### Music Doesn't Stop/Resume

1. **Check EventBus listeners**: Ensure Overworld scene is listening to audio events
2. **Verify battleActive flag**: Input disabling and audio control use this flag
3. **Check for duplicate instances**: Multiple music instances can cause conflicts

### Performance Issues

If audio causes stuttering:
1. Reduce volume levels (lighter processing)
2. Use shorter music loops
3. Convert to lower bitrate files
4. Consider disabling music on low-end devices

## Technical Notes

- **Format**: OGG Vorbis (excellent compression, broad support)
- **Sample Rate**: 44.1 kHz (standard)
- **Bitrate**: Variable (~128-160 kbps average)
- **Total Size**: ~2.4 MB (5 music files)
- **Phaser Sound Manager**: Using Web Audio API (automatic fallback to HTML5 Audio)

---

**Last Updated**: 2026-01-21
**Status**: ✅ Fully Implemented
