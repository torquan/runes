import * as THREE from 'three';
import { heightAt, HIGHLANDS, ZONE_BOUNDS } from './noise.js';
import { buildHumanoid, animateHumanoid, buildBoar, animateBeast } from './characters.js';
import { totalEquippedStats } from './items.js';
import { spentTotal, dmgMult, critAdd, hpMult, healRecvMult,
         speedMult, potionMult, potionCdReduction, activeCapstones,
         TALENT_UNLOCK_LEVEL, BRANCH_CAP, MASTERY_THRESHOLD, MASTERIES,
         freshTalents, nextRankIsChoice, choiceNodeFor, choiceIs,
         regenBonus, manaRegenMult, stoneformReduction, masteryEligible,
         UNDYING_CD, UNDYING_FLOOR, BRAMBLE_PCT, SATCHEL_CHANCE,
         LIVING_STONE_PCT, TRAILWIND_MULT, SLIPSTREAM_MULT, SKYSTEP_MULT } from './talents.js';
import { reflectDamage } from './combat.js';

export const CLASSES = {
  warrior: {
    name: 'Warrior', icon: '⚔', ranged: false, autoRange: 2.6,
    hpMod: 1.25, mpMod: 0.8, dmgMod: 1.1,
    skills: [
      { id: 'slash', name: 'Slash', icon: '⚔', color: '#ff8d6b', kind: 'damage', mult: 1.25, range: 3.2, mana: 0, cd: 0, cast: 0, desc: 'A swift strike with your blade.' },
      { id: 'enraged', name: 'Enraged Blow', icon: '✸', color: '#ffb05a', kind: 'damage', mult: 2.3, range: 3.2, mana: 12, cd: 6, cast: 0, desc: 'Channel your fury into a devastating blow.' },
      { id: 'whirl', name: 'Whirlwind', icon: '❂', color: '#ffd76e', kind: 'aoe', aoeCenter: 'self', aoeRadius: 6, mult: 1.5, range: 6, mana: 20, cd: 10, cast: 0, desc: 'Spin with blades out, striking all nearby foes.' },
      { id: 'secondwind', name: 'Second Wind', icon: '⛨', color: '#9dff8a', kind: 'heal', healPct: 0.32, mana: 15, cd: 15, cast: 0, desc: 'Grit your teeth and recover 32% of your health.' },
      { id: 'bash', name: 'Shield Bash', icon: '🛡', color: '#ffd76e', kind: 'damage', mult: 1.6, range: 3.4, mana: 18, cd: 14, cast: 0, minLevel: 55, stun: 1.5, interrupt: true, desc: 'Slam your guard into a foe: solid damage, a 1.5s stun, and it cuts a cast short.' },
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
      { id: 'hamstring', name: 'Hamstring Shot', icon: '➴', color: '#8aff9d', kind: 'damage', mult: 1.5, range: 24, mana: 20, cd: 14, cast: 0, minLevel: 55, snare: 0.5, snareDur: 3, interrupt: true, desc: 'An arrow through the leg: damage, a 50% slow for 3s, and it spoils a spell.' },
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
      { id: 'frostnova', name: 'Frost Nova', icon: '❄', color: '#aad9ff', kind: 'aoe', aoeCenter: 'self', aoeRadius: 6, mult: 1.4, range: 6, mana: 30, cd: 16, cast: 0, minLevel: 55, root: 2, interrupt: true, desc: 'A ring of ice: damage to all nearby, roots them for 2s, and interrupts their casts.' },
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
      { id: 'stillness', name: 'Word of Stillness', icon: '✋', color: '#ffe08a', kind: 'damage', mult: 1.3, range: 15, mana: 22, cd: 18, cast: 0, minLevel: 55, silence: 2.5, interrupt: true, desc: 'Speak the old quiet: light damage, but the target cannot cast for 2.5s — and any spell breaks.' },
    ],
  },
};

