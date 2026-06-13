# Runes of Taborea — roadmap

Current state: chapter 1 (boars→Rurik, ~lv 12), Trials (25/30/37), the Sunken
Crypt (41–55), dual-classing, shop, bounty, jumping, save/continue, the level
rebalance, gear & inventory, talents, the Ashen Highlands (55–75), the
**Frostveil & Starfall Sanctum expansion** (82–105, talents v2 "Deep Paths",
relic slot, mount, secrets), and **The Hollow Hour** (106–120, cap = Khronaxis
120: the Verdant Hollow, The Last Hour dungeon + four new mechanic verbs,
crafting/gathering + sets, level-55 control skills, the Konown panel, the hidden
layer) — all shipped. Sections 1–3, 5, and 6 below are done; the remaining
backlog (section 4, minus the items this expansion ticked off) is what's left.

Balance rule for everything below (see CLAUDE.md "sustain-math lesson"):
**boss sustained dps sets the real level floor: `required maxHp ≈ dps / 0.10`.**
Label or tune from that. Mechanic bursts stay near-lethal at level; "don't
make it easier" is standing policy — difficulty by skill checks, not stat walls
that lie about their level.

---

## 1. Inventory & Gear  ✅ SHIPPED

The missing MMO pillar: makes every kill and re-kill meaningful, gives bosses
identity, competes with the shop for gold.

- [x] **Item model**: `{ id, name, slot, rarity, stats {dmg, hp, crit, speed,
      healPower}, value, unique? }`. Rarities: common/uncommon/rare/epic/
      legendary with classic colors (gray→green→blue→purple→orange).
- [x] **Slots (3 to start)**: weapon, armor, trinket. Equipped stats feed
      `baseDamage()` / `recalcStats()` / `critChance()` alongside training.
- [x] **Drop tables**: per enemy tier (trash → uncommon/rare; elites → rare+;
      trial bosses & crypt bosses → epic + a guaranteed-roll unique table).
- [x] **Named uniques** (the reason to re-farm): Bodo's Tusk, Rurik's Red
      Cloak, Korgrim's Knucklebone, Vexnar's Scale Cloak, Morgrath's Pale
      Crown, Ossus' Femur Staff, **Crown of the Undying** (Vargoth).
- [x] **Inventory UI**: `I` toggles a bag panel (grid, ~24 slots); click to
      equip/swap; hover tooltips with stat compare vs equipped; sell-to-
      Barnaby tab (gold loop for trash drops).
- [x] **Persistence**: save schema → v3 (`inventory[]`, `equipped{}`);
      default-fill on v2 load.
- [x] **HUD**: equipped-gear summary on the character frame tooltip; loot
      drops get rarity-colored combat-log lines + floating text.

## 2. Talents & Skill Points (+ new actives)  ✅ SHIPPED

Requested addition: per-level choices that make two same-class heroes differ.

- [x] **Points**: 1 talent point per level from level 10 (cap-level heroes hold ~45) (retroactive on
      load: `points = level − 9 − spent`). Shown as a badge on a new `T`
      panel button + unspent-points nudge on level-up.
- [x] **Three branches** (shared shape, class-flavored numbers):
      - **Onslaught** (offense): +1% damage/rank ×10, +1% crit/rank ×5,
        −0.5% GCD... capstone at 15 spent: **Execute** active (big hit below
        30% target hp, 20s cd).
      - **Bulwark** (defense): +2% maxHp/rank ×10, +1% heal-received/rank ×5,
        capstone: **Stoneform** active (50% damage reduction 6s, 45s cd).
      - **Pathfinder** (utility): +1% move speed/rank ×5, +5% potion
        effect/rank ×5, −1s potion cd ×3, capstone: **Dash** active (blink
        8u in facing direction, 12s cd — the mechanics-dodge skill).
- [x] **Capstone actives** join the action bar (keys 9/0/-, or replace via
      a small "active slots" row); they are class-agnostic but tinted by
      primary class color.
- [x] **Respec**: Barnaby sells "Tome of Unlearning" — cost `100g × points
      spent` (gold sink that scales).
