// ===== Runes of Taborea — items, rarities, drop tables, rolling =====
// Single source of truth for gear. Keeps entities.js / combat.js lean.
//
// BALANCE NOTE (see CLAUDE.md "sustain-math lesson"): boss melee is FLAT,
// player heals are %-of-maxHp. Gear here gives NO damage reduction and NO
// dodge — only sustain (hp/healPower) and throughput (dmg/crit/speed). So
// mechanic bursts stay flat and lethal at level: content clears FASTER with
// gear, but is not SAFER to stand in — the sustain floor is respected, and
// the "don't make it easier" policy is honored. Measured against the (7+3.5L)
// base damage term, a full rare kit ≈ +26% dps / +16% maxHp (steady-state farm
// target); full epic ≈ +36% dps / +21% maxHp (figures rise a few points with
// ilvl). Uniques are lopsided sidegrades ≈ epic-power. NOTE: that dps uplift is
// real and material — combined with talent dmgMult it shortens pre-Highlands
// TTKs noticeably; that is the intended "farm faster" payoff, not a sustain
// break (gear gives NO mitigation). If dps ever feels too high, de-tune
// STAT_CONV.dmg below; if the maxHp uplift trivializes the crypt, drop the `hp`
// power-conversion ×4.0 → ×3.0 (single knobs) rather than touching content.

// ---------- rarity table (classic palette: gray→green→blue→purple→orange) ----------
export const RARITY = {
  common:    { label: 'Common',    color: '#9aa0a6', statMul: 0.55 },
  uncommon:  { label: 'Uncommon',  color: '#5edb6a', statMul: 0.75 },
  rare:      { label: 'Rare',      color: '#6fb6ff', statMul: 1.00 },
  epic:      { label: 'Epic',      color: '#b08aff', statMul: 1.35 },
  legendary: { label: 'Legendary', color: '#ff9a30', statMul: 1.00 }, // uniques carry hand-tuned stats; statMul unused
};
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// ---------- which axes each slot favors ----------
const SLOT_AXES = {
  weapon:  { dmg: 1.0, crit: 0.5 },                 // primary dps slot
  armor:   { hp: 1.0, speed: 0.3 },                 // survivability
  trinket: { crit: 0.7, healPower: 0.6, hp: 0.4 },  // utility/hybrid
};

// 1 power -> axis units. (Single de-tune knob: hp 4 -> 3 if crypt trivializes.)
const STAT_CONV = { dmg: 0.9, hp: 4.0, crit: 0.0009, speed: 0.0006, healPower: 0.0010 };

// ---------- named uniques (the reason to re-farm), keyed by boss `kind` ----------
export const UNIQUES = {
  boss: {        // Bodo the Ravager, L5 elite (boar-rider)
    id: 'bodos_tusk', name: "Bodo's Tusk", slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 9, crit: 0.02 },
    flavor: 'Yellowed, cracked, and still sharp enough to gore.',
  },
  banditking: {  // Rurik the Red, L12 elite humanoid
    id: 'ruriks_red_cloak', name: "Rurik's Red Cloak", slot: 'armor', rarity: 'legendary', unique: true,
    stats: { hp: 110, speed: 0.05 },
    flavor: 'The bandit king bled out in it. It suits you better.',
  },
  korgrim: {     // Trial I, L25
    id: 'korgrims_knucklebone', name: "Korgrim's Knucklebone", slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { dmg: 40, crit: 0.025 },
    flavor: "A giant's finger-bone. It hums when you swing.",
  },
  vexnar: {      // Trial II dragon, L30
    id: 'vexnars_scale_cloak', name: "Vexnar's Scale Cloak", slot: 'armor', rarity: 'legendary', unique: true,
    stats: { hp: 280, healPower: 0.04 },
    flavor: 'Dragonscale, fire-tempered. Heavy, warm, alive.',
  },
  morgrath: {    // Trial III, L37
    id: 'morgraths_pale_crown', name: "Morgrath's Pale Crown", slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { crit: 0.06, healPower: 0.045 },
    flavor: 'It whispers the names of the dead. Some are yours.',
  },
  ossus: {       // Crypt, L49
    id: 'ossus_femur_staff', name: "Ossus' Femur Staff", slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 80, healPower: 0.04 },
    flavor: 'A leg-bone the size of a tree, capped in bound runes.',
  },
  vargoth: {     // Crypt final, L55 (cap reward)
    id: 'crown_of_the_undying', name: 'Crown of the Undying', slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { dmg: 70, crit: 0.05, hp: 190 },
    flavor: 'Vargoth would not die. Now neither, perhaps, will you.',
  },
  emberlord: {   // Ashen Highlands sub-area, L70
    id: 'emberlord_brand', name: "Vssaric's Ember Brand", slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 106, crit: 0.04 },
    flavor: 'Still warm. It will always be warm.',
  },
  pyraxis: {     // Ashen Highlands world boss, L75 (capstone BiS)
    id: 'heart_of_the_wyrm', name: 'Heart of the Cinder Wyrm', slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { dmg: 80, hp: 300, crit: 0.045, healPower: 0.04 },
    flavor: "A coal that never cools — Pyraxis' own undying heart.",
  },
};

// elites that also drop uniques + the trial/crypt bosses
const ELITE_NAMED = new Set(['boss', 'banditking']);
const TRIAL_CRYPT_BOSSES = new Set(['korgrim', 'vexnar', 'morgrath', 'ossus', 'vargoth', 'emberlord', 'pyraxis']);

