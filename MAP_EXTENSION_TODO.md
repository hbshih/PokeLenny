# Map Extension + Gamification TODO (Run Spec Alignment)

## Goal
Extend the current map vertically as the player levels up so the world grows from **1x1 → 2x1 → 3x1 …**, using the **existing larger tilemap** (same layout tiles). Players move **south** to reach newly unlocked areas.

Also update **gamification rules** to fully match `SIMPLE_GAMIFICATION.md` (XP scaling, perfect kill, bonus question, level unlock thresholds, and modal content).

---

## ✅ Requirements (from user)
- Use **existing tilemap** (same template/layout).
- Each level unlock adds a **new map segment below** the current one (vertical stacking).
- **Transition south** into the new area.
- **Every unlocked map** must be connected and reachable by walking.

---

## ✅ Gamification Rules (from SIMPLE_GAMIFICATION.md)
- **3 questions per opponent**
- **Correct:** `+ XP_per_correct(Level)`
- **Wrong:** `-10 HP`
- **Perfect Kill (3/3):** `+6×XP_per_correct(Level)` and `+20 HP` (cap 100)
- **Bonus Question:** 5% chance per opponent (1 of 3 questions)
  - Correct: `+2×XP_per_correct(Level)` and `+10 HP`
  - Wrong: `-10 HP`
  - Stacks with Perfect Kill
- **XP_per_correct(Level) = min(10 + 5×(Level−1), 50)**
- **XP_to_next_level(Level) = 24 × XP_per_correct(Level)**
- **Unlock Map immediately on XP threshold**
- **Game Over:** HP ≤ 0 → reset run (XP/HP) and restart

---

## Implementation Tasks

### A) Gamification & Leveling
- [x] Replace XP curve with `XP_per_correct` and `XP_to_next_level` formula.
- [x] Update per‑question XP gains to use `XP_per_correct`.
- [x] Implement **Perfect Kill** XP/HP bonuses on 3/3 correct.
- [x] Implement **Bonus Question** (5% chance) and bonus rewards.
- [x] Add **bonus UI highlight** on the bonus question (battle UI).
- [x] Ensure HP is capped at **100** after any heal.
- [x] Update **Level Up / Map Unlocked** modal content + layout.

### B) Map Extension / Segment System
### 1) Map data & layout
- [x] Use the **large map file** (`pokelenny-large-map.json`).
- [x] Treat the large map as **stacked copies** of the current map (vertical).
  - If not already stacked, generate/edit the large map so it contains **N vertical segments**.
- [x] Decide segment height in tiles (40 tiles per segment).

### 2) Overworld transitions
- [x] Allow **south edge** movement into the next segment.
- [x] Keep **north edge** movement to return to the previous segment.
- [x] Track current **segment index** (0-based) on the map.

### 3) Unlock gating
- [x] Only allow movement into segment **N+1** once **Level N+1 is unlocked**.
- [x] If player attempts to move south while locked, show a short message.

### 4) NPC spawning by segment
- [x] Spawn **only the 10 NPCs for the current level/segment** in that segment’s tile range.
- [x] When entering a segment, load/spawn its NPCs.
- [x] When leaving, despawn that segment’s NPCs (clear and respawn on entry).

### 5) Player positioning on transition
- [x] When moving south, place the player at the **top edge** of the next segment.
- [x] When moving north, place at the **bottom edge** of the previous segment.

### 6) UI / UX
- [x] Update mini‑map or HUD (if present) to show **current segment / map level**.
- [x] Add a subtle **“Area locked”** message when trying to enter a locked segment.

### 7) Testing
- [ ] Level up to unlock map segment.
- [ ] Walk south and confirm transition works.
- [ ] Confirm NPCs spawned match the level’s opponent list.
- [ ] Confirm you cannot walk into locked segments.
- [ ] Verify XP/HP changes match spec (correct, wrong, perfect, bonus).

---

## Implementation Log (Map Extension)

**Summary:** Implemented vertical segment system on the existing large map, gated by level unlocks, with NPCs spawning only in the current segment and “locked” messaging at boundaries.

**Files touched:**
- `src/game/scenes/Overworld.js`
- `src/game/GuestData.js`

