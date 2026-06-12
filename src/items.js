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
//
// RELIC SLOT (expansion): a fourth slot, dropped ONLY by the Frostveil/Sanctum
// arc + the secret rare-spawns. It's the only dmg+hp hybrid axis-set, so it adds
// both throughput AND sustain in one slot — but still NO mitigation and NO dodge,
// so the rule above holds: a relic'd hero farms the new zones faster, never
// stands in a burst more safely. Because it's an empty slot for everyone, the
// whole arc reads as the only gear chase that matters while old content (and the
// three legacy slots) is left exactly as it was.

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
  relic:   { dmg: 0.6, hp: 0.6, crit: 0.35, healPower: 0.35 }, // expansion: the only dmg+hp hybrid (sum 1.9)
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

  // ===== expansion (Frostveil & Starfall Sanctum) uniques =====
  thunderbristle: {   // meadow rare spawn, L97 — 100% drop
    id: 'gilded_tusk', name: 'The Gilded Tusk', slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 180, crit: 0.02 },               // power 222.2 vs 209.5 = 1.06× (Vssaric precedent)
    flavor: 'Bodo got his tusks from somewhere.',
  },
  hrimnir: {          // Frostveil elite, L92
    id: 'hrimnirs_mantle', name: "Hrimnir's Mantle", slot: 'armor', rarity: 'legendary', unique: true,
    stats: { hp: 680, speed: 0.03 },               // power 220 vs 198.7 = 1.11×
    flavor: 'It kept its last owner alive through everything but you.',
  },
  seraphel: {         // Sanctum mid-boss, L100
    id: 'seraphels_vigil', name: "Seraphel's Vigil", slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { crit: 0.075, healPower: 0.06, hp: 400 },   // power 243.3 vs 216 = 1.13×
    flavor: 'It watched the gate for a thousand years. It can watch your back instead.',
  },
  noctyra: {          // Sanctum final boss, L105 — expansion BiS, a RELIC
    id: 'the_last_seal', name: 'The Last Seal', slot: 'relic', rarity: 'legendary', unique: true,
    stats: { dmg: 120, hp: 480, crit: 0.055, healPower: 0.048 },  // power 362.4 vs 226.8 = 1.60× (Pyraxis-class)
    flavor: 'Everything that held the door shut, distilled. The door is you now.',
  },

  // ===== expansion (The Verdant Hollow) uniques =====
  spireshade: {       // Hollow elite mini-boss, L116
    id: 'mother_bloom_seed', name: 'Seed of the Mother-Bloom', slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { hp: 520, crit: 0.07, healPower: 0.055 },   // power ≈ 270 vs ~232 baseline = 1.16×
    flavor: 'Still warm, still wanting to grow. Keep it in a closed fist.',
  },
  vorthal: {          // Hollow world boss, L118 — zone BiS, a RELIC (Last-Seal class)
    id: 'the_first_root', name: 'The First Root', slot: 'relic', rarity: 'legendary', unique: true,
    stats: { dmg: 132, hp: 520, crit: 0.06, healPower: 0.052 },  // power ≈ 392 vs ~245 baseline = 1.60×
    flavor: 'The oldest thing in Taborea, and it answered to you. The garden remembers its gardener.',
  },

  // ===== The Last Hour (Horologium) uniques =====
  quaranth: {         // Pendulum Hall mini-boss, L116
    id: 'unwound_mainspring', name: 'The Unwound Mainspring', slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 198, crit: 0.025 },              // ~1.10× a 116 weapon
    flavor: 'Still coiled to strike, a century after the clock stopped.',
  },
  echo: {             // Stilled Vault mini-boss, L118
    id: 'second_that_never_came', name: 'The Second That Never Came', slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { crit: 0.08, healPower: 0.065, hp: 440 },
    flavor: 'It is always about to happen. It never quite does. Useful, that.',
  },
  khronaxis: {        // the Heart, L120 capstone — the new BiS, a RELIC (Last-Seal class)
    id: 'the_last_hour', name: 'The Last Hour', slot: 'relic', rarity: 'legendary', unique: true,
    stats: { dmg: 138, hp: 560, crit: 0.06, healPower: 0.052 },  // power ≈ 412 ≈ 1.60×
    flavor: 'You hold it now. The world keeps turning because you remember to let it.',
  },

  // secret rewards (pseudo-kind keys; granted via makeUnique(key), never dropped):
  vargoth_vault: {
    id: 'vargoths_spare_crown', name: "Vargoth's Spare Crown", slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { hp: 55 },
    flavor: 'He had spares. Of course he had spares.',
  },
  madge: {
    id: 'madges_lucky_pebble', name: "Madge's Lucky Pebble", slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { hp: 100, crit: 0.01 },
    flavor: 'A perfectly ordinary pebble. Madge swears otherwise, and Madge has never been wrong twice.',
  },
  carp: {
    id: 'carp_of_regrets', name: 'Carp of a Thousand Regrets', slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 150, speed: 0.03 },              // ≈ epic ilvl 100; the only speed weapon
    flavor: 'It is a fish. You are hitting things with a fish. Neither of you is forgiven.',
  },
  greta_pressed: {  // Hollow coda quest reward, granted via makeUnique('greta_pressed')
    id: 'pressed_bloom', name: "Greta's Pressed Bloom", slot: 'trinket', rarity: 'legendary', unique: true,
    stats: { hp: 240, healPower: 0.05 },           // a quieter, sentimental BiS-adjacent piece
    flavor: 'A flower from a person, pressed flat in a field journal. She wanted someone to keep it. So do you.',
  },
  glowcap_carbine: {  // Hollow weapon BiS, ~3% sporecaller rare drop (granted via makeUnique)
    id: 'glowcap_carbine', name: 'The Glowcap Carbine', slot: 'weapon', rarity: 'legendary', unique: true,
    stats: { dmg: 220, crit: 0.025 },              // power ≈ 270, weapon BiS for the band
    flavor: 'A mushroom that learned to spit back. It glows when it is happy, which is whenever it is hitting something.',
  },
};

