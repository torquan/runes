// ===== Runes of Taborea — talents, skill points, capstone actives =====
// Pure math + data. Player holds talents{onslaught,bulwark,pathfinder} (points
// spent per branch). Effects are DERIVED from those integers — never stored —
// so respec is just zeroing the map and points are always retroactive.
//
// BALANCE NOTE (CLAUDE.md sustain-math): talents give THROUGHPUT and SUSTAIN
// only — NO flat damage reduction outside the Stoneform burst window, NO dodge.
// Mechanic bursts stay flat & lethal at level. Full 30-point payoff lands at
// ~+30% effective power (see spec §7), inside the PLAN's +25–35% target, so old
// content clears faster but is not "made easier".

export const TALENT_UNLOCK_LEVEL = 10;       // first point at L10
export const CAPSTONE_THRESHOLD = 15;        // points in a branch to unlock its capstone

// per-branch layout: total spendable = 15 (10+5) before capstone is reachable,
// cap each branch at 15 ranks of stat nodes (capstone is the 15th-point reward,
// not a 16th rank). Hard cap a branch at 15 so excess points go elsewhere.
export const BRANCH_CAP = 15;

// clamped per-branch rank count
function ranks(talents, branch) { return Math.min(BRANCH_CAP, (talents && talents[branch]) || 0); }

export function spentTotal(talents) {
  return ranks(talents, 'onslaught') + ranks(talents, 'bulwark') + ranks(talents, 'pathfinder');
}

// ---- Onslaught (offense) ----
export function dmgMult(talents) {           // multiply baseDamage by this
  const n = ranks(talents, 'onslaught');
  return 1 + 0.01 * Math.min(10, n);         // +1%/rank, first 10 ranks
}
export function critAdd(talents) {           // add to critChance (fraction)
  const n = ranks(talents, 'onslaught');
  return 0.01 * Math.max(0, Math.min(5, n - 10)); // +1%/rank, ranks 11–15
}
export function gcdValue(talents) {          // the player's GCD in seconds
  return ranks(talents, 'onslaught') >= 15 ? 0.9 : 1.0;
}

// ---- Bulwark (defense) ----
export function hpMult(talents) {            // multiply maxHp by this
  const n = ranks(talents, 'bulwark');
  return 1 + 0.02 * Math.min(10, n);         // +2%/rank, first 10
}
export function healRecvMult(talents) {      // multiply ALL incoming healing (skills + potion HP)
  const n = ranks(talents, 'bulwark');
  return 1 + 0.01 * Math.max(0, Math.min(5, n - 10)); // +1%/rank, ranks 11–15
}

// ---- Pathfinder (utility) ----
export function speedMult(talents) {         // multiply move speed by this
  const n = ranks(talents, 'pathfinder');
  const tier1 = 0.01 * Math.min(5, n);                 // ranks 1–5: +1%/rank
  const tier4 = 0.01 * Math.max(0, Math.min(2, n - 13)); // ranks 14–15: +1%/rank
  return 1 + tier1 + tier4;                            // up to +7%
}
export function potionMult(talents) {        // multiply potion HP/MP restore
  const n = ranks(talents, 'pathfinder');
  return 1 + 0.05 * Math.max(0, Math.min(5, n - 5));   // ranks 6–10: +5%/rank
}
export function potionCdReduction(talents) { // seconds shaved off the 12s potion cd
  const n = ranks(talents, 'pathfinder');
  return Math.max(0, Math.min(3, n - 10));            // ranks 11–13: −1s/rank
}

// capstone active templates. id MUST be unique (keys player.cooldowns).
// kind values: 'execute' | 'stoneform' | 'dash' (new branches in resolveSkill).
export const CAPSTONES = {
  onslaught: {
    id: 'cap_execute', name: 'Execute', icon: '⚔', color: '#ff5a3c',
    kind: 'execute', mult: 4.0, range: 5, mana: 20, cd: 20, cast: 0, hpThreshold: 0.30,
    desc: 'A killing blow. Massive damage to a target below 30% health.',
    branch: 'onslaught',
  },
  bulwark: {
    id: 'cap_stoneform', name: 'Stoneform', icon: '⛨', color: '#9ad0ff',
    kind: 'stoneform', mana: 0, cd: 45, cast: 0, duration: 6, reduction: 0.5,
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

// returns the unlocked capstone skill objects, in fixed branch order
export function activeCapstones(talents) {
  const out = [];
  for (const b of ['onslaught', 'bulwark', 'pathfinder']) {
    if (ranks(talents, b) >= CAPSTONE_THRESHOLD) out.push(CAPSTONES[b]);
  }
  return out;
}

// one descriptor per branch -> three stat tiers + capstone, with live value fns
export const BRANCHES = [
  {
    id: 'onslaught', name: 'Onslaught', flavor: 'Offense — hit harder, crit more.',
    color: '#ff7a4d',
    tiers: [
      { label: 'Brutality', max: 10, per: '+1% damage', value: (t) => `+${Math.min(10, ranks(t, 'onslaught'))}% damage` },
      { label: 'Killer Instinct', max: 5, per: '+1% crit', value: (t) => `+${Math.max(0, Math.min(5, ranks(t, 'onslaught') - 10))}% crit` },
    ],
    gcdNote: (t) => ranks(t, 'onslaught') >= 15 ? 'Haste: global cooldown 1.0s → 0.9s' : 'Haste (at 15): global cooldown −0.1s',
    capstone: CAPSTONES.onslaught,
  },
  {
    id: 'bulwark', name: 'Bulwark', flavor: 'Defense — outlast anything.',
    color: '#7fb4ff',
    tiers: [
      { label: 'Toughness', max: 10, per: '+2% max health', value: (t) => `+${2 * Math.min(10, ranks(t, 'bulwark'))}% max HP` },
      { label: 'Mending', max: 5, per: '+1% healing received', value: (t) => `+${Math.max(0, Math.min(5, ranks(t, 'bulwark') - 10))}% healing` },
    ],
    capstone: CAPSTONES.bulwark,
  },
  {
    id: 'pathfinder', name: 'Pathfinder', flavor: 'Utility — speed and survival kit.',
    color: '#7dff95',
    tiers: [
      { label: 'Fleetfoot', max: 5, per: '+1% move speed', value: (t) => `+${Math.min(5, ranks(t, 'pathfinder'))}% speed` },
      { label: 'Alchemy', max: 5, per: '+5% potion effect', value: (t) => `+${5 * Math.max(0, Math.min(5, ranks(t, 'pathfinder') - 5))}% potion` },
      { label: 'Quickdraw', max: 3, per: '−1s potion cooldown', value: (t) => `−${Math.max(0, Math.min(3, ranks(t, 'pathfinder') - 10))}s potion CD` },
    ],
    capstone: CAPSTONES.pathfinder,
  },
];

export { ranks }; // panel needs the clamped per-branch count
