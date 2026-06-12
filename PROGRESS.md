# Expansion build log

Working log for the post-Noctyra major expansion. One entry per iteration;
each iteration ends in a green `vite build` and a commit.

## Plan of record

| # | Iteration | Status |
| --- | --- | --- |
| 1 | Design pass → `EXPANSION.md` spec ("The Hollow Hour", 106–120) | ✅ done |
| 2 | **A** — The Verdant Hollow zone (106–118): mobs, Greta's chain, Vorthal | ✅ done |
| 3 | **B** — The Last Hour dungeon (116–120): 4 NEW mechanic kinds, cap → 120 | ✅ done |
| 4 | **C** — Crafting/gathering + item sets + new class skills | ✅ done |
| 5 | **D** — Achievements/Bestiary panel (K) + titles | ✅ done |
| 6 | **E** — Hidden layer: the Larder, treasure maps, mimics, Grim, riddles | ✅ done |
| 7 | Balance audit, smoke test, docs (README/PLAN) | pending |

Orchestration: one multi-agent workflow per iteration (Opus subagents),
parallel authors on disjoint new files → single integrator for hub files
(`main.js`, `entities.js`, `ui.js`, `player.js`) → build + adversarial review
→ fix loop → commit.

## Log

### Iteration 1 — design pass (2026-06-12) ✅

- Ran `expansion-design` workflow: 5 parallel codebase readers (1 lost to an
  API overload; designers compensated by reading source directly) →
  4 parallel content designers → 1 synthesizer. ~750k subagent tokens.
- Output: `EXPANSION.md` (1745 lines) — **The Hollow Hour**, levels 106–120:
  - **A** The Verdant Hollow (south pocket x −60..60, z −360..−250, own
    ground mesh): bioluminescent grotto-vale, 6 mob families incl. a new
    sporeling rig, elite Spireshade L116, world boss Vorthal L118,
    Greta Thornby's 8-step chain + bounty, ilvl 106–120 tier + 4 uniques.
  - **B** The Last Hour (Horologium pocket x 250..360, z 200..320, floor
    y 60): 4 brand-new mechanic kinds (`beam` sweep / `soak` shared-burden /
    `tether` snap-by-distance / `shatterfloor` tiles), bosses Quaranth L116,
    Echo L118, Khronaxis L120 (the game's only enrage timer; raises cap
    to 120 via `LEVEL_CAP`), Tamsin Verge's chain, relic BiS "The Last Hour".
  - **C** Crafting/gathering (`gathering.js`, Smith Halla, panel on B),
    4 item sets via `totalEquippedStats`, 1 new control skill per class at 55
    (bosses `ccImmune` → 0.5s stagger; interrupts still work).
  - **D** Bestiary/Achievements panel on K (~17 achievements), cosmetic
    titles on the character sheet.
  - **E** Hidden layer: the Larder secret pocket (x 150..170, z −360..−340,
    knock puzzle, off all maps until found), 5 treasure maps with prose
    clues + dig cast, Mimic ambush elite, Grim the Tax Collector L119
    (Sanctum ritual), 3 new Madge riddles.
  - ONE save bump v4 → v5 collecting every new field; geography verified
    against `noise.js` (heightAt checks x AND z, no pocket overlaps).
- Committed with this log entry.

### Iteration 2 — A: The Verdant Hollow (2026-06-12) ✅

- Workflow `iteration-a-verdant-hollow`: planner (binding interface
  contracts) → 4 parallel authors with strict file ownership → integrator
  (hub wiring + save v5) → build + adversarial review + Chrome smoke test.
  13 agents, ~940k subagent tokens. Integrator agent crashed to an API
  overload *after* landing its wiring; fix rounds + smoke confirmed it.
- Shipped: `src/hollow.js` (south-pocket grotto-vale: emerald moss floor,
  bracket-fungus shelves, magenta glowcaps, glow-pools, olive-black sky),
  HOLLOW pocket + heightAt profile + ZONE_BOUNDS in `noise.js`, sporeling
  rig + verdant palettes in `characters.js`, 6 ENEMY_TYPES families +
  Mother-Bloom elite Spireshade L116 + world boss Vorthal L118 in
  `entities.js`, ilvl 106–120 tier + 4 uniques in `items.js`, Greta
  Thornby's 8-step chain + bounty in `quests.js`, zone/portal/minimap/save
  wiring in `main.js`/`ui.js`/`sanctum.js` (descent portal from the
  Sanctum, gate: Noctyra slain OR level 102). Save schema → **v5** with
  ALL Hollow-Hour fields default-filled (later iterations ride it).
