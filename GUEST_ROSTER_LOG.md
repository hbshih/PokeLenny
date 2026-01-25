# Guest Roster Log

## Summary (Jan 25, 2026)
- Synced stage roster to the curated tier list (StageConfig is now the source of truth).
- Added alias/normalization mapping so guest names in StageConfig resolve to `questions.json` names.
- Added combined avatars for:
  - `Hamel Husain & Shreya Shankar`
  - `Jake Knapp + John Zeratsky`
- Updated GuestTitles to use the combined Jake+John group key.
- Collection + UI counts now use the StageConfig roster length.

## Current Roster Counts
- StageConfig total: **275**
- Failure is excluded.
- Shreya is part of **Hamel Husain & Shreya Shankar** (single combined guest).

## Single Source of Truth
The roster is defined in:
- `src/game/StageConfig.js` → `STAGE_CONFIG` (tier list)

The game now **derives counts and selections from StageConfig**:
- `GuestData.selectAllGuestsForFixedStages()` maps StageConfig → guests in `questions.json`
- UI counts (collection, stats) use `STAGE_CONFIG.flat().length`

## How to Add New Guests / Questions / Avatars

### 1) Add Questions (required)
Add the guest entry to:
- `public/assets/questions.json`
  - Ensure `guest` name matches what you want to use in StageConfig.
  - Include `questions` array (minimum 1 question).
  - Include `url` for episode if available.

### 2) Add to StageConfig
Add the guest name to a tier in:
- `src/game/StageConfig.js`
  - This is the canonical roster used for counts and selection.

### 3) Add Avatar
Place avatar file in:
- `public/assets/avatars/`
  - Filename format: `Full Name_pixel_art.png`
  - Example: `Jake Knapp + John Zeratsky_pixel_art.png`
  - These are loaded by Phaser using URL‑encoded filenames.

### 4) Update Guest Titles (optional but recommended)
Add an entry in:
- `src/game/GuestTitles.js`
  - Map the exact guest name → title/episode focus

### 5) Handling Combined Guests (collab episodes)
If a guest is a combined name in `questions.json`, ensure:
- `StageConfig` uses the same combined name, OR
- Add a mapping in `STAGE_NAME_ALIASES` (in `StageConfig.js`).

Also update avatar mappings in:
- `src/game/GuestData.js` → `generateAvatarPath()` → `collaborationMappings`

Examples:
- `Jake Knapp + John Zeratsky`
- `Hamel Husain & Shreya Shankar`

### 6) Validation Logs
On load, GuestData will log:
- Missing names (StageConfig not found in questions)
- Duplicate name mappings (same guest resolved from multiple tier entries)

Use those logs to fix name mismatches.

## Files Touched in This Update
- `src/game/StageConfig.js`
- `src/game/GuestData.js`
- `src/game/GuestTitles.js`
- `src/components/CollectionScreen.vue`
- `src/App.vue`
- `src/game/scenes/Preloader.js`
- `public/assets/avatars/Jake Knapp + John Zeratsky_pixel_art.png`
- `public/assets/avatars/Hamel Husain & Shreya Shankar_pixel_art.png`
