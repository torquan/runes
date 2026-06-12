# The Hollow Hour — expansion spec (levels 106–120)

> A single coherent expansion merged from four designer drafts (zone, dungeon +
> mechanics, systems, hidden layer). This file is the implementation-ready
> source of truth. Every number derives from the balance model in CLAUDE.md;
> nothing here is invented. Build it in the iteration order below — A → E.

## 0. Reconciliation summary (every conflict resolved)

The four drafts described two *different* zones (a "Verdant Hollow" 106–118 and
an assumed "Hourglass Abyss" with NPC Tamsin Verge) feeding one capstone
dungeon. They are merged as follows — read this before anything else.

### 0.1 Geography & the single arc

There is **one** outdoor leveling zone, **the Verdant Hollow** (106–118, south
pocket), and **one** capstone dungeon, **The Last Hour / the Horologium**
(116–120, raises the cap to 120). The dungeon designer's "Hourglass Abyss" is
NOT a separate zone — it is folded into the Hollow as the zone's deepening
theme: the Hollow's spiral tightens toward a clockwork tomb buried beneath it.
Both questgivers live in the Hollow:

- **Greta Thornby** (botanist-in-exile) runs the 106–118 leveling chain + bounty
  (the surface vale, mob culls, world boss Vorthal).
- **Tamsin Verge** (the time-broken survivor) runs the dungeon chain + bounty
  (the descent into the Horologium, the three clockwork bosses, the cap-raise).
  She stands at the Hollow's deepest signpost (z ≈ −332, the spiral's center),
  and her chain *gates the dungeon entry portal*.

This keeps every word of flavor both designers wrote and gives the zone a
two-act shape: surface (grow-back horror) → depths (time-keeping tomb).

### 0.2 Pocket-zone bounds (verified non-overlapping)

Existing pockets (noise.js): CRYPT `x250–360 z−60..60 y30`, SANCTUM
`x−60..60 z250–360 y40`, FROSTVEIL `x−360..−250 z−60..60`, HIGHLANDS shelf
`x178–205` (continuous world box). New pockets:

| pocket | bounds | floor | notes |
| --- | --- | --- | --- |
| `HOLLOW` (outdoor) | `x−60..60, z−360..−250` | height-mesh (≈13–14 + humps), walls to +50 | south mirror of SANCTUM; own ground mesh |
| `HOROLOGIUM` (dungeon) | `x250..360, z200..320` | flat `y60` | far SE of CRYPT (z200–320 vs crypt z−60..60); no overlap |
| `LARDER` (secret) | `x150..170, z−360..−340` | flat `y20` | **MOVED** off the original draft's `x−350..−330 z−50..−30`, which sat *inside* FROSTVEIL — collision fixed; new spot is empty world-edge SW of nothing |

**Conflict fixed:** the hidden-layer draft placed the Larder at `x−350..−330,
z−50..−30`, which is inside FROSTVEIL (`x−360..−250 z−60..60`). Moved to
`x150..170 z−360..−340` (a dead corner past the meadow's z-edge, touching
nothing). Its discovery mound and signpost still live *in* the Frostveil vale
(they only place a prop + a conditional portal there; the destination room is
the relocated pocket). HOROLOGIUM `z200..320` does not overlap CRYPT `z−60..60`
despite sharing the `x250..360` band.

`ZONE_BOUNDS` (noise.js, the player/Dash clamp truth) gains:
```js
hollow:     { x1: -58, x2: 58, z1: -358, z2: -252 },
horologium: { x1: 252, x2: 358, z1: 202, z2: 318 },
larder:     { x1: 152, x2: 168, z1: -358, z2: -342 },
```

### 0.3 Level curve & the cap

- Leveling band: **Verdant Hollow 106–118** (Greta), **The Last Hour 116–120**
  (Tamsin). Secret boss **Grim, the Tax Collector** sits at **119** (ritual
  summon, pays loot/title not XP). Capstone **Khronaxis** is **level 120** and
  **raises the cap to 120**.
- **Cap mechanism (single balance-safe edit):** add `export const LEVEL_CAP =
  120;` in player.js and guard the level loop:
  `while (this.level < LEVEL_CAP && this.xp >= xpForLevel(this.level)) {…}`,
  then zero residual xp at cap. Talents need **no change** (90 ranks close at
  level 99, well under 120; BRANCH_CAP 30 / TOTAL_RANKS 90 stay).
- Gate predicates (consistent with pyraxis→78, hrimnir→92):
  - Verdant Hollow entry (from Sanctum): `g.slain.has('noctyra') || level ≥ 102`
  - The Last Hour entry (from Hollow): `g.slain.has('noctyra') || level ≥ 112`

### 0.4 Keybindings (no collisions)

Current: `1–9` → bar idx 0–8, `0` → 9, `Minus` → 10; `I` bag, `C` char sheet,
`T` talents, `F` interact, `Space` jump, `Q` potion, `R` rune, `Esc` close.

Two drafts both wanted **K**: systems → crafting panel, hidden → achievements/
bestiary. **Resolved:**

| key | panel | source |
| --- | --- | --- |
| `K` | **Bestiary / Achievements** ("Konown") | hidden layer |
| `B` | **Crafting bench** (Smith Halla) | systems (moved off K) |
| `Equal` (`=`) | bar idx 11 (headroom for dual-class + new skill + 3 capstones) | systems |

New class skills slot at bar idx 4 (capstones shift to 5/6/7, keys 6/7/8 — all
in the 1–9 range). Dual-class worst case (5+5 class skills + 3 capstones = 13)
needs idx 11–12; bind `Equal`→11 as the one-line extension; idx 12 renders
visually but may stay unbound (acceptable, documented). Both new panels join the
Escape close-stack.

### 0.5 Gold economy (sinks vs faucets, balanced)

New **faucets** (gold IN): Hollow trash 120–780, Spireshade 9k–13k, Vorthal
30k–44k; dungeon trash 180–400, Quaranth 9k–13k, Echo 11k–16k, Khronaxis
30k–45k; Grim 40k–60k; treasure-map digs 5k–14k; Larder urns 8k+12k; bounties
`max(11000, level×100)`.

New **sinks** (gold OUT) tuned to absorb the above so endgame gold still has a
purpose: crafting (elixirs 120–2,200; craft-gear kits 600/4,000/12,000; **Reseal
a Relic 25,000/use**), respec scaling (existing 100g/pt + 5,000 Oathbreaker
Toll). The chase sink is the relic reforge: a level-120 hero with multiple
uniques can pour 25k per reforge into the throughput ceiling, and set/vanity
farming consumes the rest. Net design: faucets fund the new sinks ~1:1 over a
zone+dungeon clear; no runaway surplus.

### 0.6 Naming-collision audit

No new boss/enemy/item id collides with shipped content (checked vs
boar/wolf/bodo/korgrim/vexnar/morgrath/ossus/vargoth/emberlord/pyraxis/
hrimnir/seraphel/noctyra/thunderbristle; uniques the_last_seal etc.). New ids:
`sporecaller hollowstalker bloomwarden swarmling spireshade vorthal` (Hollow);
`cogwraith sandflayer quaranth echo khronaxis` (dungeon); `mimic grim` (hidden).
New CLASS_STYLES: `bloomwarden greta tamsin cogwraith sandflayer khronaxis grim
smith` (all one-liners). The hidden draft's "fully_invested" achievement says
"cap 105" — updated to **120** since this expansion raises it.

### 0.7 Save schema — ONE bump to v5

All four drafts independently bumped to v5; merged into a single versioned field
list with defaults (see §11). `loadSave()` accepts `[1,2,3,4,5]`; v<5 default-
fills every new field; v4 talents/relic logic unchanged.

---

# ITERATION A — THE ZONE: The Verdant Hollow (106–118)

> *"the world growing back"* — after Noctyra fell and Taborea got its roof back,
> something woke underneath the dead astral vault: life, overcorrecting.

## A.1 Theme, palette, atmosphere

A vast sinkhole-grotto choked with bioluminescent overgrowth — a cathedral of
fungus and root where the Hollow Star's spilled light fertilized everything at
once. Lush, wet, glowing, and wrong — beautiful the way a flooded cellar full of
orchids is beautiful. Deep emerald-and-magenta, humid, lit from below by glowing
flora; no sun reaches it.

- **Sky**: a low rock dome (NOT open air). Dark olive→near-black gradient
  (`0x141d12` → `0x05080a`), faint magenta spore-glow bleeding across it, no sun
  disc. setZone drops directional sun to near-zero; placed point lights +
  emissive ground carry it (the frostveil/sanctum trick).
- **Fog**: dense, close, warm-green. `color 0x18301c`, near ≈ 12, far ≈ 95.
- **Ground material**: vertex-colored displaced mesh (frostveil pattern). Bands
  by height: **wet peat** `0x243018` (<12), **moss+spore-mat** `0x2f6b34`
  (12..22, the walkable floor, bright lambert), **glow-lichen rock** `0x5a2f6e`
  (>22, magenta-violet moraine walls). A few **glow-pool** inlays: flat
  translucent circles `0x6fffb0` at floor level, additive (warm-green luminous
  tarn).
- **Scatter decor** (instanced, frostveil/world idiom — pick geo, translate base
  to y=0, `heightAt` + reject mask):
  - **Glowcap mushrooms** (~120): `CylinderGeometry(0.14,0.22,1.4)` stalk
    (`0xe8e0d0`) + `SphereGeometry(0.9,8,6)` cap scaled flat (`0xff5ea8`
    magenta, bright lambert). The signature silhouette.
  - **Towering bracket-fungus shelves** (~90): three stacked flattened
    `CylinderGeometry(2.2,2.6,0.4,9)` discs up a thin trunk — the "trees" of the
    Hollow. Trunk `0x3a2e22`, shelves `0x8fd06a` with under-glow.
  - **Glow-fern clusters** (~1400, no shadow, the grass-tuft analog):
    `ConeGeometry(0.12,0.7,4)` in `0x7fffa0`, swaying.
  - **Root-arches & boulders** (~50): `DodecahedronGeometry`, mossy `0x3a4a2a`,
    flatShading.
- **Ambient particles**: **rising spores** — mirror the frostveil snowfield BUT
  drift UP and recycle (sanctum motes pattern). `Points`, color `0xbfffd0`, size
  0.16, opacity 0.6, ~110 points, slow upward drift with sine lateral wobble;
  `p.needsUpdate=true` each frame. Plus 3–4 drifting glow-motes as tiny additive
  sprites near the elite pool.
- **Lights** (budget ≤4): `0x6fffb0` at the entry grove, `0xff5ea8` at the elite
  pool, `0x9fffb0` at the world-boss hollow, one warm `0xb0ff8a` mid-vale.
  Gentle breathing flicker (frostveil cadence).

Builder file **`hollow.js`** (mirror `frostveil.js` exactly):
`buildHollow(scene)` → `{ update(elapsed, game), portals, signs }`; own ground
mesh, scatter, particles, two arches; `update` animates spores/glow/portal-
swirl/gate-visuals.

## A.2 Placement & bounds (noise.js)

```js
export const HOLLOW = { x1: -60, x2: 60, z1: -360, z2: -250 }; // outdoor pocket (own mesh)
```
`heightAt(x,z)` gets a HOLLOW branch **before** the world block (outdoor height-
mesh vale, mirror the FROSTVEIL branch, NOT a flat floor):
```js
if (x > HOLLOW.x1 && x < HOLLOW.x2 && z > HOLLOW.z1 && z < HOLLOW.z2) {
  let h = 14                                                   // sunken grotto floor
    + fbm(x * 0.035 + 880.3, z * 0.035 + 220.9, 4) * 6        // rolling moss humps
    + fbm(x * 0.10 + 60.2, z * 0.10 + 410.1, 3) * 1.6;        // root ridges
  const dP = Math.hypot(x - 0, z - (-305));                    // central glow-pool basin
  if (dP < 22) h = 13 + (h - 13) * smooth(dP / 22);           // flat pool -> field
  const dE = Math.min(x - HOLLOW.x1, HOLLOW.x2 - x, z - HOLLOW.z1, HOLLOW.z2 - z);
  if (dE < 12) h += (12 - dE) * (12 - dE) * 0.35;             // grotto walls, up to +50
  return h;
}
```
`game.zone` gains `'hollow'`. `setZone()` (main.js) adds a `hollow` case
(olive-black sky, warm-green fog, sun near zero). No wall AABBs (outdoor,
ZONE_BOUNDS clamp only).

## A.3 Entry portal + gate

Reached from the Starfall Sanctum's deepest hall (the grotto opened beneath
where Noctyra fell). Add a descent swirl in `sanctum.js portals[]` deep in the
final hall near the Star Cradle dais; arrival side is a glow-grove arch in
`hollow.js` (frostveil `buildArch` clone, vine/spore-infill plate while closed).

```js
// sanctum.js portals — add:
{ x: 0, z: 350, label: 'Descend into the Verdant Hollow',
  dest: { x: 0, z: -258, zone: 'hollow' },
  gate: (g) => g.slain.has('noctyra') || g.player.level >= 102,
  arriveMsg: 'The floor is breathing. Green light, wet warmth, and the smell of a thousand springs at once. Something down here did not get the message that the world ended.' },
// hollow.js portals — return:
{ x: 0, z: -258, label: 'Climb back to the Sanctum',
  dest: { x: 0, z: 348, zone: 'sanctum' },
  arriveMsg: 'Cold stone. Silence. After the Hollow it feels like holding your breath.' },
```
Wired in `main.js allPortals()` (concat `hollow.portals`). Gate visuals (arch
swirl on / infill off) flip in `hollow.js update()` via the same predicate,
nil-guarded.

## A.4 Mob families — full `ENEMY_TYPES` rows (entities.js)

Balance basis (verified): L106 maxHp 4320 / DPS 831.6; L108 4400 / 847; L110
4480 / 862.4; L112 4560 / 877.8; L113 4600 / 885.5; L116 4720 / 908.6; L118 4800
/ 924. Sustain floor `maxHp ≈ unavoidable_dps / 0.10`.

**(a) sporecaller — NEW RIG** (ranged caster; a walking glowcap-mushroom-person):
```js
sporecaller: {
  name: 'Sporecaller', level: 106, hp: 9150, dmgMin: 0, dmgMax: 0, xp: 1880,
  speed: 3.2, aggroRadius: 14, attackRange: 16, gold: [200, 360], respawn: 30,
  leash: 36, wanderR: 1.5,
  build: () => buildSporeling(),               // NEW rig (faces +X, beast formula)
  sporeling: true,                             // routes a new animator branch
  ranged: true, boltDmgMin: 481, boltDmgMax: 599, boltColor: 0xff5ea8, boltSpeed: 18,
},
```
**(b) hollowstalker** — fast 3-pack hunter; wolf rig + NEW `'verdant'` palette:
```js
hollowstalker: {
  name: 'Hollowstalker', level: 110, hp: 6900, dmgMin: 317, dmgMax: 387, xp: 2090,
  speed: 7.6, aggroRadius: 13, attackRange: 2.0, gold: [160, 300], respawn: 25,
  leash: 30, wanderR: 3,
  build: () => buildWolf('verdant'),           // wolf rig + NEW palette arg
},
```
**(c) bloomwarden** — slow armored sentry (a person the Hollow grew through);
armor 78 ≈ 19.4% of an at-level L113 hit (402.5):
```js
bloomwarden: {
  name: 'Bloomwarden', level: 113, hp: 15000, dmgMin: 485, dmgMax: 595, xp: 2320,
  speed: 2.6, aggroRadius: 9, attackRange: 3.2, gold: [460, 780], respawn: 60,
  leash: 26, wanderR: 2, armor: 78,
  build: () => { const g = buildHumanoid('bloomwarden'); g.scale.setScalar(1.8); return g; },
  humanoid: true,
},
```
**(d) mycelial swarmling** — soft trash, passive until hit (the "young boar" of
the zone):
```js
swarmling: {
  name: 'Mycelial Swarmling', level: 108, hp: 5100, dmgMin: 360, dmgMax: 460, xp: 1700,
  speed: 4.0, aggroRadius: 0, attackRange: 1.8, gold: [120, 240], respawn: 18,
  leash: 32, wanderR: 5,
  build: () => buildBoar(false, 'verdant'),    // reuse boar rig + 'verdant' palette
},
```

