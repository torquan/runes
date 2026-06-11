# Runes of Taborea — roadmap

Current state: chapter 1 (boars→Rurik, ~lv 12), Trials (25/30/37), the Sunken
Crypt (41–55), dual-classing, shop, bounty, jumping, save/continue, the level
rebalance, gear & inventory, talents, and the Ashen Highlands (55–75 post-cap
arc, cap = Pyraxis 75) — all shipped. Sections 1–3 below are done; the backlog
(section 4) is what remains.

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

- Dungeon minimap: draw the crypt wall layout instead of darkness.
- Settings panel: volume slider, camera sensitivity, FCT density.
- More skills per class at 25/40/55 (interrupt, stun, class-specific).
- Mounts (speed + flavor) as a late gold sink.
- A proper character sheet (C key): all stats, gear, talents in one place.
- Boss enrage timers (soft: +dps after N minutes) to cap fight length.
- Gamepad support; key rebinding.

---

### Sequencing rationale

Gear first because it retro-feeds every existing system (bosses become
farmable, shop competes with drops, crypt respawn timer matters). Talents
second because they ride on the same save bump and panel patterns, and the
Dash capstone improves boss fights immediately. The zone goes last so it
launches with reasons to stay (loot + world boss), not just terrain.