// elites that also drop uniques + the trial/crypt bosses
const ELITE_NAMED = new Set(['boss', 'banditking']);
const TRIAL_CRYPT_BOSSES = new Set(['korgrim', 'vexnar', 'morgrath', 'ossus', 'vargoth', 'emberlord', 'pyraxis']);

// ---------- expansion drop sets (Frostveil & Starfall Sanctum) ----------
// trash/elite families that can roll the relic slot; bosses that drop guaranteed
// epics weighted toward relic + a unique. Existing mobs are in NEITHER set, so
// their drops are byte-identical to before.
const EXPANSION_KINDS = new Set([
  'hoarfrostserpent', 'frostfangstalker', 'rimeboundsentinel', 'custodian',
  'sporecaller', 'hollowstalker', 'bloomwarden', 'swarmling',   // Verdant Hollow trash
]);
const EXPANSION_BOSSES = new Set(['hrimnir', 'seraphel', 'noctyra', 'spireshade', 'vorthal']);

// ---------- The Last Hour (Horologium) drop sets ----------
// Same shape as the Frostveil/Sanctum/Hollow sets: TIME_KINDS trash can roll the
// relic slot; TIME_BOSSES drop a guaranteed epic (relic-weighted) + a chance at
// their named unique. Khronaxis carries the new BiS relic (the_last_hour).
const TIME_BOSSES = new Set(['quaranth', 'echo', 'khronaxis']);
const TIME_KINDS  = new Set(['cogwraith', 'sandflayer']);

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