// Steep curve (the "level squish"): chapter 1 paces like before, but the top
// compresses — a full first clear lands in the mid-60s instead of 118.
export function xpForLevel(level) { return Math.round(100 + 0.5 * Math.pow(level, 2.2)); }

// The Last Hour raises the ceiling from 105 to 120 (Khronaxis is the new cap).
// Talents are unaffected — the book's 90 ranks still close at level 99.
export const LEVEL_CAP = 120;

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
    id: 'mount', name: 'Saddle of the Howling Plains', icon: '♘',
    desc: 'A great golden boar — +60% speed out of combat. Bodo would have wanted this. Bodo would have wanted to BE this.',
    price: () => 150000,
    soldOut: (p) => p.mount,
    owned: (p) => (p.mount ? 'stabled at your heels' : ''),
    buy: (p) => { p.mount = true; },
  },
  {
    id: 'glow', name: 'Phial of Starlight', icon: '✨',
    desc: 'Distilled night sky. Purely decorative. Heroes deserve to glitter.',
    price: () => 40000,
    soldOut: (p) => p.glow,
    owned: (p) => (p.glow ? 'drunk; permanently sparkling' : ''),
    buy: (p) => { p.glow = true; },
  },
  {
    id: 'respec', name: 'Tome of Unlearning', icon: '📖',
    desc: 'Forget all talents and reclaim every point. Price scales with what you have spent — breaking a sworn Oath costs 5,000 extra.',
    price: (p) => Math.max(0, p.talentSpent()) * 100 + (p.talents.mastery ? 5000 : 0),
    owned: (p) => {
      if (!p.talentSpent() && !p.talents.mastery) return 'nothing to unlearn';
      const oath = p.talents.mastery ? ' · an Oath sworn' : '';
      return `${p.talentSpent()} points spent${oath}`;
    },
    soldOut: (p) => p.talentSpent() === 0 && !p.talents.mastery,
    buy: (p) => { /* handled specially in ui.showShop — see §5e */ },
  },
];