- [x] **Persistence**: v3 save (`talents {branch: ranks}`, `spent`).
- [x] **Balance note**: talent payoff target ≈ +25–35% total power at 30
      points so old content doesn't trivialize harder than levels already do.

## 3. New zone: the Ashen Highlands (level 55–75)  ✅ SHIPPED

Built **after** gear so its loot table is the draw, not just XP.

- [x] ~~New pocket region with a portal~~ → shipped as an **adjacent walk-in
      region** east of Vexnar's arena: a `heightAt` shelf blended seamlessly
      at the border, landmark gate + level-warning sign, zone flips by player
      position (x≈158 in / 152 out) — fire/ash palette, ember particles,
      charred instanced trees, lava-glow shader accents.
- [x] Enemy families: Cinder Wraiths (ranged casters — NEW: enemy
      projectiles), Ash Hounds (fast pack hunters), Obsidian Golems (slow,
      armored = flat damage reduction, NEW mechanic knob).
- [x] Elite sub-area + world boss **Pyraxis, the Cinder Wyrm** (dragon rig,
      reskinned): all three mechanic types + a NEW one — *stack zones that
      persist* (fire patches that stay for 20s, shrinking the arena).
- [x] Quest chain from a new NPC at the highland gate (keeps Barnaby's chain
      finished); repeatable highland bounty.
- [x] Drops: the level-55+ gear tier + legendaries.

## 4. Backlog (unordered, grab-bag)

- Dungeon minimap: draw the crypt/sanctum wall layouts instead of darkness.
- Settings panel: volume slider, camera sensitivity, FCT density.
- ~~More skills per class at 25/40/55~~ ✅ shipped (one level-55 control skill
  per class — interrupt + stun/root/snare/silence; §6 iteration C).
- ~~Mounts~~ ✅ shipped (Saddle of the Howling Plains, §5).
- A proper character sheet (C key): all stats, gear, talents in one place.
- ~~Boss enrage timers~~ ✅ shipped (soft enrage on Khronaxis: ×1.6 after 200s,
  red telegraphs; §6 iteration B).
- Gamepad support; key rebinding.
- A fourth talent branch / paragon layer for the points banked past 90
  (levels 100+ hold surplus by design — reserved headroom).

## 5. The Frostveil & the Starfall Sanctum (82–105)  ✅ SHIPPED

The post-Pyraxis arc, built for a level-96 hero with nothing left to fight.

- [x] **Talents v2 — "The Deep Paths"**: 30-rank branches (90 total vs 87
      points at 96 — near-max, never max), binary choice nodes at ranks 11/21
      (six permanent forks), the **Mastery Oath** at 25+ ranks (Reaver /
      Mountain / Horizon — ONE, ever; upgrades the branch capstone in place).
      Save v4 with a one-time full refund of old talents.
- [x] **The Frostveil** (82–92): western pocket (x −360..−250), polar-night
      aurora biome, new serpent rig, 3 mob families + Hrimnir (92). Gated:
      Pyraxis dead OR level 78. Surveyor Odda's chain + bounty.
- [x] **The Starfall Sanctum** (96–105): northern pocket (z 250..360, floor
      y 40), crypt-style walls, Astral Custodians, Seraphel (100), and
      **Noctyra, the Hollow Star (105)** with the NEW `sanctuary` mechanic
      (avoid `'in'` — the telegraph circle is the only safe ground, GET IN!).
      Gated: Hrimnir dead OR level 92. Archivist Fenwick's chain + bounty.
- [x] **Relic slot** (4th gear slot, expansion-only drops; The Last Seal BiS),
      7 new uniques, expansion drop tables.
- [x] **Gold sinks**: golden boar mount (150k, +60% ooc speed), Phial of
      Starlight (40k, cosmetic), the Oathbreaker's Toll on respec.
- [x] **Secrets**: Thunderbristle (L97 rare-spawn in the starter meadow,
      900s), the Hollow Wall vault behind Vargoth's throne, Hermit Madge's
      riddles, the Stillest Pond (fishing; 0.5% Carp of a Thousand Regrets),
      the Festival of the Boar (Konami code), Bodo's cairn.