// sum the equipped {weapon,armor,trinket,relic} (item-or-null) per axis, then
// fold in set bonuses (2pc/4pc) so gearStat()/recalcStats inherit them for free.
// Output shape is FROZEN: {dmg,hp,crit,speed,healPower} — set axes are all
// throughput/sustain (NO DR axis exists in this type, by policy).
export function totalEquippedStats(equipped) {
  const out = { dmg: 0, hp: 0, crit: 0, speed: 0, healPower: 0 };
  if (!equipped) return out;
  const counts = {};
  for (const slot of ALL_SLOTS) {
    const it = equipped[slot];
    if (!it || !it.stats) continue;
    for (const ax in out) out[ax] += it.stats[ax] || 0;
    if (it.setId) counts[it.setId] = (counts[it.setId] || 0) + 1;
  }
  for (const sid in counts) {
    const s = SETS[sid];
    if (!s) continue;
    if (counts[sid] >= 2) for (const ax in s.bonus2) out[ax] += s.bonus2[ax];
    if (counts[sid] >= 4) for (const ax in s.bonus4) out[ax] += s.bonus4[ax];
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
    relic: ['Idol', 'Orb', 'Tear', 'Splinter'],
  }[slot];
  const prefix = { common: 'Worn', uncommon: 'Fine', rare: 'Gleaming', epic: 'Ruinous', legendary: '' }[rarity];
  return `${prefix} ${pick(base)}`.trim();
}

