// ===== Runes of Taborea — talents v2: "The Deep Paths" =====
// 30-rank branches, binary choice nodes at 10→11 and 20→21, and the Mastery
// Oath — one, EVER. Pure math + data. Player holds:
//   talents: { onslaught, bulwark, pathfinder,        // 0..30 ranks each
//              choices: { onslaught11: 'cleave', ... }, // picked node options
//              mastery: null | branchId }               // the sworn oath
// Effects are DERIVED from those small values — never stored — so respec is
// zeroing the shape and points stay retroactive (level − 9 − spent).
//
// BALANCE NOTE (CLAUDE.md sustain-math): talents give THROUGHPUT and SUSTAIN
// only — NO passive flat damage reduction, NO dodge chance. Stoneform stays
// the single sanctioned (short, active) DR window. Mechanic bursts stay flat
// and lethal at level. Full 90-point payoff ≈ +49% effective power, +57–58%
// sworn — inside the expansion's +45–60% target band.

export const TALENT_UNLOCK_LEVEL = 10;       // first point at L10
export const CAPSTONE_THRESHOLD = 15;        // points in a branch to unlock its capstone
export const BRANCH_CAP = 30;                // was 15 — "The Deep Paths"
export const MASTERY_THRESHOLD = 25;         // ranks needed to swear a branch's Oath
export const TOTAL_RANKS = 90;               // book closes at level 99 (99 − 9 = 90)

// ---- tuning knobs (de-tune a number, never restructure) ----
const SAVAGERY_PCT = 0.01;       // Onslaught 17–20, per rank
const APEX_PCT = 0.04;           // Onslaught 30
const DEEP_WOUNDS_PCT = 0.05;    // Onslaught 22–26, crit-damage per rank
const FRENZY_SEC = 0.07;         // Onslaught 27–29, auto interval per rank
const STALWART_PCT = 0.02;       // Bulwark 17–20, per rank
const SECOND_SKIN_PCT = 0.02;    // Bulwark 27–29, per rank
const COLOSSUS_PCT = 0.06;       // Bulwark 30
const LIFEBLOOD_PCT = 0.002;     // Bulwark 22–26, in-combat %maxHp/s regen per rank
const TRAILBLAZER_PCT = 0.01;    // Pathfinder 17–20, per rank
const WINDRIDER_PCT = 0.04;      // Pathfinder 30
const ALCHEMY2_PCT = 0.05;       // Pathfinder 22–25, per rank
const ATTUNEMENT_PCT = 0.15;     // Pathfinder 26–28, mana regen per rank
const OATH_PCT = 0.08;           // every oath's flat identity bonus
export const BLOODSCENT_MULT = 1.2;     // <35% hp targets
export const SPREE_MULT = 1.2;          // 6s after a kill
export const AVENGER_MULT = 1.15;       // 8s after a telegraph dodge
export const BRAMBLE_PCT = 0.15;        // reflect share
export const HARVEST_PCT = 0.08;        // auto-attack lifesteal
export const CLEAVE_PCT = 0.5;          // splash share
export const CLEAVE_RADIUS = 3.5;       // around the primary target
export const UNDYING_CD = 180;          // seconds
export const UNDYING_FLOOR = 0.15;      // %maxHp left standing
export const LIVING_STONE_PCT = 0.06;   // %maxHp/s during Stoneform
export const SATCHEL_CHANCE = 0.2;      // potion not consumed
export const PROSPECTOR_GOLD = 1.25;    // gold multiplier
export const PROSPECTOR_RUNE = 0.33;    // trash rune chance (base 0.22)
export const TRAILWIND_MULT = 1.25;     // out-of-combat speed
export const SLIPSTREAM_MULT = 1.3;     // 3s after any dash
export const SKYSTEP_MULT = 1.4;        // 1.5s after a Skystep landing

// clamped per-branch rank count
function ranks(talents, branch) { return Math.min(BRANCH_CAP, (talents && talents[branch]) || 0); }

export function spentTotal(talents) {
  return ranks(talents, 'onslaught') + ranks(talents, 'bulwark') + ranks(talents, 'pathfinder');
}

// ---- choice nodes (the point that takes a branch 10→11 / 20→21 is a pick) ----
export const CHOICE_RANKS = [10, 20];

export function nextRankIsChoice(talents, branch) {
  return CHOICE_RANKS.includes(ranks(talents, branch));
}
// node key, e.g. choiceOf(t, 'onslaught', 11)
export function choiceOf(talents, branch, node) {
  return (talents && talents.choices && talents.choices[branch + node]) || null;
}
export function choiceIs(talents, branch, node, id) {
  return choiceOf(talents, branch, node) === id;
}

