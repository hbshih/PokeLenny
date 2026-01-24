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

## Files to Update (expected)
- `src/game/scenes/Overworld.js` — transitions + segment handling
- `src/game/scenes/Preloader.js` — load larger map (if not already)
- `src/game/StageConfig.js` — stage ↔ segment mapping (if needed)
- `src/components/LevelComplete.vue` — “Map Unlocked” copy (if needed)