**NEW RIG (`buildSporeling` + `animateSporeling`, characters.js):**
1. `buildSporeling()` → Group, `userData.height ≈ 1.4`, faces **+X**. Squat body
   box (`0x6e8a4a`), four stubby legs in `rig.legs[4]` (so it COULD fall back to
   animateBeast), domed glowcap head (`SphereGeometry` flattened, `0xff5ea8`) on
   `rig.headPivot`, glowing under-gills.
2. `animateSporeling(group, state, elapsed)`: idle = cap "breathe" (head scale
   pulse) + spore-puff bob; moving = waddle (legs sine, body tilt); attack =
   head rears back then puffs forward (headPivot lunge + brief cap scale spike).
   Early-return on missing rig or `state.dead`.
3. `entities.js` import: add `buildSporeling, animateSporeling`. Add
   `buildWolf('verdant')` / `buildBoar(...,'verdant')` palette branches in
   `buildWolf`/`buildBoar` (mossy fur `0x4a6e3a`, pink eyes `0xff5ea8`).
4. Animation dispatch (entities.js ~L948): add `else if (type.sporeling)
   animateSporeling(...)` before the beast fallback.
5. Facing: sporeling faces +X (beast formula) — handled by the non-humanoid
   branch already; no extra edit.

NEW CLASS_STYLE (characters.js, one line):
`bloomwarden: { tunic: 0x2f5a2a, trim: 0xff5ea8, weapon: 'none', skin: 0x6e8a4a }`.

**Spawn sites** (entities.js):
```js
export const HOLLOW_SITES = { vorthal: { x: 0, z: -345 } };   // world boss hollow
```
In `spawnEnemies`, push trash like FROSTVEIL: sporecallers/hollowstalkers/
bloomwardens/swarmlings around z −280..−330, x −40..40, kept clear of the entry
arch (z −258) and the boss site. LOS-less aggro: keep westmost wander origin off
the entry line (small aggroRadius + wanderR already set).

## A.5 Elite sub-area — "The Mother-Bloom Pool"

A glowing pool basin (the central glow-pool at ~(0,−305)) ringed in giant
bracket-fungus, lit pink. Elite mini-boss (Emberlord/Hrimnir role: TTK 50–60s,
near-lethal mechanic, summons trash). Site `{ x: -30, z: -300 }` (off the boss
line); reveal/scatter-reject around it in `hollow.js`.

```js
spireshade: {
  name: 'Spireshade, the Mother-Bloom', level: 116, hp: 47200, dmgMin: 595, dmgMax: 725, xp: 5200,
  speed: 4.2, aggroRadius: 15, attackRange: 4.0, gold: [9000, 13000],
  respawn: 240, leash: 60, wanderR: 2, armor: 74,
  build: () => { const g = buildHumanoid('bloomwarden'); g.scale.setScalar(2.4); return g; },
  humanoid: true, elite: true,
  mechanics: [{
    kind: 'zone', interval: 8, telegraph: 1.5, radius: 6, dmg: 1840,   // 39% of L116 maxHp 4720
    center: 'player', avoid: 'move', color: 0xff5ea8,
    warn: 'erupts a spore-bloom beneath you — MOVE!',
    dodgeMsg: 'The bloom bursts on bare moss.',
  }],
  summons: { at: [0.6, 0.3], kind: 'hollowstalker', count: 3 },
},
```

## A.6 World boss — Vorthal, the First Root (level 118)

The seed of all the Hollow's overgrowth, a colossal root-and-fungus hulk. Reuses
the dragon rig at scale. Tuned to a level-118 player (the zone ceiling). Reuses
only existing mechanic kinds (slam/zone/firepatch — new kinds belong to the
dungeon, Iteration B). Site `vorthal: { x: 0, z: -345 }` (lazy-spawn like
`spawnTrialBoss` if desired, else placed in `spawnEnemies`).

```js
vorthal: {
  name: 'Vorthal, the First Root', level: 118, hp: 184800, dmgMin: 760, dmgMax: 930, xp: 9400,
  speed: 4.6, aggroRadius: 18, attackRange: 5.0, gold: [30000, 44000],
  respawn: 300, leash: 90, wanderR: 2, armor: 80,
  build: () => { const g = buildDragon(); g.scale.setScalar(1.35); return g; },  // beast +X
  elite: true,
  mechanics: [
    { kind: 'slam', interval: 10, telegraph: 1.5, radius: 10, dmg: 2016,        // 42% of 4800
      center: 'boss', avoid: 'jump', color: 0x9fffb0,
      warn: 'heaves the whole grotto upward — JUMP!', dodgeMsg: 'You leap the buckling floor!' },
    { kind: 'zone', interval: 8, telegraph: 1.5, radius: 7, dmg: 2112,          // 44%
      center: 'player', avoid: 'move', color: 0xff5ea8,
      warn: 'lashes a root at your feet — MOVE!', dodgeMsg: 'The root cracks bare stone.' },
    { kind: 'firepatch', interval: 12, telegraph: 1.4, radius: 4.5, dmg: 1000,  // creeping rot, lingers
      lingerDmg: 430, linger: 20, center: 'player', avoid: 'move', color: 0x7a4eff,
      warn: 'sows devouring rot where you stand — MOVE, and stay out!',
      dodgeMsg: 'The rot blooms on empty ground.' },
  ],
  summons: { at: [0.75, 0.5, 0.25], kind: 'hollowstalker', count: 3 },
},
```
Derivation: auto stream sustain floor `0.08×4800 = 384/s`; at 2.2s elite interval
avg 845 → 760/930. HP ≈ 200s × 924 ≈ 184,800. Bursts 42–46% of 4800 (near-
lethal, dodgeable). armor 80 ≈ 19% of an L118 hit (420). All telegraphs reuse
existing kinds → the 4-part UX (ring + filling disc + JUMP!/MOVE! banner +
warnJump/warnMove sfx) is inherited intact.

## A.7 Questgiver: Greta Thornby (quests.js) — surface chain + bounty

A disgraced royal botanist laughed out of the academy for insisting the Hollow
Star's death would make things *grow*. She is right, vindicated, and furious
about it — gleeful and bitter in equal measure, taking notes while the flora
tries to eat her. `npc.chain = game.hollowQuests`; rig style
`greta: { tunic: 0x3a5a2e, trim: 0xff5ea8, weapon: 'none' }` (one line).

New kind→string maps in THREE places: `targetName` (quests.js), `targetLabel`
(ui.js), and the zone Set:
```js
const HOLLOW_KINDS = new Set(['sporecaller','hollowstalker','bloomwarden','swarmling','spireshade']);
```

Chain (8 steps; `trial:true` entries don't gate the bounty):
```js
const HOLLOW_QUESTS = [
  { id: 'h_swarm', name: 'It Spreads', targetKind: 'swarmling', count: 8, trial: false,
    intro: `You came DOWN here? On purpose? Then you're either a hero or a colleague, and the academy assures me those are different. Greta Thornby — botanist, exile, and the only living woman who PREDICTED this. They laughed me out of the lecture hall for a paper titled "On the Fertility of Catastrophe." Well. Read the room, gentlemen. The Mycelial Swarmlings are eating my sample plots faster than I can label them. Cull eight so I can finish a sentence in my field journal.`,
    outro: `Eight! And my plots survive another hour. Do you know what this place IS, hero? It's the world apologizing for the last hundred years, all at once, with no sense of restraint. Keep that blade out. The apology gets bigger.`,
    rewardXp: 7200, rewardGold: 9000 },
  { id: 'h_stalkers', name: 'Green on Green', targetKind: 'hollowstalker', count: 8, trial: false,
    intro: `New variable. The Hollowstalkers — wolves the moss took back. You won't see them; the whole vale is the exact color they are. You'll HEAR them, once, the way you hear a door close in a house you thought was empty. Eight, please, before they reclassify ME as a sample plot. Note for the journal: predators adapt to bioluminescence within a generation. The academy can read it on my headstone.`,
    outro: `Eight green ghosts, grounded. The journal grows; my pension does not. Spite is a renewable resource, hero — I have plenty for both of us.`,
    rewardXp: 7800, rewardGold: 9600 },
  { id: 'h_callers', name: 'A Cloud of Witnesses', targetKind: 'sporecaller', count: 6, trial: false,
    intro: `Now the truly maddening ones. The Sporecallers stand at the back and SPIT — clouds of glowing spore that find you across the whole grotto. Close the distance or eat the cloud; there's no third option, I checked, twice, painfully. Six down. And if you cough magenta for a week, that's normal. Probably. I'd cite the source but the source is "I tried it."`,
    outro: `Six callers silenced and the air almost breathable. I'm cataloguing a new genus per hour down here, hero. The academy will have to invent a longer Latin just to apologize.`,
    rewardXp: 8400, rewardGold: 10500 },
  { id: 'h_wardens', name: 'They Were People', targetKind: 'bloomwarden', count: 5, trial: false,
    intro: `…The Bloomwardens I will not enjoy. Look closely — under the bark and the flowers, that's a person the Hollow grew THROUGH. The old vale-keepers, rooted where they stood, made into trellises. Steel skips off the bark, so don't fence — break them. Five. It's a mercy, hero, though it won't feel like one. Bring me a flower from each. For the record. For them.`,
    outro: `Five freed — if "freed" is the word. I pressed each flower in the journal. Someone should remember they were people before they were scenery. Thank you for breaking them gently. Or at all.`,
    rewardXp: 9000, rewardGold: 11500 },
  { id: 'h_spireshade', name: 'The Mother of It All', targetKind: 'spireshade', count: 1, trial: true,
    intro: `Everything down here feeds ONE thing, and it sits in the great glowing pool: SPIRESHADE, the Mother-Bloom — the spore-queen the whole vale answers to. She erupts blooms straight up beneath your feet: MOVE the instant the ground glows. And when she bleeds she calls the green ghosts, so cut the wolves first. I have studied her from a sensible distance and concluded the sensible distance is "another vale." Go anyway. I'll be at the rim, taking the most important notes of my career.`,
    outro: `Spireshade — DECEASED, and the pool gone quiet for the first time since I arrived. Hero, the pool is draining. There's a deeper hollow under it, and something down there is BIGGER than her, and older, and it just noticed the quiet. Take these runes. Stand a little further from me.`,
    rewardXp: 18000, rewardGold: 22000, rewardRunes: 14 },
  { id: 'h_proof', name: 'For the Appendix', targetKind: 'sporecaller', count: 10, trial: false,
    intro: `Before you go down there and die magnificently — I need PROOF, hero. The academy will say I salted my own samples; they always do. Ten more Sporecallers, dropped where I can map exactly where they fell. Distribution data. It's the difference between a vindication and a vendetta, and I would honestly settle for either.`,
    outro: `Ten, perfectly plotted. The pattern is undeniable — the Hollow grows in a SPIRAL, hero, outward from the deepest point, like something exhaling. And at the center of the spiral is the thing the pool was hiding. Of course it is. The center of everything always is.`,
    rewardXp: 9600, rewardGold: 12000 },
  { id: 'h_vorthal', name: 'The First Root', targetKind: 'vorthal', count: 1, trial: true,
    intro: `So. The center of the spiral. VORTHAL, THE FIRST ROOT — the seed the Hollow Star's death cracked open, and everything green and wrong up here is just its leaves. It is the size of the cavern, hero, and it does not so much fight as GARDEN. Write these on your arm: it heaves the whole floor — JUMP. It lashes roots at your feet — MOVE. And it sows rot that stays and EATS the ground — move, and never set foot back in it; the vale will shrink until you've nowhere left to stand. It calls the green hunt; cut them quick. This is the deepest root in Taborea, hero. Pull it.`,
    outro: `…It's quiet. Truly quiet — the spores have stopped rising. Vorthal, the First Root, UPROOTED. Hero, the academy can keep its lecture halls; I have the only field journal that will ever matter, and you are every dangerous page of it. The Hollow will grow back — it always does, that's the whole horrible point — but slower now. Gentler. Take these runes. You've earned a season of quiet, and Taborea has earned a spring.`,
    rewardXp: 38000, rewardGold: 52000, rewardRunes: 30 },
  { id: 'h_coda', name: 'On the Fertility of Catastrophe', targetKind: 'bloomwarden', count: 6, trial: false,
    intro: `One last favor, and it's selfish. My paper needs a CONCLUSION. Six more Bloomwardens, the last of the rooted folk, laid to rest — so the final chapter reads "and then they were at peace," and not "and then I ran out of pages." Help me end it properly, hero. Everything down here deserves a proper ending. Even the academy. Especially the academy.`,
    outro: `Done. The journal closes. "On the Fertility of Catastrophe," by Greta Thornby — vindicated, retired, and the only botanist alive who gardened in hell and lived. Go on, hero. The world's growing back. Go grow with it.`,
    rewardXp: 11000, rewardGold: 14000 },
];

const HOLLOW_BOUNTY = {
  name: "Botanist's Standing Order", count: 12,
  intro: `The Hollow re-seeds itself nightly — I have the spore-counts to prove it, and no one to prove them TO. A standing order, then: any twelve of the vale's creatures, and I'll pay from the grant the academy doesn't know I still draw. For science, hero. For SPITE.`,
  outro: `Twelve culled, twelve catalogued. The vale exhales and fills back in. The order stands — appallingly.`,
};
function hwBountyXp(game) { return Math.max(11000, game.player.level * 100); }
function hwBountyGold(game) { return Math.max(11000, game.player.level * 100); }