// descriptor table for the UI + validation. atRank = the rank the pick grants.
export const CHOICE_NODES = [
  {
    branch: 'onslaught', atRank: 11, label: 'Warpath',
    options: [
      { id: 'cleave', name: 'Rending Cleave', icon: '⚔⚔', desc: 'Auto-attacks also strike up to 2 other enemies within 3.5m of your target for 50% damage.' },
      { id: 'bloodscent', name: 'Bloodscent', icon: '❣', desc: 'All your damage +20% against enemies below 35% health.' },
    ],
  },
  {
    branch: 'onslaught', atRank: 21, label: 'Bloodlust',
    options: [
      { id: 'harvest', name: 'Crimson Harvest', icon: '❥', desc: 'Auto-attacks heal you for 8% of damage dealt.' },
      { id: 'spree', name: 'Killing Spree', icon: '✸', desc: 'Kills grant +20% damage for 6 seconds.' },
    ],
  },
  {
    branch: 'bulwark', atRank: 11, label: 'Retribution',
    options: [
      { id: 'bramble', name: 'Bramble Ward', icon: '❉', desc: 'Attackers take 15% of the damage they deal to you.' },
      { id: 'undying', name: 'Undying Will', icon: '⛨', desc: 'A killing blow instead leaves you at 15% health. 180s internal cooldown.' },
    ],
  },
  {
    branch: 'bulwark', atRank: 21, label: 'Warding',
    options: [
      { id: 'livingstone', name: 'Living Stone', icon: '◙', desc: 'Stoneform also heals 6% of your max health per second while active.' },
      { id: 'avenger', name: "Avenger's Pact", icon: 'ϟ', desc: 'Dodging a telegraphed mechanic grants +15% damage for 8 seconds.' },
    ],
  },
  {
    branch: 'pathfinder', atRank: 11, label: 'Wayfarer',
    options: [
      { id: 'trailwind', name: 'Trailwind', icon: '➶', desc: '+25% movement speed while out of combat.' },
      { id: 'prospector', name: 'Prospector', icon: '◎', desc: '+25% gold from kills; runes drop more often from common foes.' },
    ],
  },
  {
    branch: 'pathfinder', atRank: 21, label: 'Opportunist',
    options: [
      { id: 'slipstream', name: 'Slipstream', icon: '➹', desc: 'Dash cooldown −3s; dashing grants +30% speed for 3 seconds.' },
      { id: 'satchel', name: 'Bottomless Satchel', icon: '⚗', desc: '20% chance a potion is not consumed.' },
    ],
  },
];

export function choiceNodeFor(branch, atRank) {
  return CHOICE_NODES.find((n) => n.branch === branch && n.atRank === atRank) || null;
}

// ---- Onslaught (offense) ----
export function dmgMult(talents) {           // multiply baseDamage by this
  const n = ranks(talents, 'onslaught');
  let m = 1
    + 0.01 * Math.min(10, n)                                   // Brutality 1–10
    + SAVAGERY_PCT * Math.max(0, Math.min(4, n - 16))          // Savagery 17–20
    + (n >= 30 ? APEX_PCT : 0);                                // Apex Predator 30
  if (talents && talents.mastery === 'onslaught') m += OATH_PCT; // Oath of the Reaver
  return m;
}
export function critAdd(talents) {           // add to critChance (fraction)
  const n = ranks(talents, 'onslaught');
  return 0.01 * Math.max(0, Math.min(5, n - 11)); // Killer Instinct 12–16
}
export function critDmgBonus(talents) {      // added to the 1.8× crit multiplier
  const n = ranks(talents, 'onslaught');
  return DEEP_WOUNDS_PCT * Math.max(0, Math.min(5, n - 21));   // Deep Wounds 22–26
}
export function autoInterval(talents) {      // player auto-attack interval (base 1.7s)
  const n = ranks(talents, 'onslaught');
  return 1.7 - FRENZY_SEC * Math.max(0, Math.min(3, n - 26));  // Frenzy 27–29
}
export function gcdValue(talents) {          // the player's GCD in seconds
  return ranks(talents, 'onslaught') >= 15 ? 0.9 : 1.0;
}