- Smoke test (Chrome, real portal flow): zone entry, ground clamping, all
  6 families at spec HP, single-pull kill with exact spec XP, Greta dialog
  + accept, v5 save/load roundtrip, zero console errors.
- Post-review fix applied by orchestrator: moved `spireshade` from
  ELITE_NAMED → EXPANSION_BOSSES (spec §A.8 drop tier, hrimnir precedent).
- Known cosmetic quirks (accepted): Sanctum return point sits 2u from the
  descent portal (F-triggered, no loop); Hollow arrival is on the steep
  entry ramp (frostveil idiom).

### Iteration 3 — B: The Last Hour (2026-06-12) ✅

- Workflow `iteration-b-last-hour` (17 agents, ~1.36M subagent tokens):
  planner → 4 parallel authors (engine / shell / loot / story) → integrator
  → 3 full fix rounds until review-clean. The in-workflow smoke slot was
  consumed by fix rounds, so a dedicated smoke agent ran afterwards: PASS.
- Shipped: `src/horologium.js` (brass-and-basalt clockwork tomb, wall
  AABBs, orrery decor, exit portal), HOROLOGIUM pocket (x 250–360,
  z 200–320, floor y 60) + bounds in `noise.js`, dungeon entry at the
  Hollow's spiral center (gate: Noctyra slain OR level 112).
- **Four brand-new mechanic kinds** in the telegraph engine
  (`entities.js`), each with full ring+disc+banner+sfx UX:
  `beam` (rotating wedge, DODGE!), `soak` (GET IN!, absence pays 2.4×),
  `tether` (RUN!, snap at 10u — Dash 8u alone can't trivialize it,
  staying snaps you back to the anchor), `shatterfloor` (checker tiles,
  JUMP!). Plus the game's first **enrage timer** on Khronaxis (200s,
  ×1.6 melee+mechanics, red-tinted telegraphs, resets on leash).
- Bosses: Quaranth, the Unwound (L116, beam), Echo of the First Minute
  (L118, tether+soak), **Khronaxis, the Hour That Was Kept (L120)** —
  killing him raises `LEVEL_CAP` to 120 (gainXp guard, xp pinned at cap).
  Tamsin Verge's descent chain + bounty; dungeon drop tier + relic BiS
  "The Last Hour"; `__veteran3('<class>')` console seed (L118
  post-Vorthal).
- Smoke evidence (exact numbers): beam eaten 1888 vs dodged 0; tether
  stayed 1920 + pull-back vs snapped 0; soak inside 1824 vs outside 4378
  (=2.4×); shatterfloor grounded 2098 vs airborne 0; enraged hit
  3357 = 2098×1.6; cap stop at 120 over 8 XP grants; v5 roundtrip;
  zero console errors.
- Orchestrator post-fixes: exit-portal arrival nudged off Tamsin's model
  (2.5, −329); entry cogwraith pack moved z216→221 so the arrival swirl
  is outside its aggro radius (jank fix, not a nerf — pack still guards
  the entry corridor).

### Iteration 4 — C: Crafting + Sets + Class skills (2026-06-12) ✅

- Workflow `iteration-c-crafting-sets-skills` (11 agents, ~1.12M tokens):
  planner → 3 parallel authors (gather / itemsys / skills) → integrator →
  interleaved review+smoke loop. Build green, zero blockers, smoke PASS.
- **Gathering** (`src/gathering.js`): procedural resource nodes across
  zones (incl. Hollow spore-pods), F-interact with cast feel, 120s
  respawn, depletion persists positionally via `nodesDepleted` (v5).
- **Crafting**: Smith Halla's Bench on key B — materials as stacking
  items, elixirs (speed/dmgPct/manaRegen/crit/healPct — audited: zero
  damage-reduction anywhere), Hollowforge Kit (pick a slot → epic
  ilvl-115 roll), the 25k-gold relic reforge (+12%, once per unique,
  latched). Arbitrage-safe: crafted sell values ≪ material cost
  (30,448g kit → 223g sell).
- **Item sets**: 4 sets with 2pc/4pc bonuses folded into
  `totalEquippedStats` in one place; tooltips + character sheet display
  (e.g. Vestments of the First Spring 2pc = +6% healPower). Clean
  unequip, set re-applied from setId on load.
