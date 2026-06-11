import * as THREE from 'three';
import { heightAt, HIGHLANDS } from './noise.js';
import { buildHumanoid, animateHumanoid } from './characters.js';
import { totalEquippedStats } from './items.js';
import { spentTotal, dmgMult, critAdd, hpMult, healRecvMult,
         speedMult, potionMult, potionCdReduction, activeCapstones,
         TALENT_UNLOCK_LEVEL } from './talents.js';

export const CLASSES = {
  warrior: {
    name: 'Warrior', icon: '⚔', ranged: false, autoRange: 2.6,
    hpMod: 1.25, mpMod: 0.8, dmgMod: 1.1,
    skills: [
      { id: 'slash', name: 'Slash', icon: '⚔', color: '#ff8d6b', kind: 'damage', mult: 1.25, range: 3.2, mana: 0, cd: 0, cast: 0, desc: 'A swift strike with your blade.' },
      { id: 'enraged', name: 'Enraged Blow', icon: '✸', color: '#ffb05a', kind: 'damage', mult: 2.3, range: 3.2, mana: 12, cd: 6, cast: 0, desc: 'Channel your fury into a devastating blow.' },
      { id: 'whirl', name: 'Whirlwind', icon: '❂', color: '#ffd76e', kind: 'aoe', aoeCenter: 'self', aoeRadius: 6, mult: 1.5, range: 6, mana: 20, cd: 10, cast: 0, desc: 'Spin with blades out, striking all nearby foes.' },
      { id: 'secondwind', name: 'Second Wind', icon: '⛨', color: '#9dff8a', kind: 'heal', healPct: 0.32, mana: 15, cd: 15, cast: 0, desc: 'Grit your teeth and recover 32% of your health.' },
    ],
  },
  scout: {
    name: 'Scout', icon: '➶', ranged: true, autoRange: 23,
    hpMod: 1.0, mpMod: 1.0, dmgMod: 1.0,
    skills: [
      { id: 'qshot', name: 'Quick Shot', icon: '➶', color: '#8aff9d', kind: 'damage', mult: 1.25, range: 24, mana: 0, cd: 0, cast: 0, desc: 'A fast arrow loosed without aim — mostly.' },
      { id: 'vamp', name: 'Vampire Arrow', icon: '❥', color: '#ff6b8a', kind: 'damage', mult: 2.0, selfHealPct: 0.5, range: 24, mana: 14, cd: 6, cast: 0, desc: 'A cursed arrow that returns half its damage as life.' },
      { id: 'rain', name: 'Arrow Rain', icon: '⁂', color: '#bfff8a', kind: 'aoe', aoeCenter: 'target', aoeRadius: 5, mult: 1.45, range: 24, mana: 22, cd: 10, cast: 0, desc: 'Darken the sky over your target.' },
      { id: 'instinct', name: 'Survival Instinct', icon: '✚', color: '#9dff8a', kind: 'heal', healPct: 0.3, mana: 15, cd: 15, cast: 0, desc: 'Field-dress your wounds, restoring 30% health.' },
    ],
  },
  mage: {
    name: 'Mage', icon: '✦', ranged: true, autoRange: 17,
    hpMod: 0.85, mpMod: 1.4, dmgMod: 1.15,
    skills: [
      { id: 'flame', name: 'Flame', icon: '✦', color: '#8ad9ff', kind: 'damage', mult: 1.35, range: 18, mana: 6, cd: 0, cast: 0, desc: 'A dart of elemental fire.' },
      { id: 'fireball', name: 'Fireball', icon: '☀', color: '#ff9a30', kind: 'damage', mult: 2.8, range: 18, mana: 18, cd: 5, cast: 1.4, desc: 'Slow to conjure. Unforgettable on arrival.' },
      { id: 'storm', name: 'Thunderstorm', icon: 'ϟ', color: '#ffe96e', kind: 'aoe', aoeCenter: 'target', aoeRadius: 5.5, mult: 1.55, range: 18, mana: 26, cd: 10, cast: 0, desc: 'Call lightning down around your target.' },
      { id: 'tap', name: 'Essence Tap', icon: '◈', color: '#b08aff', kind: 'mana', manaPct: 0.45, mana: 0, cd: 12, cast: 0, desc: 'Draw 45% of your mana back from the weave.' },
    ],
  },
  priest: {
    name: 'Priest', icon: '✚', ranged: true, autoRange: 15,
    hpMod: 1.0, mpMod: 1.3, dmgMod: 0.9,
    skills: [
      { id: 'tide', name: 'Rising Tide', icon: '≈', color: '#8ad9ff', kind: 'damage', mult: 1.2, range: 15, mana: 5, cd: 0, cast: 0, desc: 'The tide rises where you point.' },
      { id: 'brand', name: 'Soul Brand', icon: '✴', color: '#ffe08a', kind: 'damage', mult: 1.9, range: 15, mana: 14, cd: 6, cast: 0, desc: 'Sear the spirit within.' },
      { id: 'burst', name: 'Tidal Burst', icon: '❉', color: '#6fb6ff', kind: 'aoe', aoeCenter: 'target', aoeRadius: 5, mult: 1.35, range: 15, mana: 24, cd: 10, cast: 0, desc: 'The sea answers in anger.' },
      { id: 'regen', name: 'Regenerate', icon: '✚', color: '#9dff8a', kind: 'heal', healPct: 0.45, mana: 20, cd: 10, cast: 0, desc: 'Holy waters mend 45% of your health.' },
    ],
  },
};