// ---- Bulwark (defense) ----
export function hpMult(talents) {            // multiply maxHp by this
  const n = ranks(talents, 'bulwark');
  let m = 1
    + 0.02 * Math.min(10, n)                                   // Toughness 1–10
    + STALWART_PCT * Math.max(0, Math.min(4, n - 16))          // Stalwart 17–20
    + SECOND_SKIN_PCT * Math.max(0, Math.min(3, n - 26))       // Second Skin 27–29
    + (n >= 30 ? COLOSSUS_PCT : 0);                            // Colossus 30
  if (talents && talents.mastery === 'bulwark') m += OATH_PCT; // Oath of the Mountain
  return m;
}
export function healRecvMult(talents) {      // multiply ALL incoming healing
  const n = ranks(talents, 'bulwark');
  let m = 1 + 0.01 * Math.max(0, Math.min(5, n - 11));         // Mending 12–16
  if (talents && talents.mastery === 'bulwark') m += OATH_PCT;
  return m;
}
export function regenBonus(talents) {        // added to the 0.002 in-combat %maxHp/s regen
  const n = ranks(talents, 'bulwark');
  return LIFEBLOOD_PCT * Math.max(0, Math.min(5, n - 21));     // Lifeblood 22–26
}
export function stoneformReduction(talents) { // damage taken multiplier during Stoneform
  return talents && talents.mastery === 'bulwark' ? 0.4 : 0.5; // Worldstone: 60% less
}

// ---- Pathfinder (utility) ----
export function speedMult(talents) {         // multiply move speed by this
  const n = ranks(talents, 'pathfinder');
  let m = 1
    + 0.01 * Math.min(5, n)                                    // Fleetfoot 1–5
    + 0.01 * Math.max(0, Math.min(2, n - 14))                  // Fleetfoot II 15–16
    + TRAILBLAZER_PCT * Math.max(0, Math.min(4, n - 16))       // Trailblazer 17–20
    + (n >= 30 ? WINDRIDER_PCT : 0);                           // Windrider 30
  if (talents && talents.mastery === 'pathfinder') m += OATH_PCT; // Oath of the Horizon
  return m;
}
export function potionMult(talents) {        // multiply potion HP/MP restore
  const n = ranks(talents, 'pathfinder');
  return 1
    + 0.05 * Math.max(0, Math.min(5, n - 5))                   // Alchemy 6–10
    + ALCHEMY2_PCT * Math.max(0, Math.min(4, n - 21));         // Alchemy II 22–25
}
export function potionCdReduction(talents) { // seconds shaved off the 12s potion cd
  const n = ranks(talents, 'pathfinder');
  let s = Math.max(0, Math.min(3, n - 11))                     // Quickdraw 12–14
    + (n >= 29 ? 1 : 0);                                       // Quickdraw II 29
  if (talents && talents.mastery === 'pathfinder') s += 2;     // Oath of the Horizon
  return s;
}
export function manaRegenMult(talents) {     // multiply both mana regen rates
  const n = ranks(talents, 'pathfinder');
  return 1 + ATTUNEMENT_PCT * Math.max(0, Math.min(3, n - 25)); // Attunement 26–28
}

// dash cooldown derives from oath + Slipstream (floor 6s)
function dashCd(talents) {
  const base = talents && talents.mastery === 'pathfinder' ? 7 : 12;
  const slip = choiceIs(talents, 'pathfinder', 21, 'slipstream') ? 3 : 0;
  return Math.max(6, base - slip);
}

// capstone active templates. id MUST be unique AND stable (keys player.cooldowns,
// survives oaths so keybinds and cooldown entries never migrate).
export const CAPSTONES = {
  onslaught: {
    id: 'cap_execute', name: 'Execute', icon: '⚔', color: '#ff5a3c',
    kind: 'execute', mult: 4.0, range: 5, mana: 20, cd: 20, cast: 0, hpThreshold: 0.30,
    desc: 'A killing blow. Massive damage to a target below 30% health.',
    branch: 'onslaught',
  },
  bulwark: {
    id: 'cap_stoneform', name: 'Stoneform', icon: '⛨', color: '#9ad0ff',
    kind: 'stoneform', mana: 0, cd: 45, cast: 0, duration: 6,
    desc: 'Become stone for 6s: take 50% less damage.',
    branch: 'bulwark',
  },
  pathfinder: {
    id: 'cap_dash', name: 'Dash', icon: '➹', color: '#8aff9d',
    kind: 'dash', mana: 0, cd: 12, cast: 0, distance: 8,
    desc: 'Blink 8 metres in the direction you face — dodge anything.',
    branch: 'pathfinder',
  },
};

