# PokéLenny — Full Game Rules (Run Spec)

**Last updated:** 2026-01-24  
**Core concept:** Run-based quiz roguelite. Progress through maps by earning XP while managing HP. If you die, the run ends and you restart from the beginning.

---

## 1) Run Rules

- **Max HP:** `100`
- **HP carries over** across all opponents and maps within the run.
- **Game Over condition:** If **HP ≤ 0**, the we show the gameover modal. 
- **No farming within a run:** Once an opponent is defeated in the current run:
  - They **disappear for the rest of the run**
  - They are added to the player’s **Collection**

---

## 2) Encounter Rules

Each opponent encounter contains **3 questions**.
### 2.1 Per-question outcomes
- **Correct answer:** `+ XP_per_correct(Level)`
- **Wrong answer:** `-10 HP`

---

## 3) Special Rewards

### 3.1 Perfect Kill (per opponent)
A **Perfect Kill** happens when the player answers **all 3 questions correctly (3/3)**.

- **Perfect Kill XP:**  
  - Base XP from 3 correct answers = `3 × XP_per_correct(Level)`
  - Perfect Kill **doubles** the opponent’s total XP:
  - **PerfectKillXP = 2 × (3 × XP_per_correct(Level)) = 6 × XP_per_correct(Level)**
- **Perfect Kill Heal:** `+20 HP` (capped at Max HP = 100)

> Example (Level 1): XP_per_correct = 10 → Perfect Kill XP = 60 and +20 HP.

---

### 3.2 Bonus Question (per opponent)
Each opponent has a **1/20 (5%) chance** to contain **exactly one BONUS question** among its 3 questions. For the bonus question, we need to specially highlight that in the UI, and show there's bonus XP/HP

**If BONUS question is answered correctly:**
- **Bonus XP:** `+ 2 × XP_per_correct(Level)`
- **Bonus Heal:** `+10 HP` (capped at 100)

**If BONUS question is answered wrong:**
- Treat as a normal wrong answer: `-10 HP`

**Stacking rule:** Bonus rewards stack with Perfect Kill if the player still goes **3/3 correct**.

> Rare jackpot (BONUS + Perfect Kill):  
> XP = `6×XP_per_correct + 2×XP_per_correct = 8×XP_per_correct`  
> Heal = `+20 HP +10 HP = +30 HP` (cap 100)

---

## 4) Leveling & Map Unlock

### 4.1 Level ↔ Map
- **Level N corresponds to Map N**
- When you level up, the **next map unlocks immediately** (mid-run).

### 4.2 XP per correct answer (scales with Level)
Use a simple scaling curve with a cap for readability:

**XP_per_correct(Level) = min(10 + 5 × (Level − 1), 50)**

So:
- Level 1: 10
- Level 2: 15
- Level 3: 20
- ...
- Level 9: 50
- Level 10+: 50 (capped)

### 4.3 XP required to level up (per level)
**XP_to_next_level(Level) = 24 × XP_per_correct(Level)**

This keeps pacing consistent even as XP per answer increases.

### 4.4 Unlock thresholds (cumulative)
- `unlockXP[1] = 0`
- `unlockXP[level+1] = unlockXP[level] + XP_to_next_level(level)`

### 4.5 Unlock behavior
- When `runXP >= unlockXP[nextLevel]`:
  1) Player **levels up**
  2) **Next map unlocks immediately**
  3) Show **Level Up / Map Unlocked modal** (see section 5)

---

## 5) Level Up / Map Unlocked Modal (Required UI)

### 5.1 When to show
Show the modal **immediately** when:
- `runXP >= unlockXP[nextLevel]`
- and the player has **not yet unlocked that level** in the current run

### 5.2 Modal behavior
- Modal **pauses gameplay** until dismissed.
- After closing:
  - New map becomes available (By new map i mean a new connected map below, with oppoenent spawn)
  - New opponent pool becomes eligible to spawn/appear

### 5.3 Modal content (minimum)
**Title:** `LEVEL UP!` Show exact what they level 
**Subtitle:** `Map {N} Unlocked` (or map name/theme)

**Body (max 3 bullets):**
- `XP per correct answer: {oldXP} → {newXP}`
- `New opponents unlocked: +{count}` (typically +10; final map +3) - show who is unlocked (Name of them)

## 6) Opponent Staging (Content Buckets)

Total opponents: **283**  
Maps:
- **Maps 1–28:** 10 opponents each (280 total)
- **Map 29:** final 3 opponents

When Map N unlocks, the next batch of opponents becomes available to encounter.

## 8) Quick Reference (Cheat Sheet)

- **Correct:** `+XP_per_correct(Level)`
- **Wrong:** `-10 HP`
- **Perfect Kill (3/3):** `+6×XP_per_correct(Level)` and `+20 HP`
- **Bonus question chance:** `5% per opponent` (1/20)  
  - **Bonus correct:** `+2×XP_per_correct(Level)` and `+10 HP`
- **Max HP:** `100` (overheal is wasted)
- **HP ≤ 0:** Game Over → restart run, XP resets
- **Map unlock:** immediate upon reaching XP threshold
- **XP_per_correct:** `min(10 + 5×(Level−1), 50)`
- **XP_to_next_level:** `24×XP_per_correct(Level)`