export function createPlayer(classId, scene) {
  const cls = CLASSES[classId];
  // outer group owns position/rotation/physics; the humanoid rides inside it
  // so the mount can lift the body without touching any movement math
  const body = buildHumanoid(classId);
  const group = new THREE.Group();
  group.add(body);
  group.userData = body.userData;   // rig + height pass through (animateHumanoid, plates)
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
    classId, cls, group, body, ring,
    secondaryId: null, secondary: null,
    name: cls.name,
    level: 1, xp: 0,
    maxHp: 0, hp: 0, maxMp: 0, mp: 0,
    gold: 0, runes: 0, runeBonus: 0,
    potions: 0, potionCd: 0, trainDmg: 0, trainHp: 0, trainCrit: 0, boots: false,
    mount: false, mountMesh: null,        // Saddle of the Howling Plains
    glow: false, glowOff: false, _glowT: 0, // Phial of Starlight
    secrets: { vault: false, riddles: 0 },
    inventory: [],            // Item[]
    equipped: { weapon: null, armor: null, trinket: null, relic: null },
    talents: freshTalents(),  // { onslaught, bulwark, pathfinder, choices, mastery }
    alive: true,
    speed: 6.5,
    vy: 0, onGround: true,
    anim: { moving: false, speed: 1, attackT: -1, dead: false },
    target: null,
    attackCd: 0, gcd: 0,
    cooldowns: {},
    casting: null,
    stoneformT: 0,   // >0 = Stoneform active (damage reduction window)
    // transient talent buff timers — runtime only, never saved
    spreeT: 0,       // Killing Spree damage window
    avengerT: 0,     // Avenger's Pact damage window (set by entities.js on dodge)
    slipstreamT: 0,  // post-dash speed window
    skystepT: 0,     // Skystep landing speed window
    undyingCd: 0,    // Undying Will internal cooldown
    elixirT: 0,      // crafted-elixir buff window (transient, never saved)
    elixirEffect: null, // { stat, amount } of the active elixir, or null when idle
    combatTimer: 0, // >0 means "in combat"
    cam: { yaw: 0, pitch: 0.42, dist: 10 },

    // dual-classed heroes blend stats: full primary plus a healthy cut of the secondary
    effMod(key) {
      return this.secondary
        ? this.cls[key] * 0.8 + this.secondary[key] * 0.4
        : this.cls[key];
    },

    allSkills() {
      // minLevel gates the level-55 control skills (and a dual-class's second one):
      // they appear retroactively the moment level≥55 — no learn-state to persist.
      const all = this.secondary ? [...this.cls.skills, ...this.secondary.skills] : this.cls.skills;
      return all.filter((s) => !s.minLevel || this.level >= s.minLevel);
    },

    // equipped-gear contribution for one axis (dmg/hp/crit/speed/healPower)
    gearStat(axis) {
      return totalEquippedStats(this.equipped)[axis] || 0;
    },

    // ---------- talents (derived, never stored as `spent`) ----------
    // total points spent across branches
    talentSpent() { return spentTotal(this.talents); },
    // points available to spend right now (retroactive, derived).
    // The book closes at 99 (90 ranks), so cap the level term — levels 100→120
    // grant power elsewhere but never phantom, unspendable talent points.
    talentPoints() { return Math.max(0, Math.min(this.level, 99) - (TALENT_UNLOCK_LEVEL - 1) - this.talentSpent()); },
    // capstone actives currently unlocked (for the action bar)
    capstones() { return activeCapstones(this.talents); },
    // the full action-bar list: class skills (+secondary) then unlocked capstones
    barSkills() { return [...this.allSkills(), ...this.capstones()]; },

    baseDamage() {
      return Math.round((7 + this.level * 3.5) * this.effMod('dmgMod') * dmgMult(this.talents))
        + this.runeBonus + this.trainDmg * 5 + Math.round(this.gearStat('dmg'));
    },

    critChance() {
      return 0.12 + this.trainCrit * 0.03 + this.gearStat('crit') + critAdd(this.talents)
        + ((this.elixirT > 0 && this.elixirEffect.stat === 'crit') ? this.elixirEffect.amount : 0);
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
      // Bottomless Satchel: sometimes the draught refills itself
      if (choiceIs(this.talents, 'pathfinder', 21, 'satchel') && Math.random() < SATCHEL_CHANCE) {
        game.ui.log('The empty phial refills itself. Bottomless, as advertised.', 'log-loot');
      } else {
        this.potions--;
      }
      this.potionCd = Math.max(2, 12 - potionCdReduction(this.talents));
      const potMul = potionMult(this.talents);            // Pathfinder Alchemy
      const healRecv = healRecvMult(this.talents);        // Bulwark Mending
      const elixHeal = 1 + ((this.elixirT > 0 && this.elixirEffect.stat === 'healPct') ? this.elixirEffect.amount : 0);
      const hpw = 1 + this.gearStat('healPower');
      const hp = Math.round(this.maxHp * 0.35 * hpw * potMul * healRecv * elixHeal);
      const mp = Math.round(this.maxMp * 0.25 * potMul);  // mana gets Alchemy, not heal-received
      this.hp = Math.min(this.maxHp, this.hp + hp);
      this.mp = Math.min(this.maxMp, this.mp + mp);
      game.ui.floatText(this.group.position, `+${hp}`, 'heal');
      game.ui.log(`The draught restores ${hp} health and ${mp} mana.`, 'log-heal');
      game.audio.heal();
      game.fx.burst(this.group.position, 0xff8ab0, 14);
      game.save?.();
    },

    // drink a crafted elixir: consume one, arm the transient buff window. The
    // integrator's craft-panel elixir picker calls this. Effects are throughput/
    // sustain/utility only (speed/dmgPct/crit/manaRegen/healPct) — never DR.
    drinkElixir(game, item) {
      const idx = this.inventory.indexOf(item);
      if (idx < 0) return;
      if (item.qty && item.qty > 1) item.qty -= 1;
      else this.inventory.splice(idx, 1);
      this.elixirT = item.effect.dur;
      this.elixirEffect = { stat: item.effect.stat, amount: item.effect.amount };
      game.audio.heal();
      game.ui.log(`You drink ${item.name}.`, 'log-heal');
      game.ui.floatText(this.group.position, item.name, 'heal');
      game.save?.();
    },

    // ---------- inventory & gear ----------
    equip(game, item) {
      // reject non-gear: the bag UI may call equip on any clicked cell, but
      // materials / elixirs / maps have no slot and must never be "worn"
      if (item.kind === 'material' || item.kind === 'elixir' || item.kind === 'map') return;
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
    addItem(game, item) {                        // called by combat on drop (and gather)
      // materials stack by matId: merge onto an existing stack (no new slot, no
      // bag-full auto-sell — a stack merge must never be lost to a full bag)
      if (item.kind === 'material') {
        const existing = this.inventory.find((it) => it.kind === 'material' && it.matId === item.matId);
        if (existing) { existing.qty += item.qty; return; }
      }
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

    // pour one point into a branch (fill order lives in talents.js math).
    // Returns 'choice' WITHOUT spending when the next rank is a choice node —
    // the panel then renders the picker and chooseTalent() does the real spend.
    spendTalent(game, branch) {
      if (this.talentPoints() <= 0) return false;
      if (!(branch in this.talents) || branch === 'choices' || branch === 'mastery') return false;
      if (this.talents[branch] >= BRANCH_CAP) { game.ui.log('That path is fully walked.', 'log-sys'); return false; }
      if (nextRankIsChoice(this.talents, branch)) return 'choice';
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

    // resolve a choice node: atomically spends the point AND records the pick
    chooseTalent(game, branch, optionId) {
      if (this.talentPoints() <= 0) return false;
      const rank = this.talents[branch];
      if (rank !== 10 && rank !== 20) return false;
      const node = choiceNodeFor(branch, rank + 1);
      if (!node || !node.options.some((o) => o.id === optionId)) return false;
      const picked = node.options.find((o) => o.id === optionId);
      const other = node.options.find((o) => o.id !== optionId);
      this.talents[branch]++;
      this.talents.choices[branch + (rank + 1)] = optionId;
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);
      game.audio.quest();
      game.fx.burst(this.group.position, 0xffd76e, 20);
      game.ui.log(`You choose ${picked.name}; ${other.name} is forsaken.`, 'log-quest');
      game.ui.buildActionBar(game, game.onCast);
      game.ui.refreshTalentBadge(game);
      game.save?.();
      return true;
    },

    // swear the one Mastery Oath — free, exclusive, respec-only undo
    swearMastery(game, branch) {
      if (!masteryEligible(this.talents, branch)) return false;
      this.talents.mastery = branch;
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);
      game.audio.levelup();
      game.fx.burst(this.group.position, 0xffd76e, 40);
      game.ui.log(`The oath is sworn: ${MASTERIES[branch].name}. There is no second oath.`, 'log-quest');
      game.ui.buildActionBar(game, game.onCast);    // capstone upgrades in place
      game.ui.refreshTalentBadge(game);
      game.save?.();
      return true;
    },

    respecTalents(game) {
      this.talents = freshTalents();
      this.recalcStats();
      this.hp = Math.min(this.hp, this.maxHp);
      // zero every transient talent timer so a respec leaves no ghost buffs
      this.stoneformT = 0;
      this.spreeT = 0; this.avengerT = 0;
      this.slipstreamT = 0; this.skystepT = 0; this.undyingCd = 0;
      // drop any capstone cooldowns so a respec doesn't leave ghost CDs
      for (const id of ['cap_execute', 'cap_stoneform', 'cap_dash']) delete this.cooldowns[id];
      game.ui.buildActionBar(game, game.onCast);
      game.ui.refreshTalentBadge(game);
      game.ui.log('Your talents unravel. Choose your paths anew.', 'log-quest');
      game.save?.();
    },

    takeDamage(game, dmg, source) {
      if (!this.alive) return;
      // Stoneform: the one sanctioned DR window (60% with the Mountain oath)
      if (this.stoneformT > 0) dmg = Math.max(1, Math.round(dmg * stoneformReduction(this.talents)));
      this.hp -= dmg;
      this.combatTimer = 5;
      game.ui.floatText(this.group.position, `-${dmg}`, 'incoming');
      game.ui.log(`${source.name} hits you for ${dmg}.`, 'log-in');
      game.audio.hurt();
      // thorns: Bramble Ward (passive 15%) and Worldstone Bulwark (20% in-window)
      if (source && source.alive && source.type) {
        let reflect = 0;
        if (choiceIs(this.talents, 'bulwark', 11, 'bramble')) reflect += BRAMBLE_PCT;
        if (this.stoneformT > 0 && this.talents.mastery === 'bulwark') reflect += 0.2;
        if (reflect > 0) reflectDamage(game, source, Math.max(1, Math.round(dmg * reflect)));
      }
      if (this.hp <= 0) {
        // Undying Will: one bought mistake per 3 minutes, not a mitigation stat
        if (choiceIs(this.talents, 'bulwark', 11, 'undying') && this.undyingCd <= 0) {
          this.hp = Math.max(1, Math.round(this.maxHp * UNDYING_FLOOR));
          this.undyingCd = UNDYING_CD;
          game.ui.floatText(this.group.position, 'UNDYING WILL!', 'heal');
          game.ui.log('Death reaches for you — and your will refuses. (180s)', 'log-heal');
          game.audio.rune();
          game.fx.burst(this.group.position, 0x9ad0ff, 30);
          return;
        }
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
      while (this.level < LEVEL_CAP && this.xp >= xpForLevel(this.level)) {
        this.xp -= xpForLevel(this.level);
        this.level++;
        this.recalcStats();
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        game.audio.levelup();
        game.ui.levelUpSplash(this.level);
        game.ui.log(`You have reached level ${this.level}!`, 'log-quest');
        game.fx.burst(this.group.position, 0xffd76e, 26);
        if (this.glow && !this.glowOff) game.fx.burst(this.group.position, this.cls.skills[0].color, 26);
        if (this.level >= 10 && !this.secondary) {
          game.ui.log('A second calling stirs within you…', 'log-quest');
          game.ui.showSecondaryChoice(game);
        }
        // talent nudge: only when there's a real, spendable point waiting
        // (talentPoints() caps the book at 99, so levels 100→120 stay quiet)
        if (this.level >= TALENT_UNLOCK_LEVEL && this.talentPoints() > 0) {
          game.ui.log(`A talent point awaits — press T to spend it.`, 'log-quest');
          game.ui.nudgeTalentBadge();
        }
      }
      if (this.level >= LEVEL_CAP) this.xp = 0;   // zero residual XP at the cap so the bar never overflows
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
    const hpRate = inCombat ? 0.002 + regenBonus(player.talents) : 0.02;   // Lifeblood
    let mpMul = manaRegenMult(player.talents);                             // Attunement
    if (player.elixirT > 0 && player.elixirEffect.stat === 'manaRegen') mpMul *= (1 + player.elixirEffect.amount);
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * hpRate * dt);
    player.mp = Math.min(player.maxMp, player.mp + player.maxMp * (inCombat ? 0.015 : 0.045) * mpMul * dt);
    // Living Stone: Stoneform doubles as a recovery window
    if (player.stoneformT > 0 && choiceIs(player.talents, 'bulwark', 21, 'livingstone')) {
      player.hp = Math.min(player.maxHp,
        player.hp + player.maxHp * LIVING_STONE_PCT * healRecvMult(player.talents) * dt);
    }
  }
  player.gcd = Math.max(0, player.gcd - dt);
  player.attackCd = Math.max(0, player.attackCd - dt);
  player.potionCd = Math.max(0, player.potionCd - dt);
  player.stoneformT = Math.max(0, player.stoneformT - dt);
  player.spreeT = Math.max(0, player.spreeT - dt);
  player.avengerT = Math.max(0, player.avengerT - dt);
  player.slipstreamT = Math.max(0, player.slipstreamT - dt);
  player.skystepT = Math.max(0, player.skystepT - dt);
  player.undyingCd = Math.max(0, player.undyingCd - dt);
  player.elixirT = Math.max(0, player.elixirT - dt);
  if (player.elixirT <= 0) player.elixirEffect = null;
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
      // transient speed buffs are per-frame state, not recalcStats material
      let spd = player.speed;
      if (player.combatTimer <= 0) {
        if (choiceIs(player.talents, 'pathfinder', 11, 'trailwind')) spd *= TRAILWIND_MULT;
        if (player.mount) spd *= 1.6;   // the golden boar carries you (combat dismounts)
      }
      if (player.slipstreamT > 0) spd *= SLIPSTREAM_MULT;
      if (player.skystepT > 0) spd *= SKYSTEP_MULT;
      if (player.elixirT > 0 && player.elixirEffect.stat === 'speed') spd *= (1 + player.elixirEffect.amount);
      const nx = g.position.x + moveDir.x * spd * dt;
      const nz = g.position.z + moveDir.z * spd * dt;
      const zb = ZONE_BOUNDS[game.zone] || ZONE_BOUNDS.world;
      g.position.x = THREE.MathUtils.clamp(nx, zb.x1, zb.x2);
      g.position.z = THREE.MathUtils.clamp(nz, zb.z1, zb.z2);
      g.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    // --- biome zone follows the player across the pass (hysteresis avoids flicker) ---
    if (game.zone === 'world' || game.zone === 'highlands') {
      if (game.zone !== 'highlands' && g.position.x > HIGHLANDS.ZONE_ENTER) {
        game.setZone('highlands');
      } else if (game.zone === 'highlands' && g.position.x < HIGHLANDS.ZONE_EXIT) {
        game.setZone('world');
      }
    }

    // dungeon walls are solid (for you, at least)
    const walled = game.zone === 'crypt' ? game.dungeon
      : game.zone === 'sanctum' ? game.sanctum
      : game.zone === 'horologium' ? game.horologium : null;
    if (walled) {
      const r = 0.55;
      for (const w of walled.walls) {
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

  // --- golden boar mount: carried whenever out of combat, alive, purchased ---
  // one condition drives speed, visibility, and seat height — no state machine
  const mountActive = player.mount && player.alive && player.combatTimer <= 0;
  if (mountActive && !player.mountMesh) {
    player.mountMesh = buildBoar(true, 'gold');
    player.mountMesh.scale.setScalar(1.3);
    player.mountMesh.rotation.y = -Math.PI / 2;  // beast rigs face +X; the rider faces +Z
    player.group.add(player.mountMesh);
  }
  if (player.mountMesh) {
    player.mountMesh.visible = mountActive;
    if (mountActive) animateBeast(player.mountMesh, player.anim, elapsed);
  }
  player.body.position.y = mountActive ? 0.9 : 0;

  // --- starlight trail (Phial of Starlight; cosmetic) ---
  if (player.glow && !player.glowOff && player.alive) {
    player._glowT -= dt;
    if (player.anim.moving && player._glowT <= 0) {
      player._glowT = 0.12;
      game.fx.burst(g.position, player.cls.skills[0].color, 2);
    }
  }

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
