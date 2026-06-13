# Runes of Taborea — project context

A single-player, browser-based homage to *Runes of Magic* built with **three.js
+ Vite, vanilla JS, zero assets** — every model, texture, sound, and map is
procedural. See README.md for the player-facing feature list and controls,
PLAN.md for the roadmap.

## Run / build / deploy

- `npm run dev` → http://localhost:5173 (Vite)
- `npm run build` → `dist/` (static). `Dockerfile` = node build stage → nginx.
- **GitHub**: https://github.com/torquan/runes (public; Coolify pulls it).
- **Coolify**: app `runes-of-taborea` (uuid `xvokkgkxooy91q385gkmkdzv`) in
  project `runes`, instance `http://91.99.51.9:8000`, live at
  `http://xvokkgkxooy91q385gkmkdzv.91.99.51.9.sslip.io`. Deploy = push to
  `main`, then `GET /api/v1/deploy?uuid=<app uuid>` with a Bearer token
  (ask the user for a token; never commit or echo one). Poll
  `/api/v1/deployments/applications/<uuid>` → `.deployments[0].status`.

## Architecture (src/)

| File | Owns |
| --- | --- |
| `main.js` | bootstrap, game loop, input, zones/portals, save/load (localStorage), title screen wiring, secrets (vault/Madge/fishing/Konami), console helpers |
| `noise.js` | deterministic value noise; **`heightAt(x,z)` is the single source of truth for ground height everywhere** (terrain mesh, entity clamping, minimap, telegraphs). Pocket overrides: `CRYPT` flat floor (y=30, x 250–360 z −60..60), `SANCTUM` flat floor (y=40, x −60..60 z 250–360), `FROSTVEIL` glacial vale (x −360..−250 z −60..60), `HOLLOW` grotto-vale **height mesh** (x −60..60 z −360..−250, floor ≈13–14 + humps, grotto walls to +50), `HOROLOGIUM` flat floor (y=60, x 250–360 z 200–320 — SE of CRYPT, no overlap), `LARDER` flat floor (y=20, x 150–170 z −360..−340 — dead SW corner, touches nothing). **`ZONE_BOUNDS` here is the single truth for per-zone player/Dash clamps** (now incl. `hollow`/`horologium`/`larder`) |
| `world.js` | terrain, sky shader, lighting, camp, bandit camp, trial arenas, instanced scatter, secret props (Madge's hut, the pond, Bodo's cairn) |
| `dungeon.js` | the Sunken Crypt: walls (AABBs for player collision), portals, braziers, decor, the Hollow Wall vault (illusory door at x≈345.5 z±2 — split wall, NO collision box) |
| `frostveil.js` | the Frostveil (82–92): pocket terrain mesh, aurora/snowfall, gate-arch + sanctum-fissure portals (with `gate(game)` predicates), signposts; also owns the **Larder mound** (`larderMoundPos`, `openLarder()`) + the conditional `larderPortal` (added to `allPortals()` only after `secrets.pocket.larderOpen`) |
| `sanctum.js` | the Starfall Sanctum (96–105): crypt-style walls, orrery/star decor, exit portal, descent portal to the Hollow; the 6 constellation pillars incl. the **Grim ritual nodes** (`ritualNodes`, the dim→bright→flickering order) |
| `hollow.js` | the Verdant Hollow (106–118): south-pocket bioluminescent grotto-vale — own ground mesh, glowcap/bracket-fungus/glow-fern scatter, rising-spore particles, two glow-grove arches, sanctum↔hollow + Last Hour portals (with `gate(game)`), signposts |
| `horologium.js` | the Last Hour / Horologium dungeon (116–120): sanctum clone → `{update, walls, portals}`; brass-and-basalt clockwork tomb, wall AABBs (player collision), gear-disc/pendulum decor, sand-rain particles, exit portal |
| `larder.js` | the Larder secret pocket (x 150–170 z −360..−340, y20): clay urns (`urns[]`, 8k+12k gold loot-once + the Badger's Hoard relic urn); built every page-load as `looted:false`, restored from `secrets.pocket.urns` |
| `gathering.js` | procedural resource nodes (`herb/emberveins/rimecluster/starshard/sporepod` across world/highlands/frostveil/sanctum/hollow); F-interact gather cast, 60–120s respawn, `nodes[]` depletion persisted positionally by index (`nodesDepleted`, v5) |
| `achievements.js` | the "Konown" panel data: `ACHIEVEMENTS[]` (18 — 17 reward + completionist), `BESTIARY[]` (37 entries, '???'-masked until first kill), titles; `checkAchievements(game)` derives unlocks from `counters`/`slain`/`secrets` |
| `talents.js` | talents v2 "Deep Paths": 30-rank branch math, choice nodes (`choices{}`), Mastery Oath (`mastery`), `capstoneFor` oath-merged capstones — all effects DERIVED, never stored |
| `characters.js` | procedural rigs (`buildHumanoid(style)` w/ optional `skin`, boar/wolf w/ palettes, dragon, serpent) + animation drivers |
| `entities.js` | `ENEMY_TYPES` table, spawns, AI state machine, boss mechanics (telegraphs), summons |
| `player.js` | `CLASSES` (skills), player object (stats/jump/potions/dual-class), movement+camera, `SHOP` |
| `combat.js` | targeting, skill resolution, auto-attack, projectiles, damage/kills/loot, particle fx |
| `quests.js` | sequential quest chain + repeatable bounty, Barnaby dialogs (wares/bounty buttons) |
| `ui.js` | all DOM HUD: frames, hotbar/cooldowns, nameplates, floating text, minimap, shop, dialogs |
| `audio.js` | WebAudio synth sfx (no files); init requires a user gesture (class-select click) |

A single `game` object (created in `main.js`, exposed as `window.__game`) is
passed everywhere: `{ scene, camera, renderer, world, dungeon, highlands,
frostveil, sanctum, hollow, horologium, larder, gathering, enemies, npc,
gateNpc, npcs[], player, ui, fx, quests, highlandQuests, frostveilQuests,
sanctumQuests, hollowQuests, horologiumQuests, audio, input, classes, zone,
slain, gates, save() }`. Each questgiver npc carries its chain as `npc.chain`
(nameplate markers + the F-key dispatch): Greta Thornby→`hollowQuests`,
Tamsin Verge→`horologiumQuests`. Smith Halla (the craft bench) and Hermit Madge
are chain-less NPCs (F near them opens craft panel / riddles). The player object
also carries iteration-D/E fields: `counters{}` (per-kind kill tally — bestiary
+ achievements), `achievements{}`, `title`/`titles[]` (cosmetic, worn on the
char sheet), and `secrets{}` (see save list below).

## Conventions & gotchas (hard-won — do not relearn these)

- **Facing**: humanoid models face **+Z** (`rotation.y = atan2(dx, dz)`),
  beasts face **+X** (`atan2(-dz, dx)`). `entities.js` branches on
  `e.humanoid`.
- **Range is body-aware**: all player range/AoE checks add `reachOf(enemy)`
  (≈ `0.8 × group.scale.x`) so scaled-up bosses can be hit from where *they*
  stop to attack. Never compare raw center-to-center distance for melee.
- **Aggro has no line of sight** — it's pure distance and goes through walls.
  In tight dungeon layouts keep spawn points clear of walls and use small
  `aggroRadius` (8) + small `wanderR` (1.5) or you get invisible chain pulls.
- **Dungeon flow rules**: dungeon trash respawn is long (600s) so cleared
  rooms stay cleared during boss attempts; dungeon bosses get `leash: 80`
  (whole-dungeon) so kiting between rooms doesn't reset them.
- **Enemy type fields**: `leash` (default 32), `wanderR` (default 7),
  `respawn` (default elite 45 / trash 14), `mechanics[]` (telegraphed AoEs:
  `kind slam|zone|firepatch|sanctuary|beam|soak|tether|shatterfloor`,
  `center boss|player`, `avoid jump|move|in|dodge|flee`, warn/dodgeMsg),
  `summons {at:[hp fractions], kind, count}`, `temporary` (minions: removed,
  never respawn), `humanoid`, `elite`, `serpent` (routes through
  `animateSerpent`), `sporeling` (routes through `animateSporeling`), `armor`
  (flat per-hit reduction, ≤20% of an at-level player hit), `ccImmune` (see CC
  rule below), `enrageAt`/`enrageMult` (soft enrage, see below), `reveal`
  (mimics: render as a closed chest until aggro'd), `ranged`+`bolt*` (enemy
  projectiles), `mimicId` (placed mimics: persisted-cleared key).
- **Mechanics UX**: every telegraph = ground ring (or wedge/grid) + filling
  visual + center-screen banner + distinct sfx. Keep all four for anything new.
  `mechWarning` token map (ui.js): `{ jump:'JUMP!', move:'MOVE!', in:'GET IN!',
  dodge:'DODGE!', flee:'RUN!', enrage:'ENRAGE!' }`; sfx
  `warnJump`/`warnMove`/`warnIn`/`warnSweep`/`warnTether`/`warnShatter`.
  - `sanctuary` (avoid `'in'`) is INVERTED: inside the circle = safe, everywhere
    else eats the burst; jumping does not dodge it; warm color `0xfff2c0`.
- **The four Hollow-Hour mechanic kinds** (entities.js `castMechanic` +
  `updateTelegraphs`; every resolve branch sits BEFORE the generic dist check,
  like sanctuary):
  - `beam` — Sweeping Lance: rotating angular wedge (`length`, `halfArc`,
    `sweep` radians). Hit if `dist ≤ length` AND within `halfArc` of the final
    wedge angle. avoid `'dodge'` (sidestep perpendicular / Dash through the
    boss); **jump does NOT save you**.
  - `soak` — Shared Burden: avoid `'in'` (reuses GET IN! / `warnIn`) but ALWAYS
    damages — inside `dmg`, outside `unsoakedDmg` (≈2.4×, near-instant-kill).
    Differs from `sanctuary` (which deals zero inside).
  - `tether` — Anchor Chain: snapshots an `anchor{x,z}` at cast; break by
    distance — flee past **`breakDist` 10** (Dash is only 8u, so Dash alone
    can't trivialize it — sprint covers the rest). Staying snaps you back to
    the anchor (`pullBack`) and eats `dmg`. avoid `'flee'`; jump won't move you
    far enough.
  - `shatterfloor` — Collapsing Tiles: checker grid (`tile` edge, `parity`
    `'auto'`→alternates each cast via per-enemy `_shatterCount`). Hit if on a
    falling-parity tile AND grounded (air ≤ 0.7). avoid `'jump'` OR reposition
    to a safe tile (two answers — generous, because the capstone stacks it).
- **Enrage (soft)**: `enrageAt` (seconds of sustained combat, via `e.combatT`)
  + `enrageMult` (×1.6) — `enrageMul(e)` multiplies EVERY damage path (melee +
  every mechanic burst + lingers); telegraphs tint red (`0xff2a2a`), an
  `ENRAGE!` banner fires once (`_enraged` latch), and it resets on leash/reset.
  Khronaxis (L120) is the only user (200s). It caps fight length, not difficulty
  — a clean kill never sees it.
- **CC rule (`ccImmune`)**: EVERY elite/boss carries `ccImmune: true`. On them,
  stun/root/snare collapse to a flat **0.5s stagger** (`e.ccT`, hard cap — no
  perma-lock, no stat wall), shown as 'Staggered!'. **Interrupt and silence
  ALWAYS apply** (interrupt bumps `e.mechTimer` to ≥0.5s, cancelling an
  in-progress cast; silence sets `e.silenceT`). Trash (no `ccImmune`) takes the
  full stun/root/snare durations. The level-55 control skills (Shield Bash /
  Hamstring Shot / Frost Nova / Word of Stillness) all carry `interrupt: true`,
  so they stay useful against bosses even though the lockdown is staggered.
- **The balance model** (post-rebalance; derive everything from it):
  player at level L: `maxHp = 80+40L`, `maxMp = 50+16L`, `dmg = 7+3.5L`,
  DPS ≈ `2.2 × dmg`, heal throughput ≈ `10% of maxHp / sec`.
  XP: `xpForLevel(L) = 100 + 0.5·L^2.2`. Bosses: sustained dps ≈
  `0.08 × at-level maxHp` (sustain floor: `required maxHp ≈ dps / 0.10`),
  hp ≈ `TTK × at-level player DPS` (elite 30–60s, trial 90–150s, capstone
  ~200s), mechanic burst ≈ 35–45% of at-level maxHp (dodgeable, near-lethal).
  Kill XP ≈ levelCost × (3% trash / 15% endgame-zone+dungeon trash / 40%
  trial-elite / 60% capstone); elites pay **20% XP on repeat kills**
  (`game.slain`, persisted).
  Level band: chapter 1 → ~12, trials 25/30/37, crypt 41–55, Ashen Highlands
  55–75, Frostveil 82–92 (gate: pyraxis slain OR level 78), Starfall Sanctum
  96–105 (gate: hrimnir slain OR level 92), Verdant Hollow 106–118 (gate:
  noctyra slain OR level 102), The Last Hour 116–120 (gate: noctyra slain OR
  level 112). **Cap = Khronaxis 120** (killing him is what raises `LEVEL_CAP`
  to 120 in spirit; the const is 120 and the level loop guards
  `while (level < LEVEL_CAP && xp >= xpForLevel(level))`, zeroing residual xp
  at cap). Secret boss Grim, the Tax Collector sits at 119 (Sanctum ritual —
  pays loot/title, not XP). Note: levels 100→120 grant NO talent points
  (`talentPoints()` caps the level term at 99 — 90 ranks close the book).
- **Talents v2** ("Deep Paths"): 1 pt/level from 10; 3 branches × 30 ranks
  (90 total — the book closes at level 99); choice nodes at ranks 11/21
  (`spendTalent` returns `'choice'` WITHOUT spending → UI picker →
  `chooseTalent`); Mastery Oath at 25+ ranks (`swearMastery`, ONE ever,
  upgrades that branch's capstone in place via `capstoneFor` — same skill id).
  Talents grant throughput/sustain only — no passive DR, no dodge; Stoneform
  stays the single active DR window. Full-spend payoff ≈ +49%, sworn ≈ +57%.
  Respec = `freshTalents()`; price 100g/pt + 5,000g Oathbreaker's Toll if
  sworn. Transient buff timers (`spreeT/avengerT/slipstreamT/skystepT/
  undyingCd`) live on the player, never saved.
- **Crafting / gathering / sets** (items.js + gathering.js; Smith Halla's bench
  on `B`): `MATERIALS{}` (6, stack by `matId`) gathered from procedural nodes
  (F-interact). `RECIPES[]` = elixirs (timed throughput/utility buffs:
  speed/dmgPct/manaRegen/crit/healPct — **NO drink cooldown** by design),
  Hollowforge Kit (pick a slot → epic ilvl-115 roll), and **Reseal a Relic**
  (`reforgeUnique`, 25,000g + materials, +12% to every stat axis, once per
  unique via the `reforged` latch). 4 item `SETS{}` (hunters/warden/starbound/
  verdant) with 2pc/4pc bonuses folded into `totalEquippedStats` in ONE place
  (`item.setId` is the join key). **The no-DR / no-dodge rule is RESTATED and
  absolute**: elixirs, set bonuses, craft gear, and every gear axis are
  throughput/sustain only (`dmg/hp/crit/speed/healPower`) — zero mitigation
  exists in the gear type by policy. Stoneform stays the single active DR
  window; `armor` (flat per-hit, ≤20%) stays an enemy-only knob.
- **Difficulty philosophy (user's explicit stance)**: do **not** make content
  easier; fix jank (wall-aggro, leashes, range lies) instead. When the two
  conflict, ask.
- **Save**: localStorage key `runes-of-taborea-save`, schema `v:5`. `loadSave()`
  accepts `[1,2,3,4,5]`. v5 = v4 fields + the Hollow-Hour set:
  `hollowQuests`, `horologiumQuests` (serialized chains), `nodesDepleted`
  (gather-node depletion by index), `counters{}` (per-kind kill tally),
  `achievements{}`, `title`/`titles[]`, and an extended
  `secrets{vault, riddles, maps{}, pocket{larderOpen, larderLooted, urns[3]},
  ritual{step, done}, mimics{}}`. (v4 was: v3 fields + `talents{ranks,choices,
  mastery}`, `equipped.relic`, `mount`, `glow`, `secrets{vault,riddles}`,
  `frostveilQuests`, `sanctumQuests`.) Bump `v` and default-fill new fields on
  load when extending; keep old versions loadable. `ensureSecrets(p)` default-
  fills the secrets sub-objects on BOTH the new-game and saved paths (legacy
  `larderLooted` back-fills `urns` to all-true). v<4 talents still get the
  one-time full refund ("the Great Unlearning"). Console helpers:
  `window.__veteran('<class>')` (level-10 post-chapter-1),
  `__veteran2('<class>')` (level-90 post-Pyraxis, v5 seed at the expansion
  gate), `__veteran3('<class>')` (level-118 post-Vorthal, v5 seed at the Last
  Hour's mouth — Hollow chain done, dungeon fresh), `__give(slot, rarity,
  ilvl?)` (conjures GENERATED GEAR only — no materials/elixir path; craft those
  at the bench).
- **Zones**: `game.zone` is `'world' | 'crypt' | 'highlands' | 'frostveil' |
  'sanctum' | 'hollow' | 'horologium' | 'larder'`; `setZone()` in `main.js`
  swaps fog/sky/lights (pocket zones crush meadow lighting so their own lights
  carry — Hollow = warm-green grotto haze, Horologium = cold-blue tomb, Larder =
  dim amber). Player bounds clamp via `ZONE_BOUNDS` (noise.js, shared with
  Dash); wall collision is zone-gated in `player.js` (crypt →
  `game.dungeon.walls`, sanctum → `game.sanctum.walls`, horologium →
  `game.horologium.walls`). Hollow/larder are outdoor/open pockets (ZONE_BOUNDS
  clamp only, no wall AABBs). Pockets are far-away regions, NOT instances —
  same scene, same enemy list. The Ashen Highlands is a far world shelf
  (x≈178–205). Portals are `{x, z, label, dest, gate?(game), arriveMsg?}`
  collected from `dungeon/frostveil/sanctum/hollow/horologium .portals` in
  `main.js allPortals()`; the Larder's entry portal
  (`frostveil.larderPortal`) is concatenated ONLY when
  `secrets.pocket.larderOpen` (the knock puzzle has been solved — it never
  shows on the minimap).
- **Quests**: strictly sequential array in `quests.js` (`trial: true` entries
  don't gate the bounty). The repeatable bounty scales with player level.
- **Keybinds** (main.js `keydown`): the action bar dispatches through
  `BAR_KEYS` (player.js) — ONE shared slot-index→key map (`1`–`9`, `0`, `-`,
  `=`, `[` for idx 0–12) used by both the keydown handler and the bar's key
  labels, so they can never drift; a dual-classer with all three capstones
  fills all 13 slots. The level-55 control skill lands at bar idx 4 (key `5`)
  because it's the 5th entry in `cls.skills` (`barSkills()` =
  `allSkills()` + `capstones()`, `minLevel`-filtered). New panels:
  `B` → Smith Halla's craft bench (`toggleCraft`; guarded `konamiIdx !== 9` so
  the Konami code's 9th input `B` doesn't pop it), `K` → the "Konown"
  bestiary/achievements panel (`toggleAchievements`; collision-free, not in
  KONAMI). Both join the Escape close-stack. `F` is the universal interact
  (nearest questgiver < 5 wins, then Halla → craft, then gather node, then
  Madge, then the secret interactions — vault/larder mound/urns/ritual nodes/
  treasure dig — then portals).
- **Hidden layer** (the `secrets{}` save sub-object, default-filled by
  `ensureSecrets`): `secrets.pocket` = the Larder (`larderOpen` set by knocking
  F×3 within 6s on the frostveil mound at `frostveil.larderMoundPos`;
  `larderLooted`; `urns[3]` per-urn looted flags); `secrets.maps` = treasure
  maps keyed by clue (`'dug'` once dug; 5 dig spots across world/frostveil/
  highlands/crypt/sanctum, 2.5s F-dig cast); `secrets.ritual` = the Grim summon
  (`step`/`done`, dim→bright→flickering constellation-node order via
  `sanctum.ritualNodes`; `summonGrim` spawns the L119 boss, never two at once);
  `secrets.mimics` = cleared placed-mimic keys (`mimicId`). **Mimic load-time
  suppression**: placed mimics are seeded in `spawnEnemies` (which runs BEFORE
  the save is read), so a returning hero's already-cleared mimics are removed at
  the END of `startGame`'s load block (`for (e of enemies) if (e.mimicId &&
  secrets.mimics[e.mimicId]) removeEnemy(...)`). In-session they still respawn
  at the elite 45s timer, so `counters.mimic` can farm toward the
  `exterminator` title. Hermit Madge's riddles now reach **6**
  (`secrets.riddles`, +5 runes each from #4; #5 is the Grim ritual's hint).
- **HTML safety note**: `innerHTML` is used with developer-authored strings
  only (skills/quests/shop). Keep user-influenced text out of it.

## Testing workflow

Dev server in background + Chrome via chrome-devtools MCP:
`window.__game` for state, dispatch `KeyboardEvent`/`MouseEvent` for input,
teleport via `player.group.position.set(...)`, screenshot to eyeball the HUD.
Don't trust a fight test where the bot stood in a pack — check `player.alive`
before interpreting downstream assertions. Verify Vite build before deploying.