export function makeGenerated(slot, rarity, ilvl) {
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

const SLOTS = ['weapon', 'armor', 'trinket'];          // legacy mobs roll only these three
export const ALL_SLOTS = [...SLOTS, 'relic'];          // totalEquippedStats + UI iterate this

// ===========================================================================
// Iteration C — Crafting + Sets (materials, elixirs, recipes, item sets)
// HARD RULE: every axis below is throughput/sustain/utility
// (dmg/hp/crit/speed/healPower/manaRegen-style timer). NO damage-reduction, NO
// dodge — not in elixirs, not in set bonuses, not in craft gear. Stoneform stays
// the only active DR window.
// ===========================================================================

// ---------- crafting materials (inventory items, tagged kind:'material') ----------
// matIds FROZEN: gather + player.addItem (stacks by matId) + craft all depend on
// this shape. slot:null / stats:{} means equip + totalEquippedStats already skip
// them. Zone-band tiers: 1 meadow → 5 Hollow/boss-gated.
export const MATERIALS = {
  fiber:        { matId: 'fiber',        name: 'Meadow Fiber',        icon: '🌿', tier: 1, flavor: 'Tough grass. Smells of home.' },
  cinderbark:   { matId: 'cinderbark',   name: 'Cinderbark Resin',    icon: '🔥', tier: 2, flavor: 'Sap that never fully cooled.' },
  frostcore:    { matId: 'frostcore',    name: 'Frostcore Shard',     icon: '❄',  tier: 3, flavor: 'Cold that bites back through the glove.' },
  stardust:     { matId: 'stardust',     name: 'Captured Stardust',   icon: '✦',  tier: 4, flavor: 'A pinch of the gate that fell.' },
  sporesilk:    { matId: 'sporesilk',    name: 'Spore-Silk',          icon: '🍄', tier: 5, flavor: 'Spun by a thing that should not weave.' },
  sealfragment: { matId: 'sealfragment', name: 'Fragment of the Seal',icon: '◈',  tier: 5, flavor: 'It still wants to lock something.' },
};

// FROZEN item shape — gather.gatherNode + items.craft both build via this.
export function makeMaterial(matId, qty = 1) {
  const m = MATERIALS[matId];
  if (!m) return null;
  return {
    uid: rollUid(), id: matId, matId, name: m.name, icon: m.icon, kind: 'material',
    slot: null, rarity: 'common', stats: {}, value: Math.max(1, m.tier * 8), qty, flavor: m.flavor,
  };
}

// enemy.level → the zone-band material it drops (rollDrops + gather use the same
// banding). Gaps (76–81, 93–95) default to the lower band per spec.
function zoneMatFor(level) {
  if (level <= 30) return 'fiber';
  if (level <= 75) return 'cinderbark';   // 31–75 (76–81 also falls here)
  if (level <= 92) return 'frostcore';    // 82–92
  if (level <= 105) return 'stardust';    // 96–105 (93–95 also falls here)
  return 'sporesilk';                     // ≥106
}

// ---------- elixirs (consumable timed buffs; player.drinkElixir reads .effect) ----------
// effect.stat enum FROZEN: 'speed'|'dmgPct'|'crit'|'manaRegen'|'healPct'. itemsys
// only stamps the data — player.js/combat.js apply it transiently (never saved).
// These are throughput/utility timers ONLY; the +20% healPct elixir is SUSTAIN,
// not mitigation. No DR variant exists, by policy.
export function makeElixirItem(recipe) {
  return {
    uid: rollUid(), id: recipe.id, kind: 'elixir', name: recipe.name, icon: recipe.icon,
    slot: null, rarity: 'uncommon', stats: {}, value: Math.max(5, Math.round(recipe.gold * 0.1)),
    effect: { ...recipe.effect }, flavor: recipe.desc,
  };
}

// ---------- recipes (integrator renders; ids/shape FROZEN) ----------
export const RECIPES = [
  // --- utility elixirs (throughput/utility timers, NO DR) ---
  { id: 'elx_swift', name: 'Elixir of the Hare', icon: '🐇', kind: 'elixir',
    cost: { fiber: 3 }, gold: 120, effect: { stat: 'speed', amount: 0.25, dur: 30 },
    desc: '+25% movement speed for 30s. For getting somewhere, not for getting hit less.' },
  { id: 'elx_fury', name: 'Cinderblood Elixir', icon: '🔥', kind: 'elixir',
    cost: { cinderbark: 3, fiber: 2 }, gold: 400, effect: { stat: 'dmgPct', amount: 0.12, dur: 30 },
    desc: '+12% damage for 30s. Tastes of soot and bad decisions.' },
  { id: 'elx_clarity', name: 'Phial of Clarity', icon: '◈', kind: 'elixir',
    cost: { frostcore: 2, cinderbark: 1 }, gold: 900, effect: { stat: 'manaRegen', amount: 1.0, dur: 30 },
    desc: 'Doubles mana regen for 30s. The weave hums closer.' },
  { id: 'elx_focus', name: 'Starbright Tonic', icon: '✦', kind: 'elixir',
    cost: { stardust: 2, frostcore: 2 }, gold: 2200, effect: { stat: 'crit', amount: 0.10, dur: 30 },
    desc: '+10% crit for 30s. Everything looks briefly fragile.' },
  { id: 'elx_bloom', name: 'Verdant Draught', icon: '🍄', kind: 'elixir',
    cost: { sporesilk: 2, stardust: 1 }, gold: 3200, effect: { stat: 'healPct', amount: 0.20, dur: 30 },
    desc: '+20% healing for 30s. The Hollow shares, for once.' },
  // --- craftable gear: one per tier; choose the slot at the bench ---
  { id: 'craft_t1', name: 'Pioneer Kit', icon: '⚒', kind: 'gear',
    cost: { fiber: 8 }, gold: 600, gen: { slot: 'PICK', rarity: 'rare', ilvl: 12 },
    desc: 'A solid rare piece — ilvl 12. Choose the slot at the bench.' },
  { id: 'craft_t2', name: 'Cinderforge Kit', icon: '⚒', kind: 'gear',
    cost: { cinderbark: 8, fiber: 6 }, gold: 4000, gen: { slot: 'PICK', rarity: 'rare', ilvl: 70 },
    desc: 'Rare ilvl 70 — bridges the Highlands climb.' },
  { id: 'craft_t3', name: 'Rimeforge Kit', icon: '⚒', kind: 'gear',
    cost: { frostcore: 8, cinderbark: 4 }, gold: 12000, gen: { slot: 'PICK', rarity: 'epic', ilvl: 92 },
    desc: 'Epic ilvl 92 — relic-eligible at the bench.' },
  { id: 'craft_t4', name: 'Hollowforge Kit', icon: '⚒', kind: 'gear',
    cost: { sporesilk: 8, stardust: 4 }, gold: 30000, gen: { slot: 'PICK', rarity: 'epic', ilvl: 115 },
    desc: 'Epic ilvl 115 — closes the gap before The Last Hour.' },
  // --- unique upgrade: +12% to one equipped unique, once ---
  { id: 'reforge', name: 'Reseal a Relic', icon: '◈', kind: 'upgrade',
    cost: { sealfragment: 1, stardust: 4 }, gold: 25000,
    desc: 'Re-temper one unique you own: +12% to all its stats. Once per unique.' },
];

// gold + every cost material satisfied (integrator drives button-disable off this)
export function canCraft(player, recipe) {
  if (!player || player.gold < recipe.gold) return false;
  for (const m in recipe.cost) {
    const have = player.inventory.find((i) => i.matId === m)?.qty || 0;
    if (have < recipe.cost[m]) return false;
  }
  return true;
}

// deduct → produce. opts:{slot} for gear PICK; opts:{item} for reforge. Returns
// false (no-op) if unaffordable. Materials/elixirs go through addItem (which
// stacks materials by matId, owned by player.js).
export function craft(game, recipe, opts) {
  const p = game.player;
  if (!canCraft(p, recipe)) return false;
  for (const m in recipe.cost) {
    const it = p.inventory.find((i) => i.matId === m);
    it.qty -= recipe.cost[m];
    if (it.qty <= 0) p.inventory.splice(p.inventory.indexOf(it), 1);
  }
  p.gold -= recipe.gold;
  if (recipe.kind === 'gear') p.addItem(game, makeGenerated(opts.slot, recipe.gen.rarity, recipe.gen.ilvl));
  else if (recipe.kind === 'elixir') p.addItem(game, makeElixirItem(recipe));
  else if (recipe.kind === 'upgrade') reforgeUnique(game, opts.item);
  game.audio.craftDone();
  game.ui.log(`Crafted ${recipe.name}.`, 'log-loot');
  game.save?.();
  return true;
}

// re-temper a unique: ×1.12 each existing axis, once. Only scales throughput/
// sustain axes that already exist (no DR axis to touch).
export function reforgeUnique(game, item) {
  if (!item.unique || item.reforged) return false;
  for (const ax in item.stats) {
    const v = item.stats[ax] * 1.12;
    item.stats[ax] = (ax === 'crit' || ax === 'speed' || ax === 'healPower')
      ? Math.round(v * 1000) / 1000
      : Math.round(v);
  }
  item.reforged = true;
  item.value = valueOf(item);
  game.player.recalcStats();
  game.player.hp = Math.min(game.player.hp, game.player.maxHp);
  return true;
}

// ---------- item sets (4 pieces each, one per slot; throughput/sustain only) ----------
// setIds FROZEN: hunters/warden/starbound/verdant. item.setId is the JOIN KEY for
// the set-bonus fold in totalEquippedStats + the integrator's tooltip/char-sheet.
// EVERY bonus axis is dmg/hp/crit/speed/healPower — zero mitigation, by policy.
export const SETS = {
  hunters: {  // "Trailwarden's Pursuit" — mid-game (~ilvl 55), Highlands drops
    id: 'hunters', name: "Trailwarden's Pursuit",
    pieces: {
      weapon:  { name: "Trailwarden's Edge",  stats: { dmg: 55, crit: 0.02 } },
      armor:   { name: "Trailwarden's Hide",  stats: { hp: 200, speed: 0.04 } },
      trinket: { name: "Trailwarden's Mark",  stats: { crit: 0.04, hp: 90 } },
      relic:   { name: "Trailwarden's Totem", stats: { dmg: 33, hp: 180, crit: 0.02 } },
    },
    bonus2: { speed: 0.06 }, bonus4: { dmg: 40, crit: 0.03 },
    flavor: 'Worn by those who ran down what the rest of us only feared.',
  },
  warden: {   // "Bulwark of the Long Watch" — defensive SUSTAIN set, NO DR
    id: 'warden', name: 'Bulwark of the Long Watch',
    pieces: {
      weapon:  { name: 'Watchblade',   stats: { dmg: 50, hp: 60 } },
      armor:   { name: 'Watchplate',   stats: { hp: 300, speed: 0.02 } },
      trinket: { name: 'Watch-Sigil',  stats: { hp: 150, healPower: 0.04 } },
      relic:   { name: 'Watchstone',   stats: { hp: 280, dmg: 25, healPower: 0.03 } },
    },
    bonus2: { hp: 200 }, bonus4: { healPower: 0.10, hp: 200 },
    flavor: 'They held the door a long time. They would have held it longer.',
  },
  starbound: { // "Regalia of the Fallen Star" — endgame (~ilvl 100), Sanctum drops
    id: 'starbound', name: 'Regalia of the Fallen Star',
    pieces: {
      weapon:  { name: 'Star-Splinter Blade', stats: { dmg: 120, crit: 0.03 } },
      armor:   { name: 'Star-Splinter Mail',  stats: { hp: 520, speed: 0.03 } },
      trinket: { name: 'Star-Splinter Eye',   stats: { crit: 0.06, healPower: 0.05, hp: 200 } },
      relic:   { name: 'Star-Splinter Heart', stats: { dmg: 90, hp: 360, crit: 0.04 } },
    },
    bonus2: { crit: 0.05 }, bonus4: { dmg: 90, healPower: 0.06 },
    flavor: 'Four shards of the same dead star, hungry to be whole.',
  },
  verdant: {  // "Vestments of the First Spring" — Hollow tier (~ilvl 116)
    id: 'verdant', name: 'Vestments of the First Spring',
    pieces: {
      weapon:  { name: 'Springthorn Lash',  stats: { dmg: 150, crit: 0.03 } },
      armor:   { name: 'Springbark Hide',   stats: { hp: 620, speed: 0.03 } },
      trinket: { name: 'Springbloom Seed',  stats: { crit: 0.06, healPower: 0.06, hp: 240 } },
      relic:   { name: 'Springroot Heart',  stats: { dmg: 110, hp: 420, crit: 0.04 } },
    },
    bonus2: { healPower: 0.06 }, bonus4: { dmg: 100, crit: 0.04 },
    flavor: 'Cut from the season the world tried to grow back all at once.',
  },
};

// bosses that should drop the Hollow-tier `verdant` set rather than `starbound`,
// even though they live in EXPANSION_BOSSES (the Verdant Hollow bosses).
const VERDANT_SET_BOSSES = new Set(['spireshade', 'vorthal']);

// clone a SETS piece into a full inventory instance (fresh uid, tagged setId)
export function makeSetPiece(setId, slot, ilvl) {
  const s = SETS[setId];
  if (!s) return null;
  const piece = s.pieces[slot];
  if (!piece) return null;
  const item = {
    uid: rollUid(), id: piece.name, name: piece.name, slot, rarity: 'epic',
    stats: { ...piece.stats }, setId, unique: false, ilvl, value: 0,
  };
  item.value = valueOf(item);
  return item;
}

// { setId: count } across equipped slots (integrator's tooltip + char-sheet)
export function equippedSetCounts(equipped) {
  const counts = {};
  if (!equipped) return counts;
  for (const slot of ALL_SLOTS) {
    const it = equipped[slot];
    if (it && it.setId) counts[it.setId] = (counts[it.setId] || 0) + 1;
  }
  return counts;
}

// ---------- drop tables (per PLAN tier rules) ----------
// Returns an array of dropped item instances (0..2). Uses plain Math.random()
// to match combat.js loot precedent — drops feel random per-kill.
export function rollDrops(enemy) {
  const kind = enemy.kind;
  const ilvl = enemy.level || 1;
  const drops = [];

  if (TRIAL_CRYPT_BOSSES.has(kind)) {
    // trial/crypt boss: 1 guaranteed epic (or 18% a set piece instead) + 22% unique
    if (Math.random() < 0.18) drops.push(makeSetPiece(pick(['hunters', 'warden']), pick(ALL_SLOTS), ilvl));
    else drops.push(makeGenerated(pick(SLOTS), 'epic', ilvl));
    if (Math.random() < 0.22) {
      const u = makeUnique(kind);
      if (u) drops.push(u);
    }
    if (Math.random() < 0.35) drops.push(makeMaterial('sealfragment', 1));
    return drops;
  }

  if (EXPANSION_BOSSES.has(kind)) {
    // expansion boss: 1 guaranteed epic, slot relic-weighted (or 18% a set piece
    // instead) + 22% unique. Hollow bosses (spireshade/vorthal, also in this set)
    // give the Hollow-tier `verdant` set; Frostveil/Sanctum give `starbound`.
    if (Math.random() < 0.18) {
      const pool = VERDANT_SET_BOSSES.has(kind) ? ['verdant', 'warden'] : ['starbound', 'warden'];
      drops.push(makeSetPiece(pick(pool), pick(ALL_SLOTS), ilvl));
    } else {
      drops.push(makeGenerated(weightedPick({ weapon: 20, armor: 20, trinket: 20, relic: 40 }), 'epic', ilvl));
    }
    if (Math.random() < 0.22) {
      const u = makeUnique(kind);
      if (u) drops.push(u);
    }
    if (Math.random() < 0.35) drops.push(makeMaterial('sealfragment', 1));
    return drops;
  }

  if (TIME_BOSSES.has(kind)) {
    // The Last Hour boss: 1 guaranteed epic, slot relic-weighted (or 18% a
    // verdant/warden set piece instead) + 22% unique (Khronaxis' the_last_hour is
    // the new relic BiS). ilvl = enemy.level (116/118/120).
    if (Math.random() < 0.18) drops.push(makeSetPiece(pick(['verdant', 'warden']), pick(ALL_SLOTS), ilvl));
    else drops.push(makeGenerated(weightedPick({ weapon: 20, armor: 20, trinket: 20, relic: 40 }), 'epic', ilvl));
    if (Math.random() < 0.22) {
      const u = makeUnique(kind);
      if (u) drops.push(u);
    }
    if (Math.random() < 0.35) drops.push(makeMaterial('sealfragment', 1));
    return drops;
  }

  if (kind === 'thunderbristle') {
    // meadow rare spawn: a normal elite roll (slot from the 4-way pick) PLUS a
    // guaranteed Gilded Tusk — the rarity is the spawn, not the roll.
    const rarity = weightedPick({ uncommon: 25, rare: 55, epic: 20 });
    drops.push(makeGenerated(weightedPick({ weapon: 25, armor: 25, trinket: 25, relic: 25 }), rarity, ilvl));
    const u = makeUnique('thunderbristle');
    if (u) drops.push(u);
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

  // the Hollow weapon BiS: a rare flower-spit carbine off the casters (additive
  // to the normal trash roll below — a sporecaller can drop both).
  if (kind === 'sporecaller' && Math.random() < 0.03) {
    const u = makeUnique('glowcap_carbine');
    if (u) drops.push(u);
  }

  // material: any trash mob has a 25% chance to drop 1 of its zone-band material
  // (additive — a mob can drop BOTH a material and a gear piece below).
  if (Math.random() < 0.25) drops.push(makeMaterial(zoneMatFor(ilvl), 1));

  // trash: 18% to drop a single low item. Expansion trash families roll the same
  // rarities, but their slot is the 4-way pick so the relic slot can drop here.
  if (Math.random() < 0.18) {
    const rarity = weightedPick({ common: 60, uncommon: 32, rare: 8 });
    const slot = (EXPANSION_KINDS.has(kind) || TIME_KINDS.has(kind))
      ? weightedPick({ weapon: 25, armor: 25, trinket: 25, relic: 25 })
      : pick(SLOTS);
    drops.push(makeGenerated(slot, rarity, ilvl));
  }
  return drops;
}
