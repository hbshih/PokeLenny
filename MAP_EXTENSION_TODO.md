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
- [ ] Confirm the **large map file** to use (likely `pokelenny-large-map.json`).
- [ ] Ensure the large map is built as **stacked copies** of the current map (vertical).
  - If not already stacked, generate/edit the large map so it contains **N vertical segments**.
- [ ] Decide segment height in tiles (e.g., `mapHeight` from the base map).

### 2) Overworld transitions
- [ ] Add logic in `Overworld.transitionMap()` to allow **south edge** movement into the next segment.
- [ ] Keep **north edge** movement to return to the previous segment.
- [ ] Track current **segment index** (0-based) on the map.

### 3) Unlock gating
- [ ] Only allow movement into segment **N+1** once **Level N+1 is unlocked**.
- [ ] If player attempts to move south while locked, show a short message (“Area locked — Level Up to continue”).

### 4) NPC spawning by segment
- [ ] Spawn **only the 10 NPCs for the current level/segment** in that segment’s tile range.
- [ ] When entering a segment, load/spawn its NPCs.
- [ ] When leaving, either:
  - despawn that segment’s NPCs (performance), or
  - keep them alive but don’t show outside viewport.

### 5) Player positioning on transition
- [ ] When moving south, place the player at the **top edge** of the next segment.
- [ ] When moving north, place at the **bottom edge** of the previous segment.

### 6) UI / UX
- [ ] Update mini‑map or HUD (if present) to show **current segment / map level**.
- [ ] Add a subtle **“Map {N} Unlocked”** toast or modal when the segment becomes available.

### 7) Testing
- [ ] Level up to unlock map segment.
- [ ] Walk south and confirm transition works.
- [ ] Confirm NPCs spawned match the level’s opponent list.
- [ ] Confirm you cannot walk into locked segments.
- [ ] Verify XP/HP changes match spec (correct, wrong, perfect, bonus).

---

## Files to Update (expected)
- `src/game/scenes/Overworld.js` — transitions + segment handling
- `src/game/scenes/Preloader.js` — load larger map (if not already)
- `src/game/StageConfig.js` — stage ↔ segment mapping (if needed)
- `src/components/LevelComplete.vue` — “Map Unlocked” copy (if needed)