// ---------- small helpers ----------
export function rollUid() {
  return 'i' + Math.random().toString(36).slice(2, 7);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// weighted choice over { key: weight } (weights need not sum to 1)
function weightedPick(weights) {
  let total = 0;
  for (const k in weights) total += weights[k];
  let r = Math.random() * total;
  for (const k in weights) { r -= weights[k]; if (r <= 0) return k; }
  return Object.keys(weights)[0];
}

export function rarityColor(rarity) { return (RARITY[rarity] || RARITY.common).color; }

// "+86 dmg · +4.3% crit" — developer-authored text for tooltips/log
export function statSummary(stats) {
  const order = ['dmg', 'hp', 'crit', 'speed', 'healPower'];
  const parts = [];
  for (const ax of order) {
    const v = stats[ax] || 0;
    if (!v) continue;
    if (ax === 'crit' || ax === 'speed' || ax === 'healPower') parts.push(`+${(v * 100).toFixed(1)}% ${ax}`);
    else parts.push(`+${Math.round(v)} ${ax}`);
  }
  return parts.join(' · ');
}

// sum the equipped {weapon,armor,trinket} (item-or-null) per axis
export function totalEquippedStats(equipped) {
  const out = { dmg: 0, hp: 0, crit: 0, speed: 0, healPower: 0 };
  if (!equipped) return out;
  for (const slot of ['weapon', 'armor', 'trinket']) {
    const it = equipped[slot];
    if (!it || !it.stats) continue;
    for (const ax in out) out[ax] += it.stats[ax] || 0;
  }
  return out;
}

// ---------- value (gold sell price) ----------
const VALUE_PER_POWER = 0.9;
function valueOf(item) {
  // power = sum of (axis value / its conversion rate); inverse of the roll
  let power = 0;
  for (const ax in item.stats) {
    const v = item.stats[ax] || 0;
    if (!v) continue;
    power += v / STAT_CONV[ax];
  }
  return Math.max(5, Math.round(power * VALUE_PER_POWER));
}

// ---------- generated-item scaling ----------
function powerFor(ilvl, rarity) {
  return Math.round(1.6 * ilvl * RARITY[rarity].statMul);
}

function genName(slot, rarity) {
  const base = {
    weapon: ['Blade', 'Edge', 'Cleaver', 'Spike'],
    armor: ['Hauberk', 'Plate', 'Guard', 'Vestment'],
    trinket: ['Charm', 'Sigil', 'Token', 'Band'],
  }[slot];
  const prefix = { common: 'Worn', uncommon: 'Fine', rare: 'Gleaming', epic: 'Ruinous', legendary: '' }[rarity];
  return `${prefix} ${pick(base)}`.trim();
}

function makeGenerated(slot, rarity, ilvl) {
  const power = powerFor(ilvl, rarity);
  const axes = SLOT_AXES[slot];
  let weightSum = 0;
  for (const ax in axes) weightSum += axes[ax];
  const stats = {};
  for (const ax in axes) {
    const portion = power * (axes[ax] / weightSum); // normalized weight
    const v = portion * STAT_CONV[ax];
    // fractional axes keep precision; flat axes round; drop zero-rolls
    const rounded = (ax === 'crit' || ax === 'speed' || ax === 'healPower')
      ? Math.round(v * 1000) / 1000
      : Math.round(v);
    if (rounded > 0) stats[ax] = rounded;
  }
  const item = {
    uid: rollUid(), id: slot, name: genName(slot, rarity),
    slot, rarity, stats, value: 0, ilvl, unique: false,
  };
  item.value = valueOf(item);
  return item;
}

// build a UNIQUES entry into a full inventory instance (fresh uid)
export function makeUnique(kind) {
  const tpl = UNIQUES[kind];
  if (!tpl) return null;
  const item = {
    uid: rollUid(), id: tpl.id, name: tpl.name,
    slot: tpl.slot, rarity: tpl.rarity, stats: { ...tpl.stats },
    value: 0, ilvl: 0, unique: true, flavor: tpl.flavor,
  };
  item.value = valueOf(item);
  return item;
}

const SLOTS = ['weapon', 'armor', 'trinket'];

// ---------- drop tables (per PLAN tier rules) ----------
// Returns an array of dropped item instances (0..2). Uses plain Math.random()
// to match combat.js loot precedent — drops feel random per-kill.
export function rollDrops(enemy) {
  const kind = enemy.kind;
  const ilvl = enemy.level || 1;
  const drops = [];

  if (TRIAL_CRYPT_BOSSES.has(kind)) {
    // trial/crypt boss: 1 guaranteed epic generated item + 22% unique
    drops.push(makeGenerated(pick(SLOTS), 'epic', ilvl));
    if (Math.random() < 0.22) {
      const u = makeUnique(kind);
      if (u) drops.push(u);
    }
    return drops;
  }

  if (enemy.elite) {
    // elite: 100% one generated item, rarity-skewed toward rare, + 12% unique
    const rarity = weightedPick({ uncommon: 25, rare: 55, epic: 20 });
    drops.push(makeGenerated(pick(SLOTS), rarity, ilvl));
    if (ELITE_NAMED.has(kind) && Math.random() < 0.12) {
      const u = makeUnique(kind);
      if (u) drops.push(u);
    }
    return drops;
  }

  // trash: 18% to drop a single low item
  if (Math.random() < 0.18) {
    const rarity = weightedPick({ common: 60, uncommon: 32, rare: 8 });
    drops.push(makeGenerated(pick(SLOTS), rarity, ilvl));
  }
  return drops;
}