export function createHollowQuests() {
  return makeChain({
    quests: HOLLOW_QUESTS, bounty: HOLLOW_BOUNTY, bountyXp: hwBountyXp, bountyGold: hwBountyGold,
    npcName: 'Greta Thornby',
    bountyCounts: (enemy) => HOLLOW_KINDS.has(enemy.kind),
    vendor: false,
  });
}
```

## A.8 Gear tier — ilvl band 106–120; 4 named uniques (items.js)

ilvl band 106–120 (`enemy.level` = ilvl for generated drops). Trash
(`HOLLOW_KINDS`) rolls 4-way slot incl. relic (add to `EXPANSION_KINDS`).
Bosses drop a guaranteed epic relic-weighted (40) + 22% unique (add `spireshade`
elite-class + `vorthal` to `EXPANSION_BOSSES`). Vorthal is the zone BiS.

```js
spireshade: {   // elite, L116
  id: 'mother_bloom_seed', name: 'Seed of the Mother-Bloom', slot: 'trinket', rarity: 'legendary', unique: true,
  stats: { hp: 520, crit: 0.07, healPower: 0.055 },   // power ≈ 270 vs ~232 baseline = 1.16×
  flavor: 'Still warm, still wanting to grow. Keep it in a closed fist.',
},
vorthal: {      // world boss, L118 — zone BiS, a RELIC (Last-Seal class)
  id: 'the_first_root', name: 'The First Root', slot: 'relic', rarity: 'legendary', unique: true,
  stats: { dmg: 132, hp: 520, crit: 0.06, healPower: 0.052 },  // power ≈ 392 vs ~245 baseline = 1.60×
  flavor: 'The oldest thing in Taborea, and it answered to you. The garden remembers its gardener.',
},
greta_pressed: {   // quest reward for the coda, granted via makeUnique('greta_pressed')
  id: 'pressed_bloom', name: "Greta's Pressed Bloom", slot: 'trinket', rarity: 'legendary', unique: true,
  stats: { hp: 240, healPower: 0.05 },                 // a quieter, sentimental BiS-adjacent
  flavor: 'A flower from a person, pressed flat in a field journal. She wanted someone to keep it. So do you.',
},
glowcap_carbine: {  // low-% off sporecaller (~3% rare drop) OR guaranteed Spireshade alt
  id: 'glowcap_carbine', name: 'The Glowcap Carbine', slot: 'weapon', rarity: 'legendary', unique: true,
  stats: { dmg: 220, crit: 0.025 },                    // power ≈ 270, weapon BiS for the band
  flavor: 'A mushroom that learned to spit back. It glows when it is happy, which is whenever it is hitting something.',
},
```

## A.9 Signposts (hollow.js signs[])

```js
const signs = [
  { x: 0, z: -262, label: 'The Verdant Hollow — recommended level 102+. Mind the floor. The floor minds you.' },
  { x: -24, z: -296, label: '"The Mother-Bloom Pool. Do not drink. Do not touch. Do not, under any circumstances, taste. — G.T."' },
  { x: 0, z: -332, label: '"Below this point the spiral tightens. I went no further. Neither should you, but you will. — G.T."' },
];
```
The z −332 signpost is **also where Tamsin Verge stands** (the dungeon questgiver,
Iteration B) — the spiral's center is the dungeon mouth.

## A.10 Iteration A touch-points

- **noise.js**: `HOLLOW` const; `heightAt()` HOLLOW branch; `ZONE_BOUNDS.hollow`.
- **hollow.js** (NEW): `buildHollow(scene)` → `{update, portals, signs}`.
- **characters.js**: `buildSporeling()` + `animateSporeling()`; `'verdant'`
  palette branches in `buildWolf`/`buildBoar`; CLASS_STYLES `bloomwarden`,
  `greta`.
- **entities.js**: import `buildSporeling, animateSporeling`; 6 rows
  (sporecaller/hollowstalker/bloomwarden/swarmling/spireshade/vorthal);
  `HOLLOW_SITES`; spawns; `type.sporeling` dispatch branch.
- **quests.js**: `HOLLOW_KINDS`, `HOLLOW_QUESTS`, `HOLLOW_BOUNTY`,
  `createHollowQuests()`; 5 kinds → `targetName`.
- **ui.js**: 5 kinds → `targetLabel`; `game.hollowQuests` →
  `refreshQuestTracker`.
- **items.js**: 4 uniques; `spireshade`/`vorthal` → boss drop sets;
  `HOLLOW_KINDS` → `EXPANSION_KINDS`.
- **sanctum.js**: descent portal (z 350) into the Hollow.
- **main.js**: `game.hollow = buildHollow(scene)`; `game.hollowQuests`;
  `greta` NPC with `.chain` → `game.npcs`; `setZone('hollow')` case;
  `allPortals()` concat; onKill fan-out `game.hollowQuests?.onKill`; save/load
  serialize `hollowQuests`.

---

# ITERATION B — THE DUNGEON: The Last Hour + 4 new mechanic kinds

> A sunken horologium at the bottom of the Hollow's spiral — a clockwork tomb
> where Time itself was buried to stop it ending the world. Entered from the
> Verdant Hollow (Tamsin Verge gates it). Runs 116–120; the final boss raises
> the cap to 120.

## B.1 Four brand-new boss mechanic kinds

Existing kinds: `slam`(jump), `zone`(move), `firepatch`(persistent move-out),
`sanctuary`(get-IN). All four new kinds reuse `castMechanic`'s ring+fill+banner+
sfx scaffolding (entities.js ~L699). Player tools: Jump (Space, ~0.7s air) and
Dash (Pathfinder capstone, a positional blink, **distance 8** — verified
talents.js L228). Every mechanic is solvable with movement + one of those.

### MECHANIC 1: `beam` — the Sweeping Lance (rotating angular wedge; dodge by NOT being in the arc)
```js
{ kind: 'beam', interval: 9, telegraph: 2.2, length: 22, halfArc: 0.34, dmg: <burst>,
  sweep: 2.4, radius: 22, center: 'boss', avoid: 'dodge', color: 0xff4d6d,
  warn: 'winds up a sweeping lance — DODGE the arc!',
  dodgeMsg: 'The lance scythes past your heels.' }
```
New fields: `length` (beam reach m), `halfArc` (radians half-width of lethal
wedge), `sweep` (total radians swept over `telegraph`). Supply dummy
`radius: length` so any code reading `radius` is safe; beam never spawns a patch.
- **Visual** (`castMechanic` branch): build a wedge = `CircleGeometry(length, 24,
  startAngle, halfArc*2)` laid flat (`rotation.x = -π/2`) at the boss + a thin
  bright `RingGeometry` core line. Store `tg.angle0 = atan2(player.x−boss.x,
  player.z−boss.z)` so the sweep STARTS aimed where the player stood. In
  `updateTelegraphs`, rotate the wedge: `tg.fill.rotation.z = -(angle0 +
  sweep*(tg.t/telegraph))`.
- **avoid-verb** `'dodge'`, banner `'DODGE!'`, sfx `warnSweep()` (audio.js):
  `warnSweep(){ tone(330,'sawtooth',0.02,0.5,0.5); tone(660,'square',0.3,0.2,0.4,0,0.25); }`.
- **Resolve** (new branch BEFORE generic dist check): at resolution, final wedge
  center-angle `aF = angle0 + sweep`; player angle `ap = atan2(px−bx, pz−bz)`,
  dist `d`. Hit if `d ≤ length` AND `|wrapPi(ap − aF)| ≤ halfArc`. Inside →
  takeDamage; outside/beyond → dodgeMsg + armAvenger.
- **Counterplay**: sidestep perpendicular to the sweep, or Dash through the boss
  to the back of the arc. Jump does NOT save you (positional, not vertical).

### MECHANIC 2: `soak` — Shared Burden (you MUST stand in it; absence magnifies)
```js
{ kind: 'soak', interval: 11, telegraph: 2.0, radius: 3.0, dmg: <soaked>, unsoakedDmg: <2.4×soaked>,
  center: 'player', avoid: 'in', color: 0x4dd0ff,
  warn: 'gathers a falling weight — SOAK it!',
  dodgeMsg: 'You take the weight square; it could have been worse.' }
```
New field `unsoakedDmg`. Reuses `avoid:'in'` → banner 'GET IN!' + `warnIn()` (no
new sfx). Differs from `sanctuary` (inside = no damage) in that `soak` ALWAYS
damages: inside = `dmg`, outside = `unsoakedDmg`. `center:'player'` lands it near
you so it's reachable but the boss chains a `zone` to push you off.
- **Resolve** (new branch, mirror sanctuary): if `dist ≤ radius+0.4` →
  takeDamage(dmg) + floatText('Soaked!') + armAvenger; else takeDamage(unsoaked).
  Keep ABOVE the generic dist block. Jump irrelevant.
- **Counterplay**: usually just don't run away; the skill check is judging when
  soaking-into-fire beats the unsoaked burst.

### MECHANIC 3: `tether` — the Anchor Chain (break by distance; run to snap it)
```js
{ kind: 'tether', interval: 10, telegraph: 2.4, breakDist: 10, radius: 10, dmg: <burst>,
  pullBack: true, center: 'player', avoid: 'flee', color: 0xb06bff,
  warn: 'sinks a chain into you — RUN to break it!',
  dodgeMsg: 'The chain snaps taut and shatters.' }
```
**Conflict resolved:** dash distance is **8**, not the 12 the draft assumed. Per
the draft's own contingency ("if dash<12 set breakDist 10"), `breakDist` is set
to **10** everywhere (sprint covers the last 2u in the 2.4s window; Dash gets you
most of the way). New fields `breakDist`, `pullBack`. `radius = breakDist` for
the ring.
- **Visual**: snapshot `tg.anchor = {x,z}` at cast (it does NOT follow). Draw the
  ring at radius `breakDist`; draw a thin chain line (stretched BoxGeometry /
  CylinderGeometry segment) updated each frame in `updateTelegraphs` anchor→player.
- **avoid-verb** `'flee'`, banner `'RUN!'`, sfx `warnTether()` (audio.js):
  `warnTether(){ tone(180,'sine',0.05,0.6,0.5); tone(120,'sawtooth',0.1,0.5,0.4,0,0.1); }`.
- **Resolve**: `d = dist(player, anchor)`. If `d > breakDist` → dodgeMsg +
  floatText('Broken!') + armAvenger. Else: if `pullBack` snap player to anchor
  (then placeOnGround), takeDamage(dmg). Update the chain line each tick.
- **Counterplay**: pure sprint/Dash; jump won't move you far enough.

### MECHANIC 4: `shatterfloor` — Collapsing Tiles (checker; jump or stand on solid)
```js
{ kind: 'shatterfloor', interval: 12, telegraph: 2.0, tile: 4, parity: 'auto', dmg: <burst>,
  center: 'boss', avoid: 'jump', color: 0xff8a3a, radius: 18,
  warn: 'the floor remembers it was never solid — JUMP or find footing!',
  dodgeMsg: 'You ride the gap as the tiles drop away.' }