// Steep curve (the "level squish"): chapter 1 paces like before, but the top
// compresses — a full first clear lands in the mid-60s instead of 118.
export function xpForLevel(level) { return Math.round(100 + 0.5 * Math.pow(level, 2.2)); }

// Barnaby's wares — the gold sink. Training prices escalate forever.
export const SHOP = [
  {
    id: 'potion', name: "Pioneer's Draught", icon: '⚗',
    desc: 'Restores 35% health and 25% mana. Drink with Q (12s cooldown).',
    price: () => 200,
    owned: (p) => `${p.potions} carried`,
    buy: (p) => { p.potions++; },
  },
  {
    id: 'whet', name: 'Whetstone Training', icon: '⚒',
    desc: '+5 weapon damage, permanently.',
    price: (p) => Math.round(500 * Math.pow(1.5, p.trainDmg)),
    owned: (p) => `+${p.trainDmg * 5} damage so far`,
    buy: (p) => { p.trainDmg++; },
  },
  {
    id: 'vit', name: 'Vitality Training', icon: '♥',
    desc: '+80 maximum health, permanently.',
    price: (p) => Math.round(500 * Math.pow(1.5, p.trainHp)),
    owned: (p) => `+${p.trainHp * 80} health so far`,
    buy: (p) => { p.trainHp++; p.recalcStats(); },
  },
  {
    id: 'crit', name: 'Lucky Talisman', icon: '✧',
    desc: '+3% critical strike chance, permanently.',
    price: (p) => Math.round(800 * Math.pow(1.5, p.trainCrit)),
    owned: (p) => `${Math.round((0.12 + p.trainCrit * 0.03) * 100)}% crit now`,
    buy: (p) => { p.trainCrit++; },
  },
  {
    id: 'boots', name: 'Swift Boots', icon: '♞',
    desc: '+20% movement speed. One pair is all you need.',
    price: () => 3000,
    soldOut: (p) => p.boots,
    owned: (p) => (p.boots ? 'worn' : ''),
    buy: (p) => { p.boots = true; p.recalcStats(); },
  },
  {
    id: 'respec', name: 'Tome of Unlearning', icon: '📖',
    desc: 'Forget all talents and reclaim every point. Price scales with what you have spent.',
    price: (p) => Math.max(0, p.talentSpent()) * 100,
    owned: (p) => (p.talentSpent() ? `${p.talentSpent()} points spent` : 'nothing to unlearn'),
    soldOut: (p) => p.talentSpent() === 0,          // disables the buy button at 0 spent
    buy: (p) => { /* handled specially in ui.showShop — see §5e */ },
  },
];