- **Class skills**: one control active per class at level 55 (bar idx 4 /
  key 5; dual-class secondary lands at idx 11 / key =). Trash: real
  stun/root (1.5s). Bosses/elites: ALL 18 elite-tier enemies carry
  `ccImmune` → 0.5s stagger; interrupt skills still cancel casts
  (verified atomically: 3 telegraph meshes removed by one Shield Bash).
- Smoke evidence: gold/material deltas exact on craft; +763 hp on equip;
  set bonus 0→0.06→0 across equip/unequip; v5 roundtrip incl. learned
  skills/materials/sets; console clean (one non-reproducing
  BufferGeometry-NaN transient noted, not traceable to C's diff).
- Orchestrator post-fix: KeyB no longer toggles the craft panel when B
  is consumed as the Konami sequence's 9th input (konamiIdx===9 guard).
- Design note (accepted): elixirs have no drink cooldown → perpetual
  single-buff uptime is the steady state; the lever if ever needed is a
  drink cd, never DR.

### Iteration 5 — D: Bestiary & Achievements + titles (2026-06-13) ✅

- Workflow `iteration-d-achievements` (7 agents, ~480k tokens): planner →
  2 parallel authors (logic / presentation) → integrator → verify loop.
  Build green, zero blockers, smoke PASS on first verify round.
- Shipped: `src/achievements.js` — 22 achievements ("Konown" panel on K,
  mirrors char-sheet idiom), bestiary over per-kind kill `counters`
  (37 entries, '???' masked until first kill), cosmetic titles worn on
  the character sheet, unlock toast + badge nudge, throttled ~1s
  `checkAchievements` tick + instant checks at vault/riddle/carp/kill
  sites. Counters/achievements/title/titles persist in v5; default-fill
  at the load seam keeps every older save and veteran helper crash-free.
- Idempotent by design: re-load re-derives boss achievements from `slain`
  without re-toasting; stripped pre-D saves self-heal.
- Intentional interim state: 5 achievements (madge_six, bitten,
  exterminator, settled, hoardfinder, cartographer cluster) reference
  Iteration-E content and stay locked-but-safe until E ships next.
- Orchestrator post-fix: K-badge 'has-news' glow now clears when the
  panel opens (was permanent once lit).

### Iteration 6 — E: The hidden layer (2026-06-13) ✅

- Workflow `iteration-e-hidden-layer` (17 agents, ~1.58M tokens): planner
  → 3 parallel authors (pocket / monsters / treasure) → integrator →
  verify loop. Build green, zero blockers, smoke PASS.
- **The Larder** (`src/larder.js`, pocket x 152..168, z −358..−342,
  floor y 20): a thawed trapdoor cache found by knocking three times
  within 6s on an unmarked frostveil mound — wrong timing resets. Portal
  joins `allPortals()` only after `secrets.pocket.larderOpen`; minimap
  never advertises it. Inside: clay urns (8k + 12k gold, loot-once),
  The Badger's Hoard vanity relic + the Hoardfinder title.
- **Treasure maps**: rare drops carrying prose clues; 5 dig spots across
  world/frostveil/highlands/crypt/sanctum; 2.5s F-dig cast → chest +
  gold + generated item; re-dig refused; cartographer achievement counts
  distinct dug keys.
- **Mimics**: disguised chests seeded in dungeons (no nameplate until
  revealed), L60 elite ccImmune ambush; killed placed-mimics persist via
  `secrets.mimics` and are removed on load (mechanism moved spawn-time →
  load-time deliberately: spawnEnemies runs pre-save-read; in-session
  45s respawn keeps `exterminator` farmable).
- **Grim, the Tax Collector** (L119, 140k hp, ccImmune): summoned at the
  Sanctum dais by pressing the constellation nodes dim → bright →
  flickering (matches Madge's riddle #5); drops The Final Invoice;
  summons collateral mimics at 50%; re-summon allowed, never two at once.
- **Madge riddles 4–6** (boar / dim-bright-flickering / chest / knock
  thrice): `secrets.riddles` now reaches 6, +5 runes each from #4.
- All five dormant D achievements now earnable — smoke run finished at
  10/18 with titles (Hoardfinder, the Settled, Madge-Approved) worn.
- Orchestrator post-fixes: Larder HUD zone name + minimap pocket tint
  added; dead `makeTreasureMap`/`TREASURE_MAPS` imports trimmed.
- Accepted deviations (documented in code): Grim's invoice drops on
  every kill (vanity-tier, dupe-safe); `secrets.ritual.done` persisted
  but unread (achievement keys off slain); disguised mimics are
  targetable-but-silent (reads as intended tension).