```
New fields `tile` (edge m), `parity` ('auto' → `cast_count % 2`, alternates which
checker color falls; or 'even'/'odd'). `radius` = half-extent of the grid (a
square `2·radius` across, centered on boss). Reuses `avoid:'jump'` → banner
'JUMP!'; recommend a distinct sfx `warnShatter()` (audio.js):
`warnShatter(){ noiseBurst(0.4,800,0.6); tone(220,'square',0.02,0.4,0.4); }`,
routed via a small extension to castMechanic's sfx switch.
- **Visual**: build N translucent square `PlaneGeometry(tile,tile)` tiles where
  `((floor(localX/tile)+floor(localZ/tile)) % 2) === parityBit`, glowing
  `color`, opacity growing over telegraph. Store tile origin + parityBit on tg.
- **Resolve**: player tile parity `pb = (floor((px−ox)/tile)+floor((pz−oz)/tile))
  & 1`. Hit if within grid AND `pb === parityBit` AND grounded (air ≤ 0.7).
  Airborne OR wrong-parity tile → dodgeMsg + armAvenger.
- **Counterplay**: TWO answers (jump OR reposition to a safe tile) — generous
  because the capstone stacks it with beam+tether.

### Engineering edit sites (all four mechanics)
- **entities.js `castMechanic`** (~L699): per-kind geometry branches (beam wedge,
  tether anchor+line, shatterfloor tile grid); soak reuses default ring/fill.
  Extend the sfx switch (~L721): `'dodge'→warnSweep`, `'flee'→warnTether`,
  `shatter→warnShatter`; `'in'` already maps to `warnIn` (covers soak).
- **entities.js `updateTelegraphs`** (~L726): resolve branches for
  beam/soak/tether/shatterfloor BEFORE the generic dist check (mirror sanctuary
  ~L750); tether/beam need per-frame mesh follow inside the `tg.t<telegraph`
  continue path.
- **ui.js `mechWarning`** (~L717): extend token map →
  `{ jump:'JUMP!', move:'MOVE!', in:'GET IN!', dodge:'DODGE!', flee:'RUN!' }`.
- **audio.js**: add `warnSweep`, `warnTether`, `warnShatter`.
- **styles.css**: add `.mech-dodge` / `.mech-flee` banner classes (mirror
  `.mech-jump`).
- The CLAUDE.md 4-part UX rule is satisfied: each gets ring/wedge/grid + filling
  visual + banner + distinct sfx.

## B.2 The dungeon zone: `horologium`

Black basalt walls veined with dim brass (lambert `0x14161f` wall, `0x8a6a2a`
brass inlay quads), turning gear-discs (CylinderGeometry rings) as decor, a slow
rain of "sand" (Points field drifting DOWN, inverted sanctum motes), pendulum
shards swinging from the dark. NEW pocket zone `'horologium'` mirroring
`sanctum.js` exactly: crypt-style wall AABBs, `WALL_H = 5`, flat floor.

noise.js:
```js
export const HOROLOGIUM = { x1: 250, x2: 360, z1: 200, z2: 320, floor: 60 };
```
`heightAt()` HOROLOGIUM branch returns the flat floor (mirror CRYPT/SANCTUM);
add `ZONE_BOUNDS.horologium` (§0.2). 4 PointLights (brass-gold at gates,
cold-blue in the deeps). `setZone('horologium')` branch: cold-blue fog, low sun.

**Layout** (wall-AABB segments `[x1,z1,x2,z2]`, thickness ~1, run south→north
like sanctum; doors = GAPS in the `x∈[−2,2]` lane; trash placed OFF walls per
the aggro-without-LoS gotcha — small `aggroRadius 8`, `wanderR 1.5`):
1. **Entry Antechamber** (arrival swirl from the Hollow). A cracked sundial.
   1 pack of 2 Cogwraiths CENTER of the room, ≥4m off every wall. Hidden
   **Stilled Sundial** prop here (Iteration E secret).
2. **Corridor A** (gear-disc decor). 1 pack of 3 Cogwraiths down the middle.
3. **The Pendulum Hall** → MINI-BOSS 1 **Quaranth, the Unwound**. Wide square,
   arena clear of walls (beam/tether need room). Trash gate: 1 Sandflayer.
4. **Corridor B** (sand rains heavier). 2 packs of 2 Sandflayers, off-wall.
5. **The Stilled Vault** → MINI-BOSS 2 **Echo of the First Minute**. Square room.
6. **Final Corridor** (the sand stops — silence). No trash (clean run to boss).
7. **The Heart of the Hourglass** → CAPSTONE **Khronaxis, the Hour That Was
   Kept** (level 120). Largest room; floor is the shatterfloor grid. Exit swirl
   returns to the Hollow.

Dungeon bosses `leash: 90` (whole-dungeon). Trash `respawn: 600` (cleared rooms
stay cleared during boss attempts). Walls collide only for the player,
zone-gated: extend player.js wall switch `zone==='horologium' ? game.horologium
: …`. Wire `game.horologium = buildHorologium(scene)` (NEW `horologium.js`,
sanctum clone → `{update, walls, portals}`); add to `setZone`, `allPortals()`,
zone clamps.

## B.3 Dungeon balance (every number derived)

At-level reference: L116 maxHp 4720 / DPS 908.6 / heal 472; L117 4760 / 916.3;
L118 4800 / 924 / heal 480; L120 4880 / DPS 939.4 / heal 488. levelCost L116 ≈
17,500 (xpForLevel(116) = 17,509), L120 ≈ 18,857 (use ~19,100 for the capstone
60% band per the draft).

### TRASH
**Cogwraith** (humanoid; `buildHumanoid('cogwraith')` or 'revenant' reskin):
```js
cogwraith: {
  name: 'Cogwraith', level: 116, hp: 11800, dmgMin: 374, dmgMax: 467, xp: 2625,
  speed: 5.6, aggroRadius: 8, attackRange: 2.4, gold: [220, 400], respawn: 600,
  leash: 32, wanderR: 1.5, humanoid: true,
  build: () => buildHumanoid('cogwraith'),
},
```
Pack-discounted hit ≈ 0.62×680 ≈ 420 → 374/467; hp ≈ 13s × 908.6 ≈ 11,800; xp ≈
0.15×17,500 ≈ 2,625.

**Sandflayer** (beast; wolf rig + new desiccated palette, or `buildWolf('sand')`):
```js
sandflayer: {
  name: 'Sandflayer', level: 117, hp: 7300, dmgMin: 426, dmgMax: 521, xp: 2670,
  speed: 7.6, aggroRadius: 13, attackRange: 2.0, gold: [180, 320], respawn: 600,
  leash: 30, wanderR: 3,
  build: () => buildWolf('sand'),
},
```
Fast 2-packs; hit ≈ 0.69×686 ≈ 473 → 426/521; hp ≈ 8s × 916.3 ≈ 7,300; xp ≈
0.15×17,800 ≈ 2,670.

### MINI-BOSS 1 — Quaranth, the Unwound (L116, elite)
A stalled clockwork colossus, `buildHumanoid('golem')` scaled 2.2, brass palette.
Speaks in stopped-clock fragments — *"It is. It is. It is —"*. Uses new `beam`
(its great pendulum-arm) + a `zone`.
```js
quaranth: {
  name: 'Quaranth, the Unwound', level: 116, hp: 45000, dmgMin: 749, dmgMax: 915, xp: 7000,
  speed: 4.2, aggroRadius: 15, attackRange: 4.0, gold: [9000, 13000],
  respawn: 240, leash: 90, wanderR: 2, armor: 78,
  build: () => { const g = buildHumanoid('golem'); g.scale.setScalar(2.2); return g; },
  humanoid: true, elite: true,
  mechanics: [
    { kind:'beam', interval:9, telegraph:2.2, length:22, halfArc:0.34, sweep:2.4, radius:22, dmg:1888,
      center:'boss', avoid:'dodge', color:0xff4d6d,
      warn:'swings the great pendulum-arm — DODGE the arc!', dodgeMsg:'The arm scythes past your heels.' },
    { kind:'zone', interval:8, telegraph:1.5, radius:6, dmg:1841, center:'player', avoid:'move', color:0xb06bff,
      warn:'drops a stopped second on you — MOVE!', dodgeMsg:'The frozen second cracks empty floor.' },
  ],
  summons: { at:[0.5], kind:'cogwraith', count:2 },
},
```
Sustain `0.08×4720 = 378/s`; elite 2.2s avg 832 → 749/915. HP ≈ 50s × 908.6 ≈
45,000. Bursts: beam 40% × 4720 = 1,888; zone 39% = 1,841. armor 78 ≈ 19% of
413.

### MINI-BOSS 2 — Echo of the First Minute (L118, elite)
A time-revenant that fights a half-second ahead; `buildHumanoid('wraith')`
scaled 2.0 (translucent doubled silhouette). Repeats your last action back a beat
late — *"you'll regret that — you regretted that"*. Uses new `tether` + new
`soak` + a `slam`.
```js
echo: {
  name: 'Echo of the First Minute', level: 118, hp: 50800, dmgMin: 760, dmgMax: 930, xp: 7120,
  speed: 4.4, aggroRadius: 15, attackRange: 4.0, gold: [11000, 16000],
  respawn: 240, leash: 90, wanderR: 2, armor: 80,
  build: () => { const g = buildHumanoid('wraith'); g.scale.setScalar(2.0); return g; },
  humanoid: true, elite: true,
  mechanics: [
    { kind:'tether', interval:10, telegraph:2.4, breakDist:10, radius:10, pullBack:true, dmg:1920,
      center:'player', avoid:'flee', color:0xb06bff,
      warn:'chains you to the minute you just left — RUN to break it!', dodgeMsg:'The chain snaps and the past lets go.' },
    { kind:'soak', interval:11, telegraph:2.0, radius:3, dmg:1824, unsoakedDmg:4378, center:'player', avoid:'in', color:0x4dd0ff,
      warn:'gathers a falling weight — SOAK it or it falls on everything!', dodgeMsg:'You take the weight square; better than the alternative.' },
    { kind:'slam', interval:9, telegraph:1.5, radius:9, dmg:1968, center:'boss', avoid:'jump', color:0xffd87a,
      warn:'collapses the moment around it — JUMP!', dodgeMsg:'You leap the imploding instant.' },
  ],
  summons: { at:[0.6,0.3], kind:'sandflayer', count:2 },
},
```
Sustain `0.08×4800 = 384/s`; elite 2.2s avg 845 → 760/930. HP ≈ 55s × 924 ≈
50,800. Bursts: tether 40%×4800 = 1,920; soak 38% = 1,824 (unsoaked 2.4× = 4,378
— near-instant-kill if ignored, the teaching tool); slam 41% = 1,968. armor 80 ≈
19% of 420.

### CAPSTONE — Khronaxis, the Hour That Was Kept (level 120, RAISES CAP)
`buildHumanoid('khronaxis')` scaled 2.6, wreathed in three slow gear-haloes
(clone the sanctum orrery torus pattern as attached decor). Vast, patient, almost
kind — it kept the last hour so the world wouldn't end. *"I have held it so long.
Take it. I am so tired of counting."* Combines ALL FOUR new kinds + slam + an
ENRAGE TIMER (the only hard timer in the game).
```js
khronaxis: {
  name: 'Khronaxis, the Hour That Was Kept', level: 120, hp: 188000, dmgMin: 773, dmgMax: 945, xp: 11460,
  speed: 4.6, aggroRadius: 16, attackRange: 4.0, gold: [30000, 45000],
  respawn: 600, leash: 90, wanderR: 2, armor: 82,
  build: () => { const g = buildHumanoid('khronaxis'); g.scale.setScalar(2.6); return g; },
  humanoid: true, elite: true,
  enrageAt: 200, enrageMult: 1.6,
  mechanics: [
    { kind:'shatterfloor', interval:13, telegraph:2.0, tile:4, parity:'auto', radius:18, dmg:2098,
      center:'boss', avoid:'jump', color:0xff8a3a,
      warn:'the floor remembers it was never solid — JUMP or find footing!', dodgeMsg:'You ride the gap as the tiles drop away.' },
    { kind:'beam', interval:9, telegraph:2.2, length:24, halfArc:0.36, sweep:2.6, radius:24, dmg:2147,
      center:'boss', avoid:'dodge', color:0xff4d6d,
      warn:'sweeps the hand of the great clock — DODGE!', dodgeMsg:'The clock-hand scythes past you.' },
    { kind:'tether', interval:11, telegraph:2.4, breakDist:10, radius:10, pullBack:true, dmg:2196,
      center:'player', avoid:'flee', color:0xb06bff,
      warn:'binds you to a kept minute — RUN!', dodgeMsg:'You outrun your own past.' },
    { kind:'soak', interval:12, telegraph:2.0, radius:3, dmg:2098, unsoakedDmg:5035, center:'player', avoid:'in', color:0x4dd0ff,
      warn:'lets a held hour fall — SOAK it!', dodgeMsg:'You shoulder the hour.' },
    { kind:'slam', interval:10, telegraph:1.5, radius:10, dmg:2050, center:'boss', avoid:'jump', color:0xffd87a,
      warn:'lets the weight of time return — JUMP!', dodgeMsg:'You leap the gravity of years.' },
  ],
  summons: { at:[0.75,0.5,0.25], kind:'cogwraith', count:2 },
},
```
Sustain `0.08×4880 = 390.4/s`; elite 2.2s avg 859 → 773/945. HP ≈ 200s × 939.4 ≈
188,000 (Noctyra precedent 164,800 @ TTK 218). Margin: at-level heal 488/s vs
sustain 390.4/s = +97.6/s headroom — survivable WITH downtime to dodge; bursts
force movement that costs uptime (the capstone tension). Bursts 42–46% of 4880:
slam 42% = 2,050; beam 44% = 2,147; shatterfloor 43% = 2,098; tether 45% = 2,196;
soak 43% = 2,098 (unsoaked 2.4× = 5,035 — lethal-on-greed). armor 82 ≈ 19% of
427. xp = 0.60×19,100 ≈ 11,460.

**ENRAGE implementation** (new fields `enrageAt`, `enrageMult`; entities.js):
track `e.combatT += dt` while state ∈ {chase, attack}; once `combatT ≥ enrageAt`,
multiply outgoing damage (melee pendingHit roll AND mech dmg) by `enrageMult` and
tint mechs red. `enrageAt: 200` matches TTK (a clean kill never sees it; a slow
player gets walls of damage). Reset `combatT` on `return` (leash) like
mechTimer/summonAt. Flavor: the hour finally runs out.

## B.4 Dungeon drops (items.js)

```js
TIME_BOSSES = new Set(['quaranth','echo','khronaxis']);
TIME_KINDS  = new Set(['cogwraith','sandflayer']);
```
`rollDrops` branch mirroring EXPANSION_BOSSES (epic, slot relic-weighted 40 +
22% unique). Trash (TIME_KINDS) roll 4-way slot incl. relic. ilvl = enemy.level
(116–120). Khronaxis is the new BiS source.

Named uniques (UNIQUES keyed by boss kind):
```js
quaranth: { id:'unwound_mainspring', name:'The Unwound Mainspring', slot:'weapon', rarity:'legendary', unique:true,
  stats:{ dmg:198, crit:0.025 }, flavor:'Still coiled to strike, a century after the clock stopped.' },     // ~1.10× a 116 weapon
echo: { id:'second_that_never_came', name:'The Second That Never Came', slot:'trinket', rarity:'legendary', unique:true,
  stats:{ crit:0.08, healPower:0.065, hp:440 }, flavor:'It is always about to happen. It never quite does. Useful, that.' },
// THE NEW BiS — Khronaxis relic, ~1.6× a 120 relic (Last-Seal class, the definitive BiS):
khronaxis: { id:'the_last_hour', name:'The Last Hour', slot:'relic', rarity:'legendary', unique:true,
  stats:{ dmg:138, hp:560, crit:0.06, healPower:0.052 },
  flavor:'You hold it now. The world keeps turning because you remember to let it.' },   // power ≈ 412 ≈ 1.60×
// third named drops from the SECRET Stilled Sundial prop (Iteration E), granted via makeUnique('sundial'):
sundial: { id:'sundial_of_the_kept_hour', name:'Sundial of the Kept Hour', slot:'armor', rarity:'legendary', unique:true,
  stats:{ hp:760, speed:0.035 }, flavor:'Reads the same hour, always. The right one, it insists.' },        // ~1.10× slot-armor
```
The capstone-unique-keyed-by-kind clash (one boss, two desired drops) is resolved
the way the draft recommends: Khronaxis guarantees the relic BiS (`the_last_hour`)
via the EXPANSION_BOSSES path; the third named (`sundial`) is a secret prop drop,
not a boss roll — no collision.

## B.5 Dungeon entry portal + gate

The dungeon mouth is at the Hollow's deepest point (z ≈ −332, the spiral center,
where Tamsin stands). The entry arch lives in `hollow.js` (a second arch beside
Greta's grove-arch). Portal:
```js
{ x: 0, z: -340, label: 'Descend into The Last Hour',
  dest: { x: 300, z: 210, zone: 'horologium' },
  gate: (g) => g.slain.has('noctyra') || g.player.level >= 112,
  arriveMsg: 'The sand stops falling. Somewhere below, something very old hears you arrive and is, against all reason, glad.' }
// horologium.js exit portal:
{ x: 300, z: 210, label: 'Climb back to the Hollow', dest: { x: 0, z: -332, zone: 'hollow' },
  arriveMsg: 'Green light again. The Hollow kept growing while you were gone. It always does.' }
```
Add `slain.add('khronaxis')` on kill (existing onKill path records boss kinds);
this fires the cap-raise. Quaranth/echo/khronaxis all add to `game.slain`.

## B.6 Dungeon questgiver: Tamsin Verge (quests.js) — descent chain + bounty

A time-broken survivor who speaks half a sentence ahead of herself. Stands at the
Hollow's deepest signpost (z −332). `tamsin.chain = game.horologiumQuests`; rig
style `tamsin: { tunic: 0x2e3a4a, trim: 0x8a6a2a, weapon: 'none' }` (one line).
New kinds → `targetName` (quests.js) + `targetLabel` (ui.js) + the Set:
```js
const HOROLOGIUM_KINDS = new Set(['cogwraith','sandflayer']);
```
Chain (`trial:true` boss entries don't gate the bounty):
```js
const HOROLOGIUM_QUESTS = [
  { id:'t_cogs', name:'What the Sand Remembers', targetKind:'cogwraith', count:8, trial:false,
    intro:`You hear it too? Good. I thought it was just me, again, still, already. Down there the clock that holds the last hour is winding DOWN — and when it stops, so does everything. The wraiths are minutes that came loose. Put them back. Gently.`,
    outro:`Eight minutes, returned. The sand falls a little slower now. You're either very brave or you can't hear how this ends. Both, maybe.`,
    rewardXp:8750, rewardGold:6000 },
  { id:'t_quaranth', name:'The Pendulum Stops for No One', targetKind:'quaranth', count:1, trial:true,
    intro:`Quaranth was the keeper before the keeper. It stopped mid-swing, mid-thought, mid-IS. It won't let you past until it finishes the sentence. Don't let it finish the sentence.`,
    outro:`It said its last word. 'Was.' Then it was. Tragic. Loot it.`,
    rewardXp:12000, rewardGold:14000, rewardRunes:3 },
  { id:'t_echo', name:'An Echo, A Minute Late', targetKind:'echo', count:1, trial:true,
    intro:`You'll meet yourself down there — a half-second behind, holding a grudge. It chains you to where you just stood and drops the sky where you'll be. Be somewhere it doesn't expect. Be NOW.`,
    outro:`It stopped echoing. The silence is the loudest thing I've heard in a hundred years.`,
    rewardXp:12500, rewardGold:18000, rewardRunes:4 },
  { id:'t_khronaxis', name:'The Hour That Was Kept', targetKind:'khronaxis', count:1, trial:true,
    intro:`Khronaxis kept the last hour so the world would never reach the end of it. It is so tired. It WANTS you to take the hour — but its hands don't know how to let go, and they're as old as the world and they hit like it. When its time runs out it will rage; finish it before it remembers how. Then the hour is yours. Mind it. The world's counting on you — literally.`,
    outro:`It let go. The sand runs both ways now. You can age past where the world ever let anyone age. Go on. You've earned the next twenty years.`,
    rewardXp:11460, rewardGold:50000, rewardRunes:8 },
];

const HOROLOGIUM_BOUNTY = {
  name: 'Loose Minutes', count: 12,
  intro: `The clock sheds minutes faster than I can gather them — twelve more of the loose ones, whatever shape they've taken. Cogwraiths, Sandflayers, doesn't matter. Bring the time back. Some of it. Any of it.`,
  outro: `Twelve minutes, gathered. The sand stalls a heartbeat longer. We are, against all odds, not yet out of time.`,
};
function hgBountyXp(game) { return Math.max(11000, game.player.level * 100); }
function hgBountyGold(game) { return Math.max(11000, game.player.level * 100); }