export function createPlayer(classId, scene) {
  const cls = CLASSES[classId];
  const group = buildHumanoid(classId);
  group.position.set(5, heightAt(5, 10), 10);
  group.rotation.y = Math.PI; // face the camp
  scene.add(group);

  // target selection ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.1, 32),
    new THREE.MeshBasicMaterial({ color: 0xff4422, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  const player = {
    classId, cls, group, ring,
    secondaryId: null, secondary: null,
    name: cls.name,
    level: 1, xp: 0,
    maxHp: 0, hp: 0, maxMp: 0, mp: 0,
    gold: 0, runes: 0, runeBonus: 0,
    potions: 0, potionCd: 0, trainDmg: 0, trainHp: 0, trainCrit: 0, boots: false,
    inventory: [],            // Item[]
    equipped: { weapon: null, armor: null, trinket: null },
    talents: { onslaught: 0, bulwark: 0, pathfinder: 0 },   // points spent per branch
    alive: true,
    speed: 6.5,
    vy: 0, onGround: true,
    anim: { moving: false, speed: 1, attackT: -1, dead: false },
    target: null,
    attackCd: 0, gcd: 0,
    cooldowns: {},
    casting: null,
    stoneformT: 0,   // >0 = Stoneform active (damage reduction window)
    combatTimer: 0, // >0 means "in combat"
    cam: { yaw: 0, pitch: 0.42, dist: 10 },

    // dual-classed heroes blend stats: full primary plus a healthy cut of the secondary
    effMod(key) {
      return this.secondary
        ? this.cls[key] * 0.8 + this.secondary[key] * 0.4
        : this.cls[key];
    },

    allSkills() {
      return this.secondary ? [...this.cls.skills, ...this.secondary.skills] : this.cls.skills;
    },

    // equipped-gear contribution for one axis (dmg/hp/crit/speed/healPower)
    gearStat(axis) {
      return totalEquippedStats(this.equipped)[axis] || 0;
    },

    // ---------- talents (derived, never stored as `spent`) ----------
    // total points spent across branches
    talentSpent() { return spentTotal(this.talents); },
    // points available to spend right now (retroactive, derived)
    talentPoints() { return Math.max(0, this.level - (TALENT_UNLOCK_LEVEL - 1) - this.talentSpent()); },
    // capstone actives currently unlocked (for the action bar)
    capstones() { return activeCapstones(this.talents); },
    // the full action-bar list: class skills (+secondary) then unlocked capstones
    barSkills() { return [...this.allSkills(), ...this.capstones()]; },

    baseDamage() {
      return Math.round((7 + this.level * 3.5) * this.effMod('dmgMod') * dmgMult(this.talents))
        + this.runeBonus + this.trainDmg * 5 + Math.round(this.gearStat('dmg'));
    },

    critChance() {
      return 0.12 + this.trainCrit * 0.03 + this.gearStat('crit') + critAdd(this.talents);
    },

    recalcStats() {
      this.maxHp = Math.round(
        ((80 + this.level * 40) * this.effMod('hpMod') + this.trainHp * 80 + Math.round(this.gearStat('hp')))
        * hpMult(this.talents)
      );
      this.maxMp = Math.round((50 + this.level * 16) * this.effMod('mpMod'));
      this.speed = 6.5 * (this.boots ? 1.2 : 1) * (1 + this.gearStat('speed')) * speedMult(this.talents);
    },

    tryJump() {
      if (this.alive && this.onGround) {
        this.vy = 8.4;
        this.onGround = false;
      }
    },

    usePotion(game) {
      if (!this.alive) return;
      if (this.potions <= 0) { game.ui.log('You have no draughts left — Barnaby sells them.', 'log-sys'); return; }
      if (this.potionCd > 0) return;
      this.potions--;
      this.potionCd = Math.max(2, 12 - potionCdReduction(this.talents));
      const potMul = potionMult(this.talents);            // Pathfinder Alchemy
      const healRecv = healRecvMult(this.talents);        // Bulwark Mending
      const hpw = 1 + this.gearStat('healPower');
      const hp = Math.round(this.maxHp * 0.35 * hpw * potMul * healRecv);
      const mp = Math.round(this.maxMp * 0.25 * potMul);  // mana gets Alchemy, not heal-received
      this.hp = Math.min(this.maxHp, this.hp + hp);
      this.mp = Math.min(this.maxMp, this.mp + mp);
      game.ui.floatText(this.group.position, `+${hp}`, 'heal');
      game.ui.log(`The draught restores ${hp} health and ${mp} mana.`, 'log-heal');
      game.audio.heal();
      game.fx.burst(this.group.position, 0xff8ab0, 14);
      game.save?.();
    },

    // ---------- inventory & gear ----------
    equip(game, item) {
      // move item from bag into its slot; old equipped item returns to bag
      const slot = item.slot;
      const idx = this.inventory.indexOf(item);
      if (idx < 0) return;
      this.inventory.splice(idx, 1);
      const prev = this.equipped[slot];
      this.equipped[slot] = item;
      if (prev) this.inventory.push(prev);
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);   // clamp; do NOT refill (no free heal on swap)
      game.audio.loot();
      game.ui.log(`Equipped ${item.name}.`, rarityLogClass(item.rarity));
      game.ui.refreshIdentity(game);             // updates char-frame tooltip summary
      game.save?.();
    },
    unequip(game, slot) {
      const item = this.equipped[slot];
      if (!item) return;
      this.equipped[slot] = null;
      this.inventory.push(item);
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);
      game.ui.refreshIdentity(game);
      game.save?.();
    },
    sellItem(game, item) {
      const idx = this.inventory.indexOf(item);
      if (idx < 0) return;
      this.inventory.splice(idx, 1);
      this.gold += item.value;
      game.audio.loot();
      game.ui.log(`Sold ${item.name} for ${item.value} gold.`, 'log-loot');
      game.save?.();
    },
    addItem(game, item) {                        // called by combat on drop
      if (this.inventory.length >= 24) {
        // bag full — auto-sell so drops are never silently lost
        this.gold += item.value;
        game.ui.log(`Bag full — auto-sold ${item.name} for ${item.value}g.`, 'log-loot');
        return;
      }
      this.inventory.push(item);
    },

    chooseSecondary(game, secondaryId, quiet = false) {
      this.secondaryId = secondaryId;
      this.secondary = CLASSES[secondaryId];
      this.name = `${this.cls.name} / ${this.secondary.name}`;
      this.recalcStats();
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      game.ui.buildActionBar(game, game.onCast);
      game.ui.refreshIdentity(game);
      if (!quiet) {
        game.audio.levelup();
        game.fx.burst(this.group.position, 0x8ad9ff, 30);
        game.ui.log(`The old custom is honored: you are now a ${this.name}!`, 'log-quest');
        game.ui.log(`Four new skills join your bar (keys 5–8).`, 'log-sys');
      }
      game.save?.();
    },

    // pour one point into a branch (fill order lives in talents.js math)
    spendTalent(game, branch) {
      if (this.talentPoints() <= 0) return false;
      if (!(branch in this.talents)) return false;
      if (this.talents[branch] >= 15) { game.ui.log('That path is fully walked.', 'log-sys'); return false; }
      this.talents[branch]++;
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);     // Bulwark grows the pool; do NOT free-heal the difference
      game.audio.levelup();
      game.fx.burst(this.group.position, 0xffd76e, 14);
      game.ui.buildActionBar(game, game.onCast);    // a capstone may have just unlocked
      game.ui.refreshTalentBadge(game);
      game.save?.();
      return true;
    },

    respecTalents(game) {
      this.talents = { onslaught: 0, bulwark: 0, pathfinder: 0 };
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);
      this.stoneformT = 0;
      // drop any capstone cooldowns so a respec doesn't leave ghost CDs
      for (const id of ['cap_execute', 'cap_stoneform', 'cap_dash']) delete this.cooldowns[id];
      game.ui.buildActionBar(game, game.onCast);
      game.ui.refreshTalentBadge(game);
      game.ui.log('Your talents unravel. Choose your path anew.', 'log-quest');
      game.save?.();
    },

    takeDamage(game, dmg, source) {
      if (!this.alive) return;
      if (this.stoneformT > 0) dmg = Math.max(1, Math.round(dmg * 0.5));   // Stoneform: 50% less
      this.hp -= dmg;
      this.combatTimer = 5;
      game.ui.floatText(this.group.position, `-${dmg}`, 'incoming');
      game.ui.log(`${source.name} hits you for ${dmg}.`, 'log-in');
      game.audio.hurt();
      if (this.hp <= 0) {
        this.hp = 0;
        this.die(game);
      }
    },

    die(game) {
      this.alive = false;
      this.anim.dead = true;
      this.casting = null;
      this.target = null;
      this.group.rotation.z = Math.PI / 2;
      game.audio.death();
      game.ui.log('You have been defeated…', 'log-sys');
      game.ui.showDeathScreen();
    },

    respawn(game) {
      this.alive = true;
      this.anim.dead = false;
      this.group.rotation.z = 0;
      this.group.position.set(5, heightAt(5, 10), 10);
      this.hp = this.maxHp;
      this.mp = this.maxMp;
      this.combatTimer = 0;
      game.ui.hideDeathScreen();
      game.ui.log('You awaken by the campfire.', 'log-sys');
    },

    gainXp(game, amount) {
      if (!this.alive) return;
      this.xp += amount;
      game.ui.floatText(this.group.position, `+${amount} XP`, 'xp');
      game.ui.log(`You gain ${amount} experience.`, 'log-xp');
      while (this.xp >= xpForLevel(this.level)) {
        this.xp -= xpForLevel(this.level);
        this.level++;
        this.recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        game.audio.levelup();
        game.ui.levelUpSplash(this.level);
        game.ui.log(`You have reached level ${this.level}!`, 'log-quest');
        game.fx.burst(this.group.position, 0xffd76e, 26);
        if (this.level >= 10 && !this.secondary) {
          game.ui.log('A second calling stirs within you…', 'log-quest');
          game.ui.showSecondaryChoice(game);
        }
        // talent nudge: a new point is waiting
        if (this.level >= TALENT_UNLOCK_LEVEL) {
          game.ui.log(`A talent point awaits — press T to spend it.`, 'log-quest');
          game.ui.nudgeTalentBadge();
        }
      }
      game.ui.refreshTalentBadge?.(game);
      game.save?.();
    },

    gainGold(game, amount) {
      this.gold += amount;
      game.ui.log(`You loot ${amount} gold.`, 'log-loot');
      game.save?.();
    },
  };

  player.recalcStats();
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  return player;
}