// the Mastery Oaths: a big identity passive + an in-place capstone upgrade
export const MASTERIES = {
  onslaught: {
    name: 'Oath of the Reaver', icon: '🗡',
    passive: '+8% damage. Critical hits refund 0.5s from your skill cooldowns.',
    capstone: {
      name: "Reaper's Verdict", mult: 5.0, hpThreshold: 0.40,
      desc: 'A killing blow. Massive damage below 40% health — and if it kills, the cooldown resets and the mana returns.',
    },
    confirm: 'An oath, once sworn, is a wall at your back and a door closed forever. Only the Tome of Unlearning can break it — and Barnaby charges extra for oaths. Swear to the Reaver?',
  },
  bulwark: {
    name: 'Oath of the Mountain', icon: '⛰',
    passive: '+8% max health and +8% healing received.',
    capstone: {
      name: 'Worldstone Bulwark', duration: 8, cd: 40,
      desc: 'Become the worldstone for 8s: take 60% less damage, and attackers suffer a fifth of their spite returned.',
    },
    confirm: 'An oath, once sworn, is a wall at your back and a door closed forever. Only the Tome of Unlearning can break it — and Barnaby charges extra for oaths. Swear to the Mountain?',
  },
  pathfinder: {
    name: 'Oath of the Horizon', icon: '☄',
    passive: '+8% movement speed. Potion cooldown shortened by 2 more seconds.',
    capstone: {
      name: 'Skystep', distance: 12, cd: 7,
      desc: 'Blink 12 metres in the direction you face; landing grants +40% speed for 1.5s.',
    },
    confirm: 'An oath, once sworn, is a wall at your back and a door closed forever. Only the Tome of Unlearning can break it — and Barnaby charges extra for oaths. Swear to the Horizon?',
  },
};

// the live capstone template for a branch: base, oath-merged when sworn.
// Same id either way — cooldowns/keybinds/action-bar slots never migrate.
export function capstoneFor(talents, branch) {
  const base = CAPSTONES[branch];
  if (!base) return null;
  let tpl = base;
  if (talents && talents.mastery === branch) tpl = { ...base, ...MASTERIES[branch].capstone };
  if (branch === 'pathfinder') tpl = { ...tpl, cd: dashCd(talents) };
  return tpl;
}

// returns the unlocked capstone skill objects (oath-merged), in fixed branch order
export function activeCapstones(talents) {
  const out = [];
  for (const b of ['onslaught', 'bulwark', 'pathfinder']) {
    if (ranks(talents, b) >= CAPSTONE_THRESHOLD) out.push(capstoneFor(talents, b));
  }
  return out;
}

// can this branch's oath be sworn right now?
export function masteryEligible(talents, branch) {
  return !talents.mastery && ranks(talents, branch) >= MASTERY_THRESHOLD;
}