export function createHorologiumQuests() {
  return makeChain({
    quests: HOROLOGIUM_QUESTS, bounty: HOROLOGIUM_BOUNTY, bountyXp: hgBountyXp, bountyGold: hgBountyGold,
    npcName: 'Tamsin Verge',
    bountyCounts: (enemy) => HOROLOGIUM_KINDS.has(enemy.kind),
    vendor: false,
  });
}
```

Dungeon signposts (one in the Hollow at the mouth, one inside the entry room):
```js
{ x: 0, z: -336, label: 'The Last Hour — recommended level 112+. Bring all the time you have.' },
{ x: 300, z: 214, label: '"Below this point the clock runs out. We could not say whether that was a warning or an invitation." — last words of the Verge expedition, scratched in sand.' },
```

## B.7 Iteration B touch-points

- **entities.js**: 5 rows (cogwraith/sandflayer/quaranth/echo/khronaxis);
  `castMechanic` geometry branches (beam/tether/shatterfloor) + sfx switch;
  `updateTelegraphs` resolve branches (beam/soak/tether/shatterfloor) + per-frame
  follow (beam/tether) + Khronaxis enrage damage mult; `updateEnemies`
  `e.combatT` accumulate + reset on return; HOROLOGIUM trash spawns.
- **characters.js**: CLASS_STYLES `cogwraith`, `khronaxis` (one line each);
  `'sand'` palette branch in `buildWolf` (or a desiccated rig); `tamsin` style.
- **audio.js**: `warnSweep`, `warnTether`, `warnShatter`.
- **ui.js**: `mechWarning` token map (+dodge/flee); `targetLabel` (new kinds);
  `refreshQuestTracker` (+horologiumQuests).
- **items.js**: `TIME_BOSSES`/`TIME_KINDS` + rollDrops branches; 4 uniques
  (quaranth/echo/khronaxis relic BiS + sundial secret).
- **noise.js**: `HOROLOGIUM` pocket override + `ZONE_BOUNDS.horologium`.
- **horologium.js** (NEW, sanctum clone): `buildHorologium(scene)` →
  `{update, walls, portals}`.
- **player.js**: wall switch `zone==='horologium'`; `LEVEL_CAP=120` + gainXp
  clamp.
- **hollow.js**: second arch + dungeon entry portal (z −340) with gate predicate.
- **quests.js**: `HOROLOGIUM_QUESTS` + bounty + KINDS Set +
  `createHorologiumQuests()`; targetName new kinds.
- **main.js**: `game.horologium` build; `setZone('horologium')` branch;
  `allPortals()` + zone clamps; `game.horologiumQuests` + `tamsin.chain` +
  `game.npcs` + save/load; `slain.add('khronaxis')` on kill.
- **styles.css**: `.mech-dodge` / `.mech-flee`.

---

# ITERATION C — Crafting + Sets + Class Skills

All numbers derive from the balance model. No passive DR, no dodge — sustain
(hp/healPower) and throughput (dmg/crit/speed) only.

## C.1 Crafting & gathering

### C.1a Materials as items (items.js)
Materials live in the existing inventory `Item[]`, tagged `kind:'material'` with
`qty`/`matId`, `slot:null` (equip/totalEquippedStats already skip null-slot/
no-stats items).
```js
export const MATERIALS = {
  fiber:    { matId:'fiber',     name:'Meadow Fiber',      icon:'🌿', tier:1, flavor:'Tough grass. Smells of home.' },
  cinderbark:{ matId:'cinderbark',name:'Cinderbark Resin', icon:'🔥', tier:2, flavor:'Sap that never fully cooled.' },
  frostcore:{ matId:'frostcore', name:'Frostcore Shard',   icon:'❄', tier:3, flavor:'Cold that bites back through the glove.' },
  stardust: { matId:'stardust',  name:'Captured Stardust',  icon:'✦', tier:4, flavor:'A pinch of the gate that fell.' },
  sporesilk:{ matId:'sporesilk', name:'Spore-Silk',         icon:'🍄', tier:5, flavor:'Spun by a thing that should not weave.' },  // Hollow tier (NEW, for the 106+ band)
  sealfragment:{matId:'sealfragment',name:'Fragment of the Seal',icon:'◈',tier:5,flavor:'It still wants to lock something.'},     // boss-gated reagent
};
export function makeMaterial(matId, qty=1){
  const m = MATERIALS[matId]; if(!m) return null;
  return { uid: rollUid(), id:matId, matId, name:m.name, icon:m.icon, kind:'material',
           slot:null, rarity:'common', stats:{}, value:Math.max(1, m.tier*8), qty, flavor:m.flavor };
}
```
> Note: `sporesilk` (Hollow tier-5 material) is added so crafting extends into
> the expansion band; the systems draft only went to `stardust`. Hollow trash
> drops `sporesilk` (zone-mat band ≥106).

- `player.addItem` (player.js ~L294): if `item.kind==='material'`, find an
  existing bag item with the same `matId` and `existing.qty += item.qty` (no new
  slot), else push.
- `player.equip` (player.js ~L259): `if (item.kind==='material'||item.kind==='map')
  return;` (also rejects treasure maps from Iteration E).

### C.1b Gathering nodes (NEW FILE src/gathering.js)
Deterministic placement via `makeRng(seed)` (world.js LCG). Nodes are static
meshes with runtime `{depleted, respawnT}`.
```js
export const NODE_TYPES = {
  herb:      { name:'Meadow Herb',  matId:'fiber',     yield:[1,2], color:0x6fd06a, respawn:60,  build:buildHerbNode },
  emberveins:{ name:'Ember Vein',   matId:'cinderbark',yield:[1,2], color:0xff7a30, respawn:90,  build:buildEmberNode },
  rimecluster:{name:'Rime Cluster', matId:'frostcore', yield:[1,2], color:0xaad9ff, respawn:90,  build:buildRimeNode },
  starshard: { name:'Star Shard',   matId:'stardust',  yield:[1,1], color:0xb8c4ff, respawn:120, build:buildStarNode },
  sporepod:  { name:'Spore-Pod',    matId:'sporesilk', yield:[1,2], color:0xff5ea8, respawn:120, build:buildSporePod },  // Hollow node (NEW)
};
const NODE_SITES = {
  world:     { type:'herb',        count:24 },   // overworld meadow
  highlands: { type:'emberveins',  count:14 },   // x 178..205 shelf
  frostveil: { type:'rimecluster', count:14 },   // x -360..-250 vale
  sanctum:   { type:'starshard',   count:8  },   // z 250..360 floor y40
  hollow:    { type:'sporepod',    count:14 },   // x -60..60 z -360..-250 (NEW)
};
```
`buildGathering(scene)` → `{ nodes:[{kind,group,home:Vector3,depleted:false,
respawnT:0,type}], update(dt) }`. update ticks respawnT on depleted nodes and
re-shows the mesh. Node rigs are tiny static groups (herb = 3 grass cones; ember
= 2 dodecahedrons emissive; rime = 2 tetrahedrons; star = an icosahedron;
spore-pod = a small flattened sphere on a stalk, magenta) using lambert/shadowed
helpers.

**Interaction verb: F (Gather).** Wire into the main.js F-handler block, AFTER
questgivers, alongside secrets/portal fallbacks. Proximity scan: nearest
non-depleted node within 3.5u → `gatherNode(game, node)`:
```js
function gatherNode(game, node){
  if(node.depleted) return;
  const [lo,hi]=node.type.yield; const q=lo+Math.floor(Math.random()*(hi-lo+1));
  game.player.addItem(game,makeMaterial(node.type.matId,q));
  node.depleted=true; node.respawnT=node.type.respawn; node.group.visible=false;
  game.audio.loot(); game.ui.log(`Gathered ${q}× ${MATERIALS[node.type.matId].name}.`,'log-loot');
  game.ui.floatText(node.group.position,`+${q} ${node.type.name}`,'loot'); game.save?.();
}
```
`game.gathering = buildGathering(scene)`; call `game.gathering.update(dt)` in the
loop; `ui.setInteractPrompt(true,'Gather')` when near a node.

### C.1c Recipes (items.js)
Three categories: utility elixirs (timed buffs), craftable gear (one per tier),
unique upgrade (the chase). No DR axis appears anywhere.
```js
export const RECIPES = [
  // ----- utility elixirs (consumables; throughput/utility, NO DR) -----
  { id:'elx_swift', name:'Elixir of the Hare', icon:'🐇', kind:'elixir',
    cost:{fiber:3}, gold:120, effect:{stat:'speed', amount:0.25, dur:30},
    desc:'+25% movement speed for 30s. For getting somewhere, not for getting hit less.' },
  { id:'elx_fury', name:'Cinderblood Elixir', icon:'🔥', kind:'elixir',
    cost:{cinderbark:3, fiber:2}, gold:400, effect:{stat:'dmgPct', amount:0.12, dur:30},
    desc:'+12% damage for 30s. Tastes of soot and bad decisions.' },
  { id:'elx_clarity', name:'Phial of Clarity', icon:'◈', kind:'elixir',
    cost:{frostcore:2, cinderbark:1}, gold:900, effect:{stat:'manaRegen', amount:1.0, dur:30},
    desc:'Doubles mana regen for 30s. The weave hums closer.' },
  { id:'elx_focus', name:'Starbright Tonic', icon:'✦', kind:'elixir',
    cost:{stardust:2, frostcore:2}, gold:2200, effect:{stat:'crit', amount:0.10, dur:30},
    desc:'+10% crit for 30s. Everything looks briefly fragile.' },
  { id:'elx_bloom', name:'Verdant Draught', icon:'🍄', kind:'elixir',
    cost:{sporesilk:2, stardust:1}, gold:3200, effect:{stat:'healPct', amount:0.20, dur:30},
    desc:'+20% healing for 30s. The Hollow shares, for once.' },   // Hollow-tier elixir (NEW)
  // ----- craftable gear: one per tier; chosen slot, fills a gap between drops -----
  { id:'craft_t1', name:'Pioneer Kit', icon:'⚒', kind:'gear',
    cost:{fiber:8}, gold:600, gen:{slot:'PICK', rarity:'rare', ilvl:12},
    desc:'A solid rare piece — ilvl 12. Choose the slot at the bench.' },
  { id:'craft_t2', name:'Cinderforge Kit', icon:'⚒', kind:'gear',
    cost:{cinderbark:8, fiber:6}, gold:4000, gen:{slot:'PICK', rarity:'rare', ilvl:70},
    desc:'Rare ilvl 70 — bridges the Highlands climb.' },
  { id:'craft_t3', name:'Rimeforge Kit', icon:'⚒', kind:'gear',
    cost:{frostcore:8, cinderbark:4}, gold:12000, gen:{slot:'PICK', rarity:'epic', ilvl:92},
    desc:'Epic ilvl 92 — relic-eligible at the bench.' },
  { id:'craft_t4', name:'Hollowforge Kit', icon:'⚒', kind:'gear',
    cost:{sporesilk:8, stardust:4}, gold:30000, gen:{slot:'PICK', rarity:'epic', ilvl:115},
    desc:'Epic ilvl 115 — closes the gap before The Last Hour.' },  // Hollow-tier gear (NEW)
  // ----- unique upgrade: +12% to one equipped unique, once -----
  { id:'reforge', name:'Reseal a Relic', icon:'◈', kind:'upgrade',
    cost:{sealfragment:1, stardust:4}, gold:25000,
    desc:'Re-temper one unique you own: +12% to all its stats. Once per unique.' },
];
```

**Elixir application** (player.js): elixirs are consumable items (`kind:'elixir'`),
drunk via a context action in the craft panel. Apply as transient timers on the
player, decremented in updatePlayer (alongside spreeT etc., NEVER saved):
```js
player.elixirT = 0; player.elixirEffect = null;   // {stat,amount} while active
```
Hook each affected derivation at its call site (the choiceIs talent gating
pattern): speed in the updatePlayer per-frame buff block (`×(1+amount)` when
`stat==='speed'` & `elixirT>0`); `dmgPct` in `rollDamage` (combat.js, `m *=
(1+amount)`, mirrors spreeT/avengerT); `crit` in `critChance` (`+ amount`);
`manaRegen` in the regen path; `healPct` in the heal-throughput path. All pure
throughput/utility — no DR axis, honoring policy.

**Reforge** (the unique upgrade): `reforgeUnique(game, item)`: for each axis in
`item.stats`, `item.stats[ax] *= 1.12` (round per convention), set
`item.reforged=true` (guard: skip if already reforged), recalc value,
`player.recalcStats()`, clamp hp. Only scales existing throughput/sustain axes
(no DR). +12% on a relic like The Last Seal ≈ +58 power, bounded to one
application.

### C.1d Crafting UI — Smith Halla + a panel
**Smith Halla** at the pioneer camp (origin), `buildHumanoid('smith')` (NEW
style: `smith:{tunic:0x6a5240,trim:0xb08040,weapon:'none',skin:0xc89a6a}`). No
quest chain (`halla.chain=null`, like Madge), pushed to `game.npcs`. F near her
opens the craft panel (extend the F-dispatch fallback, Madge-branch shape).

**Panel** `#craft-panel` (mirror `#char-panel`): index.html DOM, styles.css
chrome copy, ui.js `showCraft/hideCraft/craftOpen/toggleCraft/renderCraft(game)`.
renderCraft lists RECIPES with name/icon, cost (owned/needed, red if short),
gold cost, a Craft button (disabled if unaffordable), tooltips with `desc`. For
`gen:{slot:'PICK'}` show a slot picker (weapon/armor/trinket/relic). For
reforge/elixir-drink, an item picker over eligible equipped uniques. **Keybind:
`B`** (NOT K — resolves the K collision with the bestiary panel); add to the
Escape stack.
```js
function craft(game, recipe, opts){
  const p=game.player;
  for(const m in recipe.cost){ const have=p.inventory.find(i=>i.matId===m)?.qty||0; if(have<recipe.cost[m]) return false; }
  if(p.gold<recipe.gold) return false;
  for(const m in recipe.cost){ const it=p.inventory.find(i=>i.matId===m); it.qty-=recipe.cost[m];
    if(it.qty<=0) p.inventory.splice(p.inventory.indexOf(it),1); }
  p.gold-=recipe.gold;
  if(recipe.kind==='gear') p.addItem(game, makeGenerated(opts.slot, recipe.gen.rarity, recipe.gen.ilvl));
  else if(recipe.kind==='elixir') p.addItem(game, makeElixirItem(recipe));
  else if(recipe.kind==='upgrade') reforgeUnique(game, opts.item);
  game.audio.rune(); game.ui.log(`Crafted ${recipe.name}.`,'log-loot'); game.save?.();
  return true;
}
```
**Material drops:** extend `rollDrops` with a material branch BEFORE the trash
branch — trash mobs 25% drop their zone's tier material
(`makeMaterial(zoneMatFor(kind),1)`); expansion bosses always drop 1
sealfragment via `Math.random()<0.35`. Map enemy.level band → matId: ≤30→fiber,
31–75→cinderbark, 82–92→frostcore, 96–105→stardust, **≥106→sporesilk**.

## C.2 Item sets

