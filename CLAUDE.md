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
| `noise.js` | deterministic value noise; **`heightAt(x,z)` is the single source of truth for ground height everywhere** (terrain mesh, entity clamping, minimap, telegraphs). Pocket overrides: `CRYPT` flat floor (y=30, x 250–360), `SANCTUM` flat floor (y=40, z 250–360), `FROSTVEIL` glacial vale (x −360..−250). **`ZONE_BOUNDS` here is the single truth for per-zone player/Dash clamps** |
| `world.js` | terrain, sky shader, lighting, camp, bandit camp, trial arenas, instanced scatter, secret props (Madge's hut, the pond, Bodo's cairn) |
| `dungeon.js` | the Sunken Crypt: walls (AABBs for player collision), portals, braziers, decor, the Hollow Wall vault (illusory door at x≈345.5 z±2 — split wall, NO collision box) |
| `frostveil.js` | the Frostveil (82–92): pocket terrain mesh, aurora/snowfall, gate-arch + sanctum-fissure portals (with `gate(game)` predicates), signposts |
| `sanctum.js` | the Starfall Sanctum (96–105): crypt-style walls, orrery/star decor, exit portal |
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
frostveil, sanctum, enemies, npc, gateNpc, npcs[], player, ui, fx, quests,
highlandQuests, frostveilQuests, sanctumQuests, audio, input, classes, zone,
slain, save() }`. Each questgiver npc carries its chain as `npc.chain`
(nameplate markers + the F-key dispatch).

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
  `kind slam|zone|firepatch|sanctuary`, `center boss|player`,
  `avoid jump|move|in`, warn/dodgeMsg), `summons {at:[hp fractions], kind,
  count}`, `temporary` (minions: removed, never respawn), `humanoid`, `elite`,
  `serpent` (routes through `animateSerpent`), `armor` (flat per-hit
  reduction, ≤20% of an at-level player hit).
- **Mechanics UX**: every telegraph = ground ring + filling disc +
  center-screen JUMP!/MOVE!/GET IN! banner + distinct sfx
  (`warnJump`/`warnMove`/`warnIn`). Keep all four for anything new.
  `sanctuary` (avoid `'in'`) is INVERTED: inside the circle = safe, everywhere
  else eats the burst; jumping does not dodge it; warm color `0xfff2c0`.
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
  96–105 (gate: hrimnir slain OR level 92), cap = Noctyra 105.
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
- **Difficulty philosophy (user's explicit stance)**: do **not** make content
  easier; fix jank (wall-aggro, leashes, range lies) instead. When the two
  conflict, ask.
- **Save**: localStorage key `runes-of-taborea-save`, schema `v:4`
  (v3 fields + `talents{ranks,choices,mastery}`, `equipped.relic`, `mount`,
  `glow`, `secrets{vault,riddles}`, `frostveilQuests`, `sanctumQuests`).
  Bump `v` and default-fill new fields on load when extending; keep old
  versions loadable (v<4 talents get a one-time full refund — "the Great
  Unlearning"). Console helpers: `window.__veteran('<class>')` (level-10
  post-chapter-1), `__veteran2('<class>')` (level-90 post-Pyraxis v4),
  `__give(slot, rarity, ilvl?)`.
- **Zones**: `game.zone` is `'world' | 'crypt' | 'highlands' | 'frostveil' |
  'sanctum'`; `setZone()` in `main.js` swaps fog/sky/lights (pocket zones
  crush meadow lighting so their own lights carry). Player bounds clamp via
  `ZONE_BOUNDS` (noise.js, shared with Dash); wall collision is zone-gated in
  `player.js` (crypt → `game.dungeon.walls`, sanctum → `game.sanctum.walls`).
  Pockets are far-away regions, NOT instances — same scene, same enemy list.
  The Ashen Highlands is a far world shelf (x≈178–205). Portals are
  `{x, z, label, dest, gate?(game), arriveMsg?}` collected from
  `dungeon/frostveil/sanctum .portals` in `main.js allPortals()`.
- **Quests**: strictly sequential array in `quests.js` (`trial: true` entries
  don't gate the bounty). The repeatable bounty scales with player level.
- **HTML safety note**: `innerHTML` is used with developer-authored strings
  only (skills/quests/shop). Keep user-influenced text out of it.

## Testing workflow

Dev server in background + Chrome via chrome-devtools MCP:
`window.__game` for state, dispatch `KeyboardEvent`/`MouseEvent` for input,
teleport via `player.group.position.set(...)`, screenshot to eyeball the HUD.
Don't trust a fight test where the bot stood in a pack — check `player.alive`
before interpreting downstream assertions. Verify Vite build before deploying.