// one descriptor per branch -> stat tiers (with rank windows for the panel),
// choice nodes slot in at their atRank positions in the UI.
export const BRANCHES = [
  {
    id: 'onslaught', name: 'Onslaught', flavor: 'Offense — hit harder, crit more.',
    color: '#ff7a4d',
    tiers: [
      { label: 'Brutality', from: 1, to: 10, per: '+1% damage', value: (t) => `+${Math.min(10, ranks(t, 'onslaught'))}% damage` },
      { label: 'Killer Instinct', from: 12, to: 16, per: '+1% crit', value: (t) => `+${Math.max(0, Math.min(5, ranks(t, 'onslaught') - 11))}% crit` },
      { label: 'Savagery', from: 17, to: 20, per: '+1% damage', value: (t) => `+${Math.max(0, Math.min(4, ranks(t, 'onslaught') - 16))}% damage` },
      { label: 'Deep Wounds', from: 22, to: 26, per: '+5% crit damage', value: (t) => `crits ×${(1.8 + critDmgBonus(t)).toFixed(2)}` },
      { label: 'Frenzy', from: 27, to: 29, per: '−0.07s attack interval', value: (t) => `attack every ${autoInterval(t).toFixed(2)}s` },
      { label: 'Apex Predator', from: 30, to: 30, per: '+4% damage', value: (t) => ranks(t, 'onslaught') >= 30 ? '+4% damage' : '—' },
    ],
    gcdNote: (t) => ranks(t, 'onslaught') >= 15 ? 'Haste: global cooldown 1.0s → 0.9s' : 'Haste (at 15): global cooldown −0.1s',
  },
  {
    id: 'bulwark', name: 'Bulwark', flavor: 'Defense — outlast anything.',
    color: '#7fb4ff',
    tiers: [
      { label: 'Toughness', from: 1, to: 10, per: '+2% max health', value: (t) => `+${2 * Math.min(10, ranks(t, 'bulwark'))}% max HP` },
      { label: 'Mending', from: 12, to: 16, per: '+1% healing received', value: (t) => `+${Math.max(0, Math.min(5, ranks(t, 'bulwark') - 11))}% healing` },
      { label: 'Stalwart', from: 17, to: 20, per: '+2% max health', value: (t) => `+${2 * Math.max(0, Math.min(4, ranks(t, 'bulwark') - 16))}% max HP` },
      { label: 'Lifeblood', from: 22, to: 26, per: '+0.2%/s combat regen', value: (t) => `+${(regenBonus(t) * 100).toFixed(1)}%/s in combat` },
      { label: 'Second Skin', from: 27, to: 29, per: '+2% max health', value: (t) => `+${2 * Math.max(0, Math.min(3, ranks(t, 'bulwark') - 26))}% max HP` },
      { label: 'Colossus', from: 30, to: 30, per: '+6% max health', value: (t) => ranks(t, 'bulwark') >= 30 ? '+6% max HP' : '—' },
    ],
  },
  {
    id: 'pathfinder', name: 'Pathfinder', flavor: 'Utility — speed and survival kit.',
    color: '#7dff95',
    tiers: [
      { label: 'Fleetfoot', from: 1, to: 5, per: '+1% move speed', value: (t) => `+${Math.min(5, ranks(t, 'pathfinder'))}% speed` },
      { label: 'Alchemy', from: 6, to: 10, per: '+5% potion effect', value: (t) => `+${5 * Math.max(0, Math.min(5, ranks(t, 'pathfinder') - 5))}% potion` },
      { label: 'Quickdraw', from: 12, to: 14, per: '−1s potion cooldown', value: (t) => `−${Math.max(0, Math.min(3, ranks(t, 'pathfinder') - 11))}s potion CD` },
      { label: 'Fleetfoot II', from: 15, to: 16, per: '+1% move speed', value: (t) => `+${Math.max(0, Math.min(2, ranks(t, 'pathfinder') - 14))}% speed` },
      { label: 'Trailblazer', from: 17, to: 20, per: '+1% move speed', value: (t) => `+${Math.max(0, Math.min(4, ranks(t, 'pathfinder') - 16))}% speed` },
      { label: 'Alchemy II', from: 22, to: 25, per: '+5% potion effect', value: (t) => `+${5 * Math.max(0, Math.min(4, ranks(t, 'pathfinder') - 21))}% potion` },
      { label: 'Attunement', from: 26, to: 28, per: '+15% mana regen', value: (t) => `+${Math.round((manaRegenMult(t) - 1) * 100)}% mana regen` },
      { label: 'Quickdraw II', from: 29, to: 29, per: '−1s potion cooldown', value: (t) => ranks(t, 'pathfinder') >= 29 ? '−1s more potion CD' : '—' },
      { label: 'Windrider', from: 30, to: 30, per: '+4% move speed', value: (t) => ranks(t, 'pathfinder') >= 30 ? '+4% speed' : '—' },
    ],
  },
];

// a fresh, empty talent shape (also the respec / migration target)
export function freshTalents() {
  return { onslaught: 0, bulwark: 0, pathfinder: 0, choices: {}, mastery: null };
}

// sanitize a loaded v4 talents object (hand-edited saves, partial writes)
export function sanitizeTalents(t) {
  const out = freshTalents();
  if (!t || typeof t !== 'object') return out;
  for (const b of ['onslaught', 'bulwark', 'pathfinder']) {
    let n = Math.max(0, Math.min(BRANCH_CAP, Math.floor(t[b] || 0)));
    // a rank past a choice node requires that node's pick — else clamp down to it
    const ch = (t.choices && typeof t.choices === 'object') ? t.choices : {};
    if (n >= 21 && !ch[b + 21]) n = 20;
    if (n >= 11 && !ch[b + 11]) n = Math.min(n, 10);
    out[b] = n;
    for (const node of [11, 21]) {
      const valid = choiceNodeFor(b, node);
      const v = ch[b + node];
      if (n >= node && valid && valid.options.some((o) => o.id === v)) out.choices[b + node] = v;
    }
  }
  if (['onslaught', 'bulwark', 'pathfinder'].includes(t.mastery) && out[t.mastery] >= MASTERY_THRESHOLD) {
    out.mastery = t.mastery;
  }
  return out;
}

export { ranks }; // panel needs the clamped per-branch count