### C.2a Set definitions (items.js)
Four named sets, 4 pieces each (one per slot). Bonuses are throughput/sustain
only.
> Note: the systems draft shipped three sets (hunters/warden/starbound). A
> **fourth Hollow-tier set** (`verdant`) is added so the expansion band has its
> own set chase, dropped by Hollow/dungeon bosses.
```js
export const SETS = {
  hunters: {  // "Trailwarden's Pursuit" — mid-game (ilvl ~55), Highlands drops
    id:'hunters', name:"Trailwarden's Pursuit",
    pieces:{
      weapon:{name:"Trailwarden's Edge",  stats:{dmg:55, crit:0.02}},
      armor: {name:"Trailwarden's Hide",  stats:{hp:200, speed:0.04}},
      trinket:{name:"Trailwarden's Mark", stats:{crit:0.04, hp:90}},
      relic: {name:"Trailwarden's Totem", stats:{dmg:33, hp:180, crit:0.02}},
    },
    bonus2:{ speed:0.06 }, bonus4:{ dmg:40, crit:0.03 },
    flavor:'Worn by those who ran down what the rest of us only feared.',
  },
  warden: {   // "Bulwark of the Long Watch" — defensive SUSTAIN set, NO DR
    id:'warden', name:'Bulwark of the Long Watch',
    pieces:{
      weapon:{name:'Watchblade',   stats:{dmg:50, hp:60}},
      armor: {name:'Watchplate',   stats:{hp:300, speed:0.02}},
      trinket:{name:'Watch-Sigil', stats:{hp:150, healPower:0.04}},
      relic: {name:'Watchstone',   stats:{hp:280, dmg:25, healPower:0.03}},
    },
    bonus2:{ hp:200 }, bonus4:{ healPower:0.10, hp:200 },
    flavor:'They held the door a long time. They would have held it longer.',
  },
  starbound:{ // "Regalia of the Fallen Star" — endgame (ilvl ~100), Sanctum drops
    id:'starbound', name:'Regalia of the Fallen Star',
    pieces:{
      weapon:{name:'Star-Splinter Blade', stats:{dmg:120, crit:0.03}},
      armor: {name:'Star-Splinter Mail',  stats:{hp:520, speed:0.03}},
      trinket:{name:'Star-Splinter Eye',  stats:{crit:0.06, healPower:0.05, hp:200}},
      relic: {name:'Star-Splinter Heart', stats:{dmg:90, hp:360, crit:0.04}},
    },
    bonus2:{ crit:0.05 }, bonus4:{ dmg:90, healPower:0.06 },
    flavor:'Four shards of the same dead star, hungry to be whole.',
  },
  verdant: {  // "Vestments of the First Spring" — Hollow tier (ilvl ~116), NEW
    id:'verdant', name:'Vestments of the First Spring',
    pieces:{
      weapon:{name:'Springthorn Lash',  stats:{dmg:150, crit:0.03}},
      armor: {name:'Springbark Hide',   stats:{hp:620, speed:0.03}},
      trinket:{name:'Springbloom Seed', stats:{crit:0.06, healPower:0.06, hp:240}},
      relic: {name:'Springroot Heart',  stats:{dmg:110, hp:420, crit:0.04}},
    },
    bonus2:{ healPower:0.06 }, bonus4:{ dmg:100, crit:0.04 },
    flavor:'Cut from the season the world tried to grow back all at once.',
  },
};
```
Bonus-math check (no-DR honored): every axis is dmg/crit/speed/hp/healPower —
zero mitigation. Verdant 4pc +100 dmg ≈ +20 DPS; warden 2pc+4pc +400 maxHp ≈ +8%
of an L106 maxHp (4320) — sustain, not safety.

### C.2b Where set bonuses compute (items.js totalEquippedStats)
Extend the existing summer; fold bonuses into the SAME axis output so
`gearStat()` → `recalcStats`/`baseDamage`/`critChance` inherit them with ZERO
combat changes:
```js
export function totalEquippedStats(equipped){
  const out={dmg:0,hp:0,crit:0,speed:0,healPower:0};
  if(!equipped) return out;
  const counts={};
  for(const slot of ALL_SLOTS){
    const it=equipped[slot]; if(!it||!it.stats) continue;
    for(const ax in out) out[ax]+=it.stats[ax]||0;
    if(it.setId) counts[it.setId]=(counts[it.setId]||0)+1;
  }
  for(const sid in counts){ const s=SETS[sid]; if(!s) continue;
    if(counts[sid]>=2) for(const ax in s.bonus2) out[ax]+=s.bonus2[ax];
    if(counts[sid]>=4) for(const ax in s.bonus4) out[ax]+=s.bonus4[ax];
  }
  return out;
}
```
Save round-trips for free — `equipped` items carry `setId` (already persisted).
**No schema bump needed for sets** if drop code stamps `setId`.

### C.2c Set drops (items.js rollDrops)
`makeSetPiece(setId, slot, ilvl)` beside makeUnique: clones
`SETS[setId].pieces[slot]` → instance with fresh uid, `setId`, `rarity:'epic'`,
`unique:false`. Inject: TRIAL_CRYPT_BOSSES (Highlands tier) 18% chance to swap
their guaranteed epic for a `hunters`/`warden` piece; EXPANSION_BOSSES (Frostveil/
Sanctum) 18% for `starbound`/`warden`; **HOLLOW + TIME bosses 18% for
`verdant`/`warden`** (NEW). Slot = boss's themed slot or random.

### C.2d Where set bonuses display
**Tooltip** (ui.js `_tipHTML`/`_attachTip`): when an item has `setId`, append a
set block listing all 4 piece names (green if owned/equipped, gray if not) + the
2pc/4pc bonus lines via `statSummary(bonus)`, plus the active "(2/4)" count.
**Character sheet** (ui.js renderCharSheet): a "Set Bonuses" row group — for each
set with ≥2 equipped pieces, a `row(setName, `${count}/4`, activeBonusSummary)`.
Drive the count off `equippedSetCounts(equipped)` (small exported helper).

## C.3 New class skills (one active per class, learned at level 55)

### C.3a Slotting & gating
New skill at bar idx 4 (capstones shift to idx 5/6/7 = keys 6/7/8, all in 1–9).
Dual-class worst case 5+5+3 = 13 → bind `Equal`(`=`)→idx 11 (one-line main.js
extension); idx 12 renders but may stay unbound. Skills appear in `allSkills()`
only when `level≥55`:
```js
allSkills(){ const all=[...this.cls.skills, ...(this.secondary?this.secondary.skills:[])];
  return all.filter(s=> !s.minLevel || this.level>=s.minLevel); },
```
Rebuild the action bar on level-up when crossing 55 (add a level-55 check beside
the capstone-unlock buildActionBar call). Stable unique `id` per skill (avoids
cooldown collision).

### C.3b The four skills (numbers from the model at L55: dmg 199.5, DPS ≈ 439, maxMp 930)
```js
// WARRIOR — Shield Bash: interrupt + brief stun, melee
{ id:'bash', name:'Shield Bash', icon:'🛡', color:'#ffd76e', kind:'damage',
  mult:1.6, range:3.4, mana:18, cd:14, cast:0, minLevel:55, stun:1.5, interrupt:true,
  desc:'Slam your guard into a foe: solid damage, a 1.5s stun, and it cuts a cast short.' },
// SCOUT — Hamstring Shot: snare + interrupt, ranged
{ id:'hamstring', name:'Hamstring Shot', icon:'➴', color:'#8aff9d', kind:'damage',
  mult:1.5, range:24, mana:20, cd:14, cast:0, minLevel:55, snare:0.5, snareDur:3, interrupt:true,
  desc:'An arrow through the leg: damage, a 50% slow for 3s, and it spoils a spell.' },
// MAGE — Frost Nova: AoE root, self-centered
{ id:'frostnova', name:'Frost Nova', icon:'❄', color:'#aad9ff', kind:'aoe',
  aoeCenter:'self', aoeRadius:6, mult:1.4, range:6, mana:30, cd:16, cast:0, minLevel:55, root:2, interrupt:true,
  desc:'A ring of ice: damage to all nearby, roots them for 2s, and interrupts their casts.' },
// PRIEST — Word of Stillness: single-target interrupt + silence, ranged
{ id:'stillness', name:'Word of Stillness', icon:'✋', color:'#ffe08a', kind:'damage',
  mult:1.3, range:15, mana:22, cd:18, cast:0, minLevel:55, silence:2.5, interrupt:true,
  desc:'Speak the old quiet: light damage, but the target cannot cast for 2.5s — and any spell breaks.' },
```

### C.3c Control riders (entities.js + combat.js)
Add a minimal CC mechanism. In makeEnemy: `e.ccT=0`, `e.snareT=0`/`e.snareAmt=0`,
`e.silenceT=0`, `e.rooted=false`. In updateEnemies:
- **Stun/root**: when `e.ccT>0`, decrement and skip chase/attack
  movement+attack (early-continue the AI switch; keep death/respawn). Stun blocks
  attacks; root blocks movement only (`e.rooted` flag).
- **Snare**: multiply `e.type.speed` by `(1-e.snareAmt)` while `e.snareT>0`.
- **Interrupt/silence**: enemies only "cast" mechanics — interrupt resets
  `e.mechTimer` to its interval AND splices any in-flight telegraph with
  `tg.source===e`; silence extends suppression via `e.silenceT`.

In resolveSkill (combat.js), AFTER damage/aoe resolves, apply riders:
```js
function applyCC(e, skill){
  if(skill.stun){ e.ccT=Math.max(e.ccT,skill.stun); }
  if(skill.root){ e.ccT=Math.max(e.ccT,skill.root); e.rooted=true; }
  if(skill.snare){ e.snareT=skill.snareDur; e.snareAmt=skill.snare; }
  if(skill.silence){ e.silenceT=skill.silence; }
  if(skill.interrupt){ e.mechTimer=Math.max(e.mechTimer, 0.5);
    for(let i=telegraphs.length-1;i>=0;i--) if(telegraphs[i].source===e){ /*dispose meshes*/ telegraphs.splice(i,1); } }
}
```
`damage` skills call `applyCC(p.target, skill)` on hit; `aoe` calls it per enemy.
**Boss caveat:** add `e.type.ccImmune` (true for all trial/crypt/expansion/
dungeon bosses incl. quaranth/echo/khronaxis/vorthal/spireshade/grim). Interrupt/
silence still work (skill check); stun/root/snare reduce to a flat 0.5s stagger
or are ignored — no perma-stun loop, preserving the no-stat-walls philosophy.

**UX note:** these are PLAYER abilities, so the boss-telegraph 4-part rule does
NOT apply. Feedback: floating "Stunned!"/"Rooted!"/"Silenced!"/"Interrupted!"
via `ui.floatText`, a distinct sfx (`sfx.freeze()`:
`freeze(){ tone(523,'sine',0.01,0.18,0.4); noiseBurst(0.2,1200,0.5,0.08); }`),
small `fx.burst` in the skill color.

### C.3d Save impact
None for skills (class-defined, learned by level, `cooldowns[id]` already
persists). CC timers on enemies are transient. Sets ride existing `equipped`
persistence. The ONLY genuinely new persisted field from Iteration C is
`nodesDepleted` (gathering) — folded into the v5 bump (§11).

## C.4 Iteration C flavor (full)

- **Smith Halla intro:** "Halla. I shoe boars and bend bad iron straight. Bring
  me what the world's lying around and I'll make it worth carrying."
- **Node prompts:** Herb→"Meadow Herb", Ember Vein→"Ember Vein (warm to the
  touch)", Rime Cluster→"Rime Cluster (your breath fogs)", Star Shard→"Star Shard
  (it hums)", Spore-Pod→"Spore-Pod (it twitches when you reach for it)".
- **Reforge confirm:** "Re-temper this? The metal remembers being whole. It'll
  hold more of you. Once, mind — twice and it shatters."
- **Elixir of the Hare desc:** "Drink and the ground gets shorter. Doesn't stop
  a fist, only helps you not be where the fist is."
- **Set tooltip headers:** hunters → "Trailwarden's Pursuit — they ran down what
  the rest of us feared. Wear two and move like it; wear all four and hit like
  it."; warden → "Bulwark of the Long Watch — it will not save you from the blow.
  It will keep you standing for the next one."; starbound → "Regalia of the
  Fallen Star — four shards of one dead star, and each one wants the others
  back."; verdant → "Vestments of the First Spring — cut from the season the
  world tried to grow back all at once."
- **New-skill learn toasts (level 55):** Warrior → "You've learned Shield Bash.
  Some conversations end with a guard to the teeth."; Scout → "You've learned
  Hamstring Shot. Let them run. Slower."; Mage → "You've learned Frost Nova. Now
  they can watch."; Priest → "You've learned Word of Stillness. The old quiet
  has a name, and you can say it now."

## C.5 Iteration C touch-points

- **items.js**: MATERIALS+makeMaterial, RECIPES, SETS+makeSetPiece+
  equippedSetCounts, totalEquippedStats set-fold, rollDrops material+set
  branches, reforge value recalc.
- **NEW src/gathering.js**: buildGathering, NODE_TYPES, node rigs, update(dt).
- **player.js**: addItem stacking + equip material/map guard, elixirs/elixirT/
  elixirEffect + decrement, allSkills() minLevel filter, reforgeUnique.
- **combat.js**: resolveSkill applyCC riders, rollDamage elixir dmgPct, CC fields.
- **player.js critChance/recalcStats**: elixir crit/manaRegen/healPct hooks.
- **entities.js**: makeEnemy ccT/rooted/snareT/silenceT, updateEnemies CC gating
  + telegraph-cancel on interrupt, type.ccImmune for bosses.
- **characters.js**: `smith` style (one line).
- **audio.js**: sfx.freeze()/sfx.stun().
- **ui.js**: craft panel, tooltip set block, char-sheet set rows, node interact
  prompt.
- **main.js**: gathering wiring + update, gatherNode + F-dispatch, Smith Halla
  NPC, craft keybind `B` + Escape stack, `Equal`→idx 11, level-55 buildActionBar
  rebuild, save v5 (nodesDepleted) + load default-fill.
- **player.js CLASSES**: the 4 new skill objects with minLevel:55.

---

# ITERATION D — Achievements / Bestiary + Titles

## D.1 Panel & keybind

