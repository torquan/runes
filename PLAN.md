# Runes of Taborea — roadmap

Current state: chapter 1 (boars→Rurik), Trials (35/45/58), the Sunken Crypt
(65–90), dual-classing, shop, bounty, jumping, save/continue — all shipped and
deployed. The player character is level 90+, Vargoth is down. What follows is
ordered by how much each system compounds with the others.

Balance rule for everything below (see CLAUDE.md "sustain-math lesson"):
**boss sustained dps sets the real level floor: `required maxHp ≈ dps / 0.17`.**
Label or tune from that. Mechanic bursts stay near-lethal at level; "don't
make it easier" is standing policy — difficulty by skill checks, not stat walls
that lie about their level.

---

## 1. Inventory & Gear  ← NEXT UP

The missing MMO pillar: makes every kill and re-kill meaningful, gives bosses
identity, competes with the shop for gold.

- [ ] **Item model**: `{ id, name, slot, rarity, stats {dmg, hp, crit, speed,
      healPower}, value, unique? }`. Rarities: common/uncommon/rare/epic/
      legendary with classic colors (gray→green→blue→purple→orange).
- [ ] **Slots (3 to start)**: weapon, armor, trinket. Equipped stats feed
      `baseDamage()` / `recalcStats()` / `critChance()` alongside training.
- [ ] **Drop tables**: per enemy tier (trash → uncommon/rare; elites → rare+;
      trial bosses & crypt bosses → epic + a guaranteed-roll unique table).
- [ ] **Named uniques** (the reason to re-farm): Bodo's Tusk, Rurik's Red
      Cloak, Korgrim's Knucklebone, Vexnar's Scale Cloak, Morgrath's Pale
      Crown, Ossus' Femur Staff, **Crown of the Undying** (Vargoth).
- [ ] **Inventory UI**: `I` toggles a bag panel (grid, ~24 slots); click to
      equip/swap; hover tooltips with stat compare vs equipped; sell-to-
      Barnaby tab (gold loop for trash drops).
- [ ] **Persistence**: save schema → v3 (`inventory[]`, `equipped{}`);
      default-fill on v2 load.
- [ ] **HUD**: equipped-gear summary on the character frame tooltip; loot
      drops get rarity-colored combat-log lines + floating text.

## 2. Talents & Skill Points (+ new actives)

Requested addition: per-level choices that make two same-class heroes differ.

- [ ] **Points**: 1 talent point per level from level 10 (retroactive on
      load: `points = level − 9 − spent`). Shown as a badge on a new `T`
      panel button + unspent-points nudge on level-up.
- [ ] **Three branches** (shared shape, class-flavored numbers):
      - **Onslaught** (offense): +1% damage/rank ×10, +1% crit/rank ×5,
        −0.5% GCD... capstone at 15 spent: **Execute** active (big hit below
        30% target hp, 20s cd).
      - **Bulwark** (defense): +2% maxHp/rank ×10, +1% heal-received/rank ×5,
        capstone: **Stoneform** active (50% damage reduction 6s, 45s cd).
      - **Pathfinder** (utility): +1% move speed/rank ×5, +5% potion
        effect/rank ×5, −1s potion cd ×3, capstone: **Dash** active (blink
        8u in facing direction, 12s cd — the mechanics-dodge skill).
- [ ] **Capstone actives** join the action bar (keys 9/0/-, or replace via
      a small "active slots" row); they are class-agnostic but tinted by
      primary class color.
- [ ] **Respec**: Barnaby sells "Tome of Unlearning" — cost `100g × points
      spent` (gold sink that scales).
- [ ] **Persistence**: v3 save (`talents {branch: ranks}`, `spent`).
- [ ] **Balance note**: talent payoff target ≈ +25–35% total power at 30
      points so old content doesn't trivialize harder than levels already do.

## 3. New zone: the Ashen Highlands (level 70–100)

Built **after** gear so its loot table is the draw, not just XP.

- [ ] New pocket region (same trick as the crypt: `heightAt` override or a
      far world shelf), portal near Vexnar's arena — fire/ash palette,
      ember particles, charred instanced trees, lava-glow shader accents.
- [ ] Enemy families: Cinder Wraiths (ranged casters — NEW: enemy
      projectiles), Ash Hounds (fast pack hunters), Obsidian Golems (slow,
      armored = flat damage reduction, NEW mechanic knob).
- [ ] Elite sub-area + world boss **Pyraxis, the Cinder Wyrm** (dragon rig,
      reskinned): all three mechanic types + a NEW one — *stack zones that
      persist* (fire patches that stay for 20s, shrinking the arena).
- [ ] Quest chain from a new NPC at the highland gate (keeps Barnaby's chain
      finished); repeatable highland bounty.
- [ ] Drops: the level-90+ gear tier + legendaries.

## 4. Backlog (unordered, grab-bag)

- Dungeon minimap: draw the crypt wall layout instead of darkness.
- Settings panel: volume slider, camera sensitivity, FCT density.
- More skills per class at 30/50/70 (interrupt, stun, class-specific).
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