- [x] **Console helpers**: `__veteran2('<class>')` (level-90 post-Pyraxis v4
      seed), `__give(slot, rarity, ilvl?)`.

## 6. The Hollow Hour (106–120)  ✅ SHIPPED

The post-Noctyra major expansion — the world growing back, and the clockwork
tomb buried to stop it from ending. Five iterations (A–E), one save bump to v5,
spec in EXPANSION.md, build log in PROGRESS.md.

- [x] **A — The Verdant Hollow** (106–118): south pocket (x −60..60,
      z −360..−250, own height-mesh grotto-vale, `hollow.js`), bioluminescent
      glowcap/bracket-fungus biome with rising spores. 6 mob families incl. a
      new sporeling rig + 'verdant' wolf/boar palettes, elite **Spireshade, the
      Mother-Bloom** (L116), world boss **Vorthal, the First Root** (L118).
      Gated: Noctyra dead OR level 102. Greta Thornby's 8-step chain + bounty;
      ilvl 106–120 gear tier + 4 uniques (Vorthal's relic is zone BiS).
- [x] **B — The Last Hour** (116–120): the Horologium dungeon (x 250..360,
      z 200..320, floor y 60, `horologium.js`, sanctum-clone walls). **Four
      brand-new mechanic kinds** — `beam` (DODGE the arc), `soak` (GET IN, the
      absent pay 2.4×), `tether` (RUN to snap it at 10u; Dash's 8u alone can't
      trivialize it), `shatterfloor` (JUMP or find footing) — each with the full
      ring/disc/banner/sfx UX. Bosses Quaranth (L116), Echo of the First Minute
      (L118), and **Khronaxis, the Hour That Was Kept** (L120) — the game's
      first **enrage timer** (×1.6 after 200s, red telegraphs) — whose death
      raises `LEVEL_CAP` to 120. Tamsin Verge's descent chain + bounty; relic
      BiS; `__veteran3('<class>')` seed.
- [x] **C — Crafting / gathering / sets / class skills**: procedural resource
      nodes across zones (`gathering.js`) → Smith Halla's bench on `B`
      (elixirs, Hollowforge Kit, the 25k-gold Reseal-a-Relic reforge). 4 item
      sets (2pc/4pc) folded into `totalEquippedStats`. One **level-55 control
      skill per class** (bar idx 4 / key `5`; dual-class second at idx 11 / `=`)
      — real stun/root on trash, a 0.5s stagger on `ccImmune` elites, interrupt
      always lands. **No-DR audit held**: every new stat/buff is
      throughput/sustain only.
- [x] **D — The Konown** (`achievements.js`, panel on `K`): 18 achievements
      (17 reward + completionist), a 37-entry bestiary keyed off per-kind kill
      `counters` ('???'-masked until first kill), cosmetic titles worn on the
      character sheet, unlock toast + badge nudge.
- [x] **E — The hidden layer**: the **Larder** secret pocket (`larder.js`,
      x 150..170, z −360..−340 — knock F×3 on a frostveil mound; off all maps
      until found), 5 **treasure maps** with prose clues + a dig cast, **mimics**
      (disguised-chest ambush elites, persisted-cleared by `mimicId`),
      **Grim, the Tax Collector** (L119, Sanctum ritual summon — pays loot/title
      not XP), and Madge riddles 4–6.
- [x] **Save → v5**: one bump collecting `hollowQuests`/`horologiumQuests`,
      `nodesDepleted`, `counters`/`achievements`/`title`/`titles`, and the
      extended `secrets{maps, pocket, ritual, mimics}`; `loadSave` accepts
      `[1..5]`, all prior versions default-fill and stay loadable.

---

### Sequencing rationale

Gear first because it retro-feeds every existing system (bosses become
farmable, shop competes with drops, crypt respawn timer matters). Talents
second because they ride on the same save bump and panel patterns, and the
Dash capstone improves boss fights immediately. The zone goes last so it
launches with reasons to stay (loot + world boss), not just terrain.