**Changes applied:**
1) **Segmented world bounds**
   - Added `segmentHeight = 40`, `segmentWidth = 40`
   - Computed `totalSegments` from map height
   - Camera/minimap bounds now clamp to unlocked segments only

2) **Movement gating**
   - South movement only allowed if `currentSegment + 1 < unlockedLevel`
   - North movement allowed back to previous segment
   - Edges (north/west/east) show “Area locked” message

3) **NPC spawning scoped to current segment**
   - Spawn X within `segmentWidth`
   - Spawn Y within current segment slice only
   - Skip already‑captured guests
   - Increased placement success (lower spacing, more attempts)

4) **Unlock tracking**
   - `unlockedLevel` updated by `spawn-next-level`
   - `currentSegment` drives which opponents are spawned

5) **HUD**
   - Added top-left “Map X / Y” label to show current segment and unlocked count

6) **Guest filtering / avatar mapping**
   - Excluded non‑people episodes from guest list (EOY Review, Interview Q Compilation, Teaser_2021)
   - Normalized avatar mappings for updated filenames (e.g., Yuhki Yamashita, Alex Hardiman)

7) **Debug controls**
   - Added `]` key to instantly grant enough XP to unlock the next level

**Note on avatars:** You’ve added new avatar assets (see message list). If any still show fallbacks, we can run a quick mismatch report and align naming.

---

## Implementation Log (World 2 / Desert Map Integration)

**Summary:** Added a second world map (`desert-map`) for stages 4–6 and introduced multi‑world transitions (3 segments per world). Implemented safer asset loading and scene event cleanup to prevent crashes on map swaps.

**Files touched:**
- `src/game/scenes/Preloader.js`
- `src/game/scenes/Overworld.js`

**New assets (local):**
- `public/assets/tilemaps/desert.json`
- `public/assets/tilemaps/tmw_desert_spacing.png`

**Asset source + placement notes:**
- The desert map/tiles were originally from the Phaser examples:
  - Map: `https://cdn.phaserfiles.com/v355/assets/tilemaps/maps/desert.json`
  - Tiles: `https://cdn.phaserfiles.com/v355/assets/tilemaps/tiles/tmw_desert_spacing.png`
- CDN access may fail in some environments, so **download once and store locally** under `public/assets/tilemaps/`.
- Verify the JSON `tilesets[0].name` matches `WORLD_CONFIGS.tilesetName` (for desert: `Desert`).

**What broke / errors observed:**
1) **`No map data found for key desert-map` / `Texture key "desert-tiles" not found`**
   - Root cause: desert map/tiles were loaded from CDN, but network access failed in the environment.
   - Fix: load both assets locally from `assets/tilemaps/` and track successful load in the registry.

2) **`Invalid Tilemap Layer ID: Ground` / empty layer list**
   - Root cause: the scene started before the tilemap was available, so no layers were created.
   - Fix: added guards for missing map + tileset and fall back to the large map if needed.

3) **`Tilemap Layer ID already exists: Ground`**
   - Root cause: the desert map only has one layer (`Ground`), but the code attempted to create both a below‑layer and world‑layer with the same name.
   - Fix: if `belowLayerName === worldLayerName`, skip the below layer and create `Ground` only once.

4) **`Uncaught TypeError: Cannot read properties of null (reading 'drawImage')`**
   - Root cause: `EventBus` listeners persisted across scene restarts and fired against a destroyed scene/graphics context.
   - Fix: store handlers in `this.eventHandlers`, unregister them on `shutdown`, and guard UI updates with `sys.isActive()` checks.

**Key design decisions:**
- **3 segments per world**, so:
  - World 1 → stages 1–3 (existing large map)
  - World 2 → stages 4–6 (desert map)
- **Transition south** at the end of a world when next level is unlocked.
- **World availability check** prevents transition if desert assets aren’t loaded.

**Debug helpers added:**
- `L` → increment `unlockedLevel` by 1 (logs to console)
- `J` → jump to the highest unlocked segment within available worlds (logs target world/segment)

**How to add a new world (repeatable steps):**
1) Put new map + tileset in `public/assets/tilemaps/` and ensure the tileset name inside the JSON matches `tilesetName`.
2) Add a new entry in `WORLD_CONFIGS` with:
   - `key`, `tilesetName`, `tilesKey`, and the correct layer names (or allow fallback via `resolveLayerName`).