New `#achievement-panel` (mirror `#char-panel`), keybind **K** ("Konown"),
Escape-stack entry, close button. ui.js gets `showAchievements/hide/open/toggle/
renderAchievements`. Two tabs: **Bestiary** (every kind in `player.counters`, "X
slain: N", first-kill flavor unlocked) and **Achievements** (✓/locked). innerHTML
from dev strings only.

## D.2 Data shape (save v5)
```js
player.counters = {};        // { boar:0, wolf:0, mimic:0, grim:0, … } incremented in onKill by enemy.kind
player.achievements = {};    // { id:true } once earned
player.title = null;         // active title string, e.g. 'the Hoardfinder'
player.titles = [];          // all earned titles (player picks active in char sheet)
```
`onKill` (combat.js) already manages `game.slain`; add
`player.counters[enemy.kind] = (player.counters[enemy.kind]||0)+1` beside it,
then `checkAchievements(game)` (new `achievements.js`). `checkAchievements`
evaluates every criterion against counters/slain/secrets/level/gold, awards
unearned ones (`achievements[id]=true`, push title to `titles`, `sfx.levelup()`,
`ui.log('Achievement: <name> — <reward>', 'log-quest')`, nudge a badge on the K
button, `game.save()`).

## D.3 Title system
Cosmetic strings shown on the character sheet beside the name (`#char-name` as
`"<class name> · <title>"`). Char sheet gets a small "Titles" dropdown listing
`player.titles`; selecting sets `player.title`. Default null = none. No stats.

## D.4 ~17 achievements (achievements.js — extended for the new content)
```js
export const ACHIEVEMENTS = [
 { id:'first_blood', name:'First Blood', desc:'Slay your first boar.', criteria:g=>g.player.counters.boar>=1, reward:null },
 { id:'the_pestilence', name:'The Pestilence of Boars', desc:'Slay 500 boars.', criteria:g=>g.player.counters.boar>=500, reward:'title: Boarbane' },
 { id:'crypt_clear', name:'King-Killer', desc:'Slay Vargoth the Undying.', criteria:g=>g.slain.has('vargoth'), reward:'title: the Undying-Ender' },
 { id:'wyrmsbane', name:'Wyrmsbane', desc:'Slay Pyraxis, the Cinder Wyrm.', criteria:g=>g.slain.has('pyraxis'), reward:'title: Wyrmsbane' },
 { id:'hollow_star', name:'Held the Door', desc:'Slay Noctyra, the Hollow Star.', criteria:g=>g.slain.has('noctyra'), reward:'title: Doorkeeper' },
 { id:'hoardfinder', name:'The Hoardfinder', desc:"Find the Badger's Larder.", criteria:g=>g.player.secrets.pocket?.larderLooted, reward:'title: the Hoardfinder' },
 { id:'cartographer', name:'X Marks Nothing', desc:'Dig up all five treasure maps.', criteria:g=>Object.values(g.player.secrets.maps||{}).filter(v=>v==='dug').length>=5, reward:'title: the Cartographer' },
 { id:'bitten', name:'It Had Teeth', desc:'Be ambushed by a Mimic.', criteria:g=>g.player.counters.mimic>=1, reward:null },
 { id:'exterminator', name:'Furniture Exterminator', desc:'Slay 10 Mimics.', criteria:g=>g.player.counters.mimic>=10, reward:'title: the Furniture-Slayer' },
 { id:'settled', name:'Paid In Full', desc:'Settle accounts with Grim, the Tax Collector.', criteria:g=>g.slain.has('grim'), reward:'title: the Settled' },
 { id:'madge_six', name:'Madge-Approved', desc:"Answer all six of Madge's riddles.", criteria:g=>g.player.secrets.riddles>=6, reward:'title: Madge-Approved' },
 { id:'angler', name:'A Thousand Regrets', desc:'Land the Carp of a Thousand Regrets.', criteria:g=>g.player.inventory?.some(i=>i.id==='carp_of_regrets')||g.player.equipped?.weapon?.id==='carp_of_regrets', reward:'title: the Angler' },
 { id:'gilded', name:'Where Bodo Got Them', desc:'Slay Thunderbristle.', criteria:g=>g.slain.has('thunderbristle'), reward:'title: the Gilded' },
 { id:'gardener', name:'On the Fertility of Catastrophe', desc:'Slay Vorthal, the First Root.', criteria:g=>g.slain.has('vorthal'), reward:'title: the Gardener' },           // NEW (Hollow)
 { id:'timekeeper', name:'The Hour Is Yours', desc:'Slay Khronaxis and keep the last hour.', criteria:g=>g.slain.has('khronaxis'), reward:'title: the Timekeeper' },        // NEW (capstone)
 { id:'fully_invested', name:'Fully Invested', desc:'Reach the level cap (120).', criteria:g=>g.player.level>=120, reward:'title: the Ascended' },                          // UPDATED 105→120
 { id:'oathsworn', name:'Oathsworn', desc:'Swear a Mastery Oath.', criteria:g=>!!g.player.talents.mastery, reward:'title: the Sworn' },
 { id:'completionist', name:'There Was Always More', desc:'Earn every other achievement.', criteria:g=>ACHIEVEMENTS.filter(a=>a.id!=='completionist').every(a=>g.player.achievements[a.id]), reward:'title: the Finished' },
];
```
> Changes from the hidden draft: `fully_invested` criterion updated to 120 (this
> expansion raises the cap); added `gardener` (Vorthal) and `timekeeper`
> (Khronaxis) so the new content is represented; `completionist` auto-includes
> them.

## D.5 Iteration D touch-points
- **index.html**: panel DOM.
- **styles.css**: panel chrome (copy char-panel) + K-button badge.
- **ui.js**: panel render + char-sheet title row + K-button badge +
  `targetLabel`/`targetName` for new kinds.
- **main.js**: K keybind, Escape stack, close binding, save/load of
  counters/achievements/title/titles, default-fill on v<5, `ACHIEVEMENTS` import
  + `checkAchievements` call sites. `__veteran`/`__veteran2` default-fill the new
  fields so test heroes don't crash the panel.
- **combat.js**: counter increment + `checkAchievements(game)` beside the
  `game.slain` block.
- **NEW achievements.js**: ACHIEVEMENTS array + checker.

---

# ITERATION E — The Hidden Layer

Every number derives from the model. Level-119 reference player: maxHp 4840;
maxMp 1954; dmg 423.5; DPS ≈ 931.7. Build LAST (depends on D's counters/title
plumbing and A/B's zones).

## E.1 Secret pocket zone — "The Larder" (no portal, no map marker)

A small frostbitten root-cellar dug under the world by something that hoards.
Three sealed clay urns and a frozen-over trapdoor. Reward is a vanity relic + a
title, NOT power-creep.

**Discovery path (environmental puzzle chain, no NPC, no quest entry):**
1. In the **Frostveil** vale add a 4th weather-worn signpost: *"The badger digs
   where the aurora never reaches. Three knocks, then wait for the cold to
   answer."* (pure flavor hint).
2. Trigger prop: a flat cairn-like snow mound at the vale's darkest corner
   (x≈−340, z≈−40, the aurora shader's dimmest band). Build in frostveil.js as a
   small `DodecahedronGeometry` cluster half-buried; return `larderMoundPos`
   (Vector3) like world.js returns `cairnPos`.
3. Emote three times — press F on the mound three times within 6s
   (`game._larderKnocks`, timer-reset). Each knock: muffled `sfx.loot()` +
   `ui.log('Something underneath shifts.', 'log-sys')` (cairn distance-check
   F-handler pattern).
4. On the 3rd knock the trapdoor "thaws": `player.secrets.pocket.larderOpen =
   true`, mound rotates open, a `swirlIn` appears (dungeon entrance pattern), and
   it becomes a portal pushed into `frostveil.portals`:
   ```js
   { x:-340, z:-40, label:'Drop into the dark', dest:{x:160,z:-350, zone:'larder'},
     arriveMsg:'It smells of old fur and older gold.' }
   ```
   **The portal only exists after the knock puzzle** — never in `allPortals()`
   until then, so it appears on no map.

> **Conflict fix (geography):** the draft's destination `{x:0,z:0,zone:'larder'}`
> with a pocket at `x−350..−330 z−50..−30` overlapped FROSTVEIL. The pocket is
> relocated to `LARDER = {x1:150,x2:170,z1:-360,z2:-340, floor:20}` (empty world
> corner), dest `{x:160,z:-350}`. The discovery mound + signpost stay in the
> Frostveil vale; only the room moved.

**The zone (`zone:'larder'`):** a tiny crypt-style room ~20×16. NEW
`buildLarder(scene)` in NEW `larder.js`, mirroring sanctum.js: 4 wall AABBs,
floor PlaneGeometry, `ZONE_BOUNDS.larder` (§0.2) + a `LARDER` flat-floor pocket
override in noise.js (`floor:20`), wall collision gated in player.js
(`zone==='larder'?game.larder:…`). `'larder'` setZone branch (dim amber, one
PointLight). One exit `swirlOut` back to the mound (`dest:{x:-340,z:-40,
zone:'frostveil'}`).

**Reward:** three urns (F once each). Two hold gold (8,000g + 12,000g). The third
holds the vanity relic + grants the title:
```js
larder: {   // UNIQUES, granted via makeUnique('larder')
  id: 'the_badgers_hoard', name: "The Badger's Hoard", slot: 'relic', rarity: 'legendary', unique: true,
  stats: { hp: 120, speed: 0.03 },   // power ≈ 80, deliberately LOW: vanity, not BiS
  flavor: 'Whatever lived down here counted its coins twice a night. Now you carry the lot.',
},
```
Power ≈ 80 (far under The Last Seal's 362) — cosmetic prestige, not an upgrade.
Granting sets `player.title = 'the Hoardfinder'` (also adds to `titles`) and
`secrets.pocket.larderLooted = true`.

Touch points: NEW `larder.js`; noise.js (LARDER override + ZONE_BOUNDS + heightAt
pocket); frostveil.js (mound + signpost + conditional portal); main.js (setZone
case, F-handlers, save fields, `game.larder`); items.js (UNIQUES.larder);
player.js (wall-collision zone case).

## E.2 Treasure maps — rare word-clue drops (items.js)

Inventory items `kind:'map'`, `slot:null` (branch in `player.equip` to reject —
covered by the C.1a guard). Read via F on the dig spot, or shown in the tooltip.
```js
export const TREASURE_MAPS = {
  aurora_stones: { id:'map_aurora_stones', name:'Smudged Vellum Map', kind:'map', slot:null,
    rarity:'uncommon', unique:false, value:0,
    clue:'Where the aurora touches three standing stones and none of them agree on the time. Dig at the eldest.',
    spot:{ zone:'frostveil', x:-300, z:30, r:4 }, loot:{ gold:[6000,9000], rarity:'epic', uniqueChance:0.10 } },
  ash_road: { id:'map_ash_road', name:'Charred Map Fragment', kind:'map', slot:null,
    rarity:'uncommon', unique:false, value:0,
    clue:'Follow the dirt road in the meadow until it forgets it was a road. Where the last ember-tree leans west, turn the soil.',
    spot:{ zone:'highlands', x:190, z:-20, r:4 }, loot:{ gold:[7000,10000], rarity:'epic', uniqueChance:0.10 } },
  pond_reeds: { id:'map_pond_reeds', name:'Water-Stained Map', kind:'map', slot:null,
    rarity:'uncommon', unique:false, value:0,
    clue:'A pond so still it forgot to ripple. Stand among the seven reeds. The fattest one is lying — dig under the second-fattest.',
    spot:{ zone:'world', x:56, z:-70, r:4 }, loot:{ gold:[5000,8000], rarity:'rare', uniqueChance:0.0 } },
  crypt_throne: { id:'map_crypt_throne', name:'Map Drawn in Soot', kind:'map', slot:null,
    rarity:'rare', unique:false, value:0,
    clue:'A king who would not die kept a king who could not stop counting. Behind the throne, where the wall pretends to be a wall.',
    spot:{ zone:'crypt', x:340, z:0, r:4 }, loot:{ gold:[9000,13000], rarity:'epic', uniqueChance:0.15 } },
  sanctum_orrery: { id:'map_sanctum_orrery', name:'Map of Star-Threads', kind:'map', slot:null,
    rarity:'rare', unique:false, value:0,
    clue:'Beneath the wheel of little worlds, where the floor is glass and the glass is sky. Dig where no star is painted.',
    spot:{ zone:'sanctum', x:0, z:300, r:4 }, loot:{ gold:[10000,14000], rarity:'epic', uniqueChance:0.15 } },
};
export function makeTreasureMap(key){ const t=TREASURE_MAPS[key]; return { uid: rollUid(), ...t, stats:{} }; }
```
**Drop:** extend `rollDrops(enemy)` — on any **elite or boss** kill,
`Math.random()<0.04` → `makeTreasureMap(pick(keys))`, one per kill, skip if
`player.secrets.maps[key]==='dug'`. Maps stack with normal loot.

**Dig interaction (main.js F-block):** if the player holds an undug map whose
`spot.zone===game.zone` and within `spot.r`, F triggers a 2.5s "Digging…"
cast-bar (fishing pattern), spawns a chest mesh (dungeon.js chest factory),
opens the lid, pays `loot.gold`, rolls `makeGenerated(pick(SLOTS), loot.rarity,
player.level)`, and `loot.uniqueChance` rolls a random boss unique you don't yet
own. Set `player.secrets.maps[key]='dug'`, consume the map, `sfx.loot()`,
`fx.burst` gold, `game.save()`. Wrong spot → log *"The map insists. The ground
disagrees."* Save: `secrets.maps = { aurora_stones:'held'|'dug', … }`; dug spots
stay dug.

## E.3 Mimic chests — fake chests that bite (entities.js + characters.js)

Placed sparingly in the two wall-dungeons (crypt + sanctum), looking like a loot
chest until approached. Tuned as a level-60 elite surprise (at-level-60 player
maxHp 2480; DPS 470.8):
```js
mimic: {
  name: 'Mimic', level: 60, hp: 3700,        // TTK ≈ 7.9s — a sharp scare, not a slog
  dmgMin: 95, dmgMax: 130,                    // dps ≈ 62 ≈ 0.025×2480 — chunky bites, never lethal alone
  xp: 0,                                       // a surprise, not a farm target
  speed: 0,                                    // ROOTED (a chest can't chase)
  aggroRadius: 3.5,                            // only "wakes" at chest-open range
  attackRange: 3.0, gold: [400, 900],
  elite: true,                                 // 2.2s interval, elite nameplate once revealed
  leash: 6, armor: 18,                          // armor ≈ 4% of an at-level-60 hit (wooden hide)
  build: () => buildMimic(),                    // NEW rig
  humanoid: true,                               // faces the player squarely (more menacing)
  reveal: true,                                 // NEW flag: render as a closed chest until aggro'd
},
```
**Subtle telegraph (the point):** before aggro it is visually a chest. `buildMimic()`
(characters.js): a `chestBase` box + `chestLid` box + two tiny eye glints under
the lid lip + a stubby tongue, all faces +Z; rig pivots `{lid, tongue, legs:[]}`.
The only tells, deliberately faint: (a) lid **breathes** — ±0.04 rad oscillation
in idle; (b) within 5u (just outside aggro 3.5u) a single low wooden creak
(`audio.creak()`: `tone(70,'sawtooth',0.02,0.4,0.5)`) plays once via a mech-less
proximity check. NO banner — a skill check of attention, per the difficulty
philosophy. On aggro: lid SNAPS open, eyes flare, `fx.burst(pos,0xff5a3a,20)`,
`ui.log('The chest had TEETH.', 'log-sys')`, nameplate flips to hostile elite.

**Placement:** hardcode 1–2 mimic spawn points among real decor (crypt corridor
B; sanctum entry alcove) via `makeEnemy('mimic',x,z)` + `scene.add` in
spawnEnemies' dungeon section. Suppress respawn after first kill via a
`secrets.mimics` save flag (checked at spawn time). Drops route normally through
`rollDrops` (it's `elite:true` → 100% one rare-skewed item + the standard map
chance). `animateMimic(group,state,elapsed)`: lid breathe idle, lid-chomp on
`attackT`; add the import + dispatch branch (entities.js ~L948).

## E.4 Secret boss — Grim, the Tax Collector (ritual-summoned, level 119)

> *Every coin you ever picked up was, technically, owed. Grim has come to audit.*

**Summon ritual:** in the **Starfall Sanctum** final hall, re-flag the three
constellation pillars as ritual nodes. F-interact in the order spelled by Madge's
"three debts" riddle (§E.5): **the dim one, then the bright one, then the one
that flickers.** Track `secrets.ritual = { step:0 }`. Wrong order → reset, log
*"The stars lose their place."*, `sfx.warnMove()`. Correct 3rd → the Star Cradle
dais cracks, `sfx.levelup()`, `fx.burst` gold, `spawnTrialBoss(game,'grim')` at
the dais (0,346). Re-summonable after kill (re-farm); `secrets.ritual.done` gates
only the achievement.
```js
grim: {
  name: 'Grim, the Tax Collector', level: 119, humanoid: true, elite: true,
  hp: 140000,                  // TTK ≈ 140000/931.7 ≈ 150s (trial-plus tier)
  dmgMin: 360, dmgMax: 460,    // melee dps ≈ 186; effective w/ mechanics ≈ 0.074×4840 ≈ 359/s
  xp: 0,                       // pays in loot + title, not XP grind
  speed: 5.5, aggroRadius: 0, attackRange: 3.0,   // aggroRadius 0 = passive until summoned/hit
  gold: [40000, 60000], leash: 80, armor: 0,
  build: () => { const g = buildHumanoid('grim'); g.scale.setScalar(1.6); return g; },
  mechanics: [
    { kind:'slam', interval:9, telegraph:1.6, radius:5.5, dmg:1950, center:'player', avoid:'jump',
      color:0xffd24a, warn:'tallies your debts!', dodgeMsg:'You skip the bill!' },                       // 40% of 4840
    { kind:'zone', interval:11, telegraph:2.0, radius:9, dmg:1840, center:'boss', avoid:'move',
      color:0xc8a23a, warn:'seizes the surrounding assets!', dodgeMsg:'You keep what is yours!' },        // 38%
    { kind:'firepatch', interval:13, telegraph:1.5, radius:4, dmg:1450, center:'player', avoid:'move',
      linger:18, lingerDmg:290, color:0xe0b84a, warn:'lets the interest accrue.', dodgeMsg:'Paid early!' }, // 6%/s linger
  ],
  summons: { at:[0.5], kind:'mimic', count:2 },   // at 50%, "calls in the collateral"
},
```
Effective-dps sanity: melee 186 + averaged mechanic pressure ≈ 173/s ≈ 359/s ≈
0.074×4840 — right at the 0.08 boss target; all bursts dodgeable (jump/move).
Difficulty by skill check, not stat wall.

**Unique drop** (BiS-class sidegrade, ~1.3× a tier weapon, gated behind ritual +
150s fight):
```js
grim: {   // UNIQUES, keyed by kind so the EXPANSION_BOSSES-style path grants it
  id: 'the_final_invoice', name: 'The Final Invoice', slot:'relic', rarity:'legendary', unique:true,
  stats: { dmg: 130, hp: 420, crit: 0.06, healPower: 0.05 },   // power ≈ 366 ≈ The Last Seal's 362 (sidegrade BiS relic)
  flavor: 'Marked PAID IN FULL, in a hand that does not shake. The debt was always going to be you.',
},
```
Add `'grim'` to a guaranteed-unique path in rollDrops (EXPANSION_BOSSES mirror:
epic + 100% the invoice on first kill, then 25% on re-kills). Grants title **"the
Settled"**.

Touch points: entities.js (ENEMY_TYPES.grim, spawnTrialBoss case); characters.js
(CLASS_STYLES.grim: `{tunic:0x2a2a33, trim:0xffd24a, weapon:'staff',
skin:0x6a6a72}`); sanctum.js (pillar ritual flags); main.js (F-handler ritual
order, save `secrets.ritual`); items.js (UNIQUES.grim + rollDrops branch); ui.js
(`targetLabel`/`targetName` 'grim').

## E.5 Three new riddles for Hermit Madge (main.js)

Extend the `RIDDLES` array; bump the `>=3` payout gates to `>=6` (the pebble
already paid at 3); award **+5 runes per new riddle** and, on the 6th, the title
**"Madge-Approved"**. Riddle #4 is the ritual-order hint for Grim.
```js
{ q: 'Three debts hang in the sanctum sky. You must pay the dim one first, the bright one second, and the one that cannot make up its mind, last. In what order do you press them?',
  options: ['Dim, bright, flickering', 'Bright, dim, flickering', 'Flickering, dim, bright'], answer: 0 },
{ q: 'It is opened a thousand times by every hero and has nothing inside but, once, has everything inside but you. What is it?',
  options: ['A door', 'A chest', 'A hand'], answer: 1 },   // the Mimic joke
{ q: 'A badger buried it, the aurora hides it, and three knocks wake it. I have never been down there. Would YOU knock on a thing that knocks back?',
  options: ['Yes, obviously', 'Three times, then wait', 'Never'], answer: 1 },   // the Larder hint
```
Lead-in for #4: *"You've a knack for this. Here's one that's actually useful,
which I resent."* On completing all six, Madge: *"Six. SIX. Nobody does six. Take
the title. Take it and go before I get attached."*

## E.6 Iteration E touch-points
- **larder.js** (NEW): `buildLarder(scene)` → `{walls, portals, urns}`.
- **noise.js**: `LARDER` pocket override + ZONE_BOUNDS + heightAt branch.
- **frostveil.js**: 4th signpost, larder mound (`larderMoundPos`), conditional
  portal on knock-puzzle.
- **entities.js**: `mimic` row; `buildMimic`/`animateMimic` import + dispatch;
  `grim` row + spawnTrialBoss case.
- **characters.js**: `buildMimic` rig; CLASS_STYLES `grim`.
- **items.js**: UNIQUES `larder`/`grim`; TREASURE_MAPS + makeTreasureMap;
  rollDrops map branch + grim guaranteed-unique branch.
- **sanctum.js**: pillar ritual flags.
- **audio.js**: `creak()`.
- **main.js**: setZone `larder` case; Larder knock F-handler + 6s timer; treasure
  dig F-handler + cast-bar; Grim ritual F-handler; RIDDLES +3 + payout gates →6;
  save/load `secrets.maps/pocket/ritual/mimics`.
- **player.js**: wall-collision `zone==='larder'`; equip rejects `kind:'map'`.
- **ui.js**: `targetLabel`/`targetName` 'grim'.

---

# Save schema v5 (single bump — all four drafts merged)

Bump `v:5` in `game.save()` and the new-save stub. `loadSave()` accepts
`[1,2,3,4,5]`. v<5 default-fills every new field; v4 talents/relic logic
unchanged. Transient buff/CC timers are NEVER saved.

### New persisted fields (collected from all iterations)
```js
// in save() — additions to the existing v4 object:
v: 5,
hollowQuests: game.hollowQuests.serialize(),          // Iteration A
horologiumQuests: game.horologiumQuests.serialize(),  // Iteration B
nodesDepleted: game.gathering.nodes.map(n => n.depleted ? Math.round(n.respawnT) : 0),  // Iteration C (gathering)
counters: p.counters,                                 // Iteration D
achievements: p.achievements,                         // Iteration D
title: p.title, titles: p.titles,                     // Iteration D
secrets: p.secrets,   // EXTENDED (see below) — Iterations A/B (slain keys) + E
// NOTE: materials, set pieces, and reforged uniques round-trip FOR FREE inside
// the already-saved p.inventory / p.equipped (they are tagged items, no new field).
// New slain keys (vorthal, spireshade, quaranth, echo, khronaxis, grim) ride the
// existing [...game.slain] serialization — no new field, just new values.
```

### Extended `secrets` object (v5 default-fill)
```js
secrets: {
  vault: false, riddles: 0,                                   // existing (v4)
  maps: {},                                                   // §E.2  { key: 'held'|'dug' }
  pocket: { larderOpen: false, larderLooted: false },        // §E.1
  ritual: { step: 0, done: false },                          // §E.4
  mimics: {},                                                 // §E.3  cleared-mimic flags
},
```

### Load defaults (main.js, after the existing v4 fills)
```js
// quests chains (no-op on undefined / old saves):
game.hollowQuests.load(saved.hollowQuests);
game.horologiumQuests.load(saved.horologiumQuests);
// gathering:
const nd = saved.nodesDepleted;
if (nd) game.gathering.nodes.forEach((n,i) => { if (nd[i] > 0) { n.depleted = true; n.respawnT = nd[i]; n.group.visible = false; } });
// achievements / titles / counters:
p.counters ??= {}; p.achievements ??= {}; p.titles ??= []; p.title ??= null;
p.counters = saved.counters ?? {}; p.achievements = saved.achievements ?? {};
p.titles = saved.titles ?? []; p.title = saved.title ?? null;
// secrets extensions:
p.secrets.maps ??= {};
p.secrets.pocket ??= { larderOpen:false, larderLooted:false };
p.secrets.ritual ??= { step:0, done:false };
p.secrets.mimics ??= {};
```

### Cap raise
`player.js`: `export const LEVEL_CAP = 120;` + guard the level loop
(`while (this.level < LEVEL_CAP && this.xp >= xpForLevel(this.level))`), zero
residual xp at cap. Not a save field (level already persists).

### Console helpers
Add `__veteran3('<class>')` (a level-118 post-Vorthal v5 hero at the dungeon
gate): writes a v5 save with `slain` incl. `…pyraxis,hrimnir,seraphel,noctyra,
spireshade,vorthal`, full Hollow chain done, empty horologium chain, default-
filled v5 fields (counters/achievements/titles/secrets), equipped relic chase
from zero. Update `__veteran`/`__veteran2` so they default-fill the new v5 fields
on load (so old test heroes don't crash the bestiary/achievement panels).

---

# Balance ledger (every new enemy/boss, computed from the model)

Model: `maxHp=80+40L`, `dmg=7+3.5L`, `DPS≈2.2·dmg`, heal `0.10·maxHp/s`; boss
sustain dps `≈0.08·at-level maxHp`; sustain floor `maxHp≈dps/0.10`; boss hp `≈
TTK·at-level DPS`; mechanic burst 35–45% (elite) / 42–46% (capstone) of at-level
maxHp; XP = levelCost × {3% trash / 15% endgame-zone & dungeon trash / 40%
elite / 60% capstone}; `xpForLevel(L)=Math.round(100+0.5·L^2.2)`.

| enemy/boss | zone | lvl | hp | dmgMin–Max | sustain dps | XP | gold | role / derivation |
| --- | --- | --- | ---: | --- | ---: | ---: | --- | --- |
| Mycelial Swarmling | Hollow | 108 | 5,100 | 360–460 | ~228 (passive) | 1,700 | 120–240 | soft trash, aggro 0; hp ≈ 6s×847; ~15% endgame band |
| Sporecaller (NEW rig) | Hollow | 106 | 9,150 | bolt 481–599 | ~245 | 1,880 | 200–360 | ranged kiter; hp ≈ 11s×831.6; all dmg on bolt |
| Hollowstalker | Hollow | 110 | 6,900 | 317–387 | ~320 (pack) | 2,090 | 160–300 | fast 3-pack; hit 0.69× pack-disc; hp ≈ 8s×862.4 |
| Bloomwarden | Hollow | 113 | 15,000 | 485–595 | ~245 | 2,320 | 460–780 | slow armored sentry (armor 78≈19%); hp ≈ 17s×885.5 |
| Spireshade, Mother-Bloom | Hollow elite | 116 | 47,200 | 595–725 | 378 | 5,200 | 9k–13k | elite; TTK ~52s×908.6; zone burst 1,840 (39%); armor 74; summons stalkers |
| Vorthal, the First Root | Hollow boss | 118 | 184,800 | 760–930 | 384 | 9,400 | 30k–44k | world boss; TTK ~200s×924; slam 2,016 / zone 2,112 / rot 1,000+430·20s; armor 80 |
| Cogwraith | Horologium | 116 | 11,800 | 374–467 | 378 (pack-disc) | 2,625 | 220–400 | dungeon trash; hp ≈ 13s×908.6; 15% band |
| Sandflayer | Horologium | 117 | 7,300 | 426–521 | 381 (pack-disc) | 2,670 | 180–320 | fast 2-pack; hp ≈ 8s×916.3 |
| Quaranth, the Unwound | Horologium elite | 116 | 45,000 | 749–915 | 378 | 7,000 | 9k–13k | mini-boss 1; TTK ~50s×908.6; beam 1,888 / zone 1,841; armor 78; summons cogwraith |
| Echo of the First Minute | Horologium elite | 118 | 50,800 | 760–930 | 384 | 7,120 | 11k–16k | mini-boss 2; TTK ~55s×924; tether 1,920 / soak 1,824 (unsoaked 4,378) / slam 1,968; armor 80 |
| Khronaxis, the Hour That Was Kept | Horologium capstone | 120 | 188,000 | 773–945 | 390.4 | 11,460 | 30k–45k | CAP-RAISE; TTK ~200s×939.4; 5 mechs 2,050–2,196 (soak unsoaked 5,035); ENRAGE@200s ×1.6; armor 82 |
| Mimic (secret, NEW rig) | crypt/sanctum | 60 | 3,700 | 95–130 | ~62 | 0 | 400–900 | ambush elite; TTK ~7.9s×470.8; rooted (speed 0); armor 18; respawn-suppressed after first kill |
| Grim, the Tax Collector | secret (Sanctum ritual) | 119 | 140,000 | 360–460 | ~359 eff. | 0 | 40k–60k | ritual boss; TTK ~150s×931.7; slam 1,950 / zone 1,840 / interest 1,450+290·18s; summons 2 mimics @50% |

XP note: trash 1,700–2,670 sits on the existing endgame-trash curve (frostveil
1,232→1,473, sanctum 1,737 → Hollow/dungeon 106+); elites 5,200/7,000/7,120 above
seraphel (5,064); capstone 11,460 above noctyra (8,450). Secret bosses
(mimic/grim) pay 0 XP by design — loot + title, not a farm.

Bounties (both new chains): `max(11000, level×100)` XP & gold, above sanctum's
`max(7000, level×80)`; runes via the existing 50% coin-flip on collect. Quest
runes: Greta 14 (spireshade) / 30 (vorthal); Tamsin 3 / 4 / 8.

---

# Build order & cross-iteration dependencies

1. **A — Zone** (Verdant Hollow). Self-contained; needs the v5 bump only for
   `hollowQuests`. Ship with the level-curve seating 106–118.
2. **B — Dungeon + 4 mechanics** (The Last Hour). Depends on A (entered from the
   Hollow; Tamsin stands at the spiral center). Raises the cap to 120.
3. **C — Crafting + Sets + Class skills**. Independent of A/B except the Hollow-
   tier material/node/set/elixir extensions (sporesilk/verdant) reference A's
   `'hollow'` zone. The `nodesDepleted` field is the only new persisted field
   from C and lands in the same v5 bump.
4. **D — Achievements / Bestiary + Titles**. Depends on the counter plumbing in
   `onKill`; references A/B boss kinds (vorthal/khronaxis) and E's secrets/title
   fields — but the panel renders cleanly with default-filled empties, so it can
   ship before E.
5. **E — Hidden layer**. Build last: depends on D's title/counter plumbing, A/B's
   zones (mimics in crypt/sanctum, Grim's Sanctum ritual), and the relocated
   Larder pocket. All its persisted state lives in the extended `secrets` object.

Single file modification rule honored: this spec is the only file written. All
other files are TO BE EDITED per the per-iteration touch-point lists.