// rarity -> combat-log CSS class (styled in styles.css)
function rarityLogClass(rarity) { return 'log-loot-' + rarity; }

const moveDir = new THREE.Vector3();

export function updatePlayer(game, dt, elapsed) {
  const { player, input, camera } = game;
  const g = player.group;

  // --- regen + combat timer ---
  player.combatTimer = Math.max(0, player.combatTimer - dt);
  if (player.alive) {
    const inCombat = player.combatTimer > 0;
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * (inCombat ? 0.002 : 0.02) * dt);
    player.mp = Math.min(player.maxMp, player.mp + player.maxMp * (inCombat ? 0.015 : 0.045) * dt);
  }
  player.gcd = Math.max(0, player.gcd - dt);
  player.attackCd = Math.max(0, player.attackCd - dt);
  player.potionCd = Math.max(0, player.potionCd - dt);
  player.stoneformT = Math.max(0, player.stoneformT - dt);
  for (const k in player.cooldowns) player.cooldowns[k] = Math.max(0, player.cooldowns[k] - dt);

  // --- movement ---
  if (player.alive) {
    const yaw = player.cam.yaw;
    moveDir.set(0, 0, 0);
    if (input.keys.has('KeyW') || input.mouseForward) { moveDir.x -= Math.sin(yaw); moveDir.z -= Math.cos(yaw); }
    if (input.keys.has('KeyS')) { moveDir.x += Math.sin(yaw); moveDir.z += Math.cos(yaw); }
    if (input.keys.has('KeyA')) { moveDir.x -= Math.cos(yaw); moveDir.z += Math.sin(yaw); }
    if (input.keys.has('KeyD')) { moveDir.x += Math.cos(yaw); moveDir.z -= Math.sin(yaw); }

    const moving = moveDir.lengthSq() > 0;
    player.anim.moving = moving;
    if (moving) {
      moveDir.normalize();
      // moving interrupts casting
      if (player.casting) {
        player.casting = null;
        game.ui.hideCastBar();
        game.ui.log('Spell interrupted.', 'log-sys');
      }
      const nx = g.position.x + moveDir.x * player.speed * dt;
      const nz = g.position.z + moveDir.z * player.speed * dt;
      if (game.zone === 'crypt') {
        g.position.x = THREE.MathUtils.clamp(nx, 252, 358);
        g.position.z = THREE.MathUtils.clamp(nz, -58, 58);
      } else {
        // one continuous overworld+highlands box: west edge -150, east edge EAST_EDGE
        g.position.x = THREE.MathUtils.clamp(nx, -150, HIGHLANDS.EAST_EDGE);
        g.position.z = THREE.MathUtils.clamp(nz, -150, 150);
      }
      g.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    // --- biome zone follows the player across the pass (hysteresis avoids flicker) ---
    if (game.zone !== 'crypt') {
      if (game.zone !== 'highlands' && g.position.x > HIGHLANDS.ZONE_ENTER) {
        game.setZone('highlands');
      } else if (game.zone === 'highlands' && g.position.x < HIGHLANDS.ZONE_EXIT) {
        game.setZone('world');
      }
    }

    // crypt walls are solid (for you, at least)
    if (game.zone === 'crypt' && game.dungeon) {
      const r = 0.55;
      for (const w of game.dungeon.walls) {
        const px = g.position.x, pz = g.position.z;
        if (px > w.x1 - r && px < w.x2 + r && pz > w.z1 - r && pz < w.z2 + r) {
          const pushW = px - (w.x1 - r), pushE = (w.x2 + r) - px;
          const pushN = pz - (w.z1 - r), pushS = (w.z2 + r) - pz;
          const min = Math.min(pushW, pushE, pushN, pushS);
          if (min === pushW) g.position.x = w.x1 - r;
          else if (min === pushE) g.position.x = w.x2 + r;
          else if (min === pushN) g.position.z = w.z1 - r;
          else g.position.z = w.z2 + r;
        }
      }
    }

    // vertical physics: jumping and gravity over the terrain
    const ground = heightAt(g.position.x, g.position.z);
    if (!player.onGround || g.position.y > ground + 0.01) {
      player.vy -= 23 * dt;
      g.position.y += player.vy * dt;
      if (g.position.y <= ground) {
        g.position.y = ground;
        player.vy = 0;
        player.onGround = true;
      }
    } else {
      g.position.y = ground;
    }
  }

  animateHumanoid(g, player.anim, elapsed);

  // --- attack animation timer ---
  if (player.anim.attackT >= 0) {
    player.anim.attackT += dt / 0.45;
    if (player.anim.attackT >= 1) player.anim.attackT = -1;
  }

  // --- target ring ---
  if (player.target && player.target.alive) {
    player.ring.visible = true;
    const bodyScale = player.target.group.scale.x || 1;
    player.ring.scale.setScalar(1.1 * bodyScale + (player.target.elite ? 0.3 : 0));
    player.ring.position.copy(player.target.group.position);
    player.ring.position.y += 0.05;
    player.ring.rotation.z = elapsed * 0.8;
  } else {
    player.ring.visible = false;
    if (player.target && !player.target.alive) player.target = null;
  }

  // --- camera orbit ---
  const cam = player.cam;
  const cosP = Math.cos(cam.pitch);
  const px = g.position.x + Math.sin(cam.yaw) * cam.dist * cosP;
  const pz = g.position.z + Math.cos(cam.yaw) * cam.dist * cosP;
  let py = g.position.y + 1.4 + Math.sin(cam.pitch) * cam.dist;
  py = Math.max(py, heightAt(px, pz) + 0.6); // keep camera above the ground
  camera.position.set(px, py, pz); // rigid follow — any lerp here lags ~turnRate×τ behind while steering
  camera.lookAt(g.position.x, g.position.y + 1.5, g.position.z);
}