3) Update `Preloader` to load the new map + tiles locally.
4) Confirm `layerNames` do not collide (only create each layer once).
5) Test transitions with debug keys (`L`, `J`) before walking.

**Current status:** World 2 loads and transitions correctly with local assets in place.

---

## Implementation Log (World Scaling / Future Maps Ready)

**Summary:** Added guardrails so the game can unlock stages beyond current worlds without crashing, and prepared transition logic for future maps (even before their assets are added).

**Files touched:**
- `src/game/scenes/Overworld.js`

**What changed:**
1) **World bounds + transitions are now clamped**
   - Added `getMaxWorldLevel()` to compute total available stages based on `WORLD_CONFIGS.length`.
   - Movement into later worlds now checks `maxAvailableLevel`, so you can unlock stages beyond available maps without error.

2) **Unlock gating respects available worlds**
   - `updateSegmentView()` and south-transition logic now clamp to the highest **available** level.
   - If a player tries to move into a world that doesn’t exist yet, they see `New map coming soon`.

3) **Debug keys safe for future worlds**
   - `J` jump now clamps to the highest available world, no more overshooting into missing maps.

**Why this matters:**
- You can continue extending stages (XP unlocks) while new maps are still being prepared.
- When you add new map JSON + tiles, the world will immediately become reachable.

---

## Files to Update (expected)
- `src/game/scenes/Overworld.js` — transitions + segment handling
- `src/game/scenes/Preloader.js` — load larger map (if not already)
- `src/game/StageConfig.js` — stage ↔ segment mapping (if needed)
- `src/components/LevelComplete.vue` — “Map Unlocked” copy (if needed)

---

## Refactor Note (Overworld Structure)

**Summary:** Overworld scene was split into focused helpers to make future map/world work easier without changing gameplay.

**New structure:**
- `src/game/scenes/Overworld.js` — orchestrator (scene lifecycle, movement, NPC logic)
- `src/game/scenes/overworld/worldConfig.js` — world definitions + `getMaxWorldLevel`
- `src/game/scenes/overworld/ui.js` — segment HUD, camera bounds, locked message
- `src/game/scenes/overworld/events.js` — EventBus wiring + cleanup
- `src/game/scenes/overworld/debug.js` — debug `L`/`J` handlers

**Why this matters:** adding new worlds now usually only requires editing `worldConfig.js` and adding assets, without touching UI/event wiring.

---

## Implementation Log (Simplified World Cycling)

**Summary:** Simplified world progression to cycle between the two existing maps (Tuxemon and Desert) indefinitely, avoiding the need to create/source new maps for each world.

**Files touched:**
- `src/game/scenes/Preloader.js`
- `src/game/scenes/Overworld.js`
- `src/game/scenes/overworld/worldConfig.js`

**What changed:**
1) **Removed World 3 (cybernoid)** from `WORLD_CONFIGS`
   - Kept only two worlds: Tuxemon and Desert
   - Added comment explaining cycling pattern

2) **Cleaned up asset loading** (`Preloader.js`)
   - Removed cybernoid asset loading
   - Removed cybernoid availability tracking
   - Simplified to just track desert assets

3) **Updated world availability check** (`Overworld.js`)
   - Removed cybernoid-specific checks
   - Back to just checking desert availability

4) **Deleted assets**
   - Removed `cybernoid.json` and `cybernoid.png`
   - Removed all preview PNG files

**World progression (repeating pattern):**
- **Stages 1–3** → Tuxemon (grass/town)
- **Stages 4–6** → Desert
- **Stages 7–9** → Tuxemon (repeat)
- **Stages 10–12** → Desert (repeat)
- **Stages 13–15** → Tuxemon (repeat)
- ... and so on indefinitely

**Why this approach:**
- Simpler to maintain (no need to find/create new maps)
- Players experience variety every 3 stages
- Existing maps are already well-tested
- Easy to understand pattern

**Testing with debug keys:**
- `L` → Increment unlocked level by 1
- `J` → Jump to highest unlocked segment

**Current status:** Simplified cycling system in place. Game will alternate between Tuxemon and Desert maps indefinitely.
