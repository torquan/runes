import * as THREE from 'three';
import { heightAt, HIGHLANDS } from './noise.js';
import { buildBoar, buildWolf, buildHumanoid, buildDragon, buildSerpent, buildSporeling, buildMimic, attachGearHaloes, animateBeast, animateHumanoid, animateSerpent, animateSporeling, animateMimic } from './characters.js';
import { choiceIs } from './talents.js';

// Avenger's Pact: a clean telegraph dodge arms an 8s damage window
function armAvenger(game) {
  if (choiceIs(game.player.talents, 'bulwark', 21, 'avenger')) game.player.avengerT = 8;
}

const ENEMY_TYPES = {
  boar: {
    name: 'Young Boar', level: 1, hp: 60, dmgMin: 3, dmgMax: 7, xp: 25,
    speed: 3.2, aggroRadius: 0, attackRange: 1.7, gold: [1, 4], build: () => buildBoar(false),
  },
  wolf: {
    name: 'Forest Wolf', level: 3, hp: 150, dmgMin: 8, dmgMax: 14, xp: 55,
    speed: 4.6, aggroRadius: 11, attackRange: 1.8, gold: [3, 8], build: () => buildWolf(),
  },
  boss: {
    name: 'Bodo the Ravager', level: 5, hp: 1400, dmgMin: 18, dmgMax: 28, xp: 100,
    speed: 4.0, aggroRadius: 14, attackRange: 3.2, gold: [40, 60], build: () => buildBoar(true),
    elite: true, ccImmune: true,
  },
  bandit: {
    name: 'Grimblade Bandit', level: 8, hp: 450, dmgMin: 22, dmgMax: 32, xp: 35,
    speed: 5.2, aggroRadius: 10, attackRange: 2.2, gold: [8, 15],
    build: () => buildHumanoid('bandit'), humanoid: true,
  },
  banditking: {
    name: 'Rurik the Red', level: 12, hp: 3000, dmgMin: 75, dmgMax: 110, xp: 120,
    speed: 4.6, aggroRadius: 13, attackRange: 2.9, gold: [80, 120],
    build: () => { const g = buildHumanoid('banditking'); g.scale.setScalar(1.35); return g; },
    humanoid: true, elite: true, ccImmune: true,
  },
  // ---- the Trials: endgame bosses with mechanics ----
  korgrim: {
    name: 'Korgrim the Mountain', level: 25, hp: 24000, dmgMin: 150, dmgMax: 210, xp: 600,
    speed: 3.6, aggroRadius: 13, attackRange: 4.2, gold: [600, 900], respawn: 120, leash: 50,
    build: () => { const g = buildHumanoid('giant'); g.scale.setScalar(2.7); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [{
      kind: 'slam', interval: 8, telegraph: 1.5, radius: 8.5, dmg: 380,
      center: 'boss', avoid: 'jump', color: 0xffaa30,
      warn: 'raises his fists — JUMP!',
      dodgeMsg: 'You leap over the shockwave!',
    }],
  },
  vexnar: {
    name: 'Vexnar the Ash Dragon', level: 30, hp: 32000, dmgMin: 190, dmgMax: 260, xp: 1000,
    speed: 4.4, aggroRadius: 14, attackRange: 4.6, gold: [1000, 1500], respawn: 150, leash: 50,
    build: () => buildDragon(),
    elite: true, ccImmune: true,
    mechanics: [{
      kind: 'zone', interval: 7, telegraph: 1.6, radius: 5.5, dmg: 480,
      center: 'player', avoid: 'move', color: 0xff5020,
      warn: 'draws a breath of ash — MOVE!',
      dodgeMsg: 'The ash scorches empty ground.',
    }],
  },
  morgrath: {
    name: 'Morgrath, the Pale King', level: 37, hp: 40000, dmgMin: 230, dmgMax: 310, xp: 2000,
    speed: 4.8, aggroRadius: 13, attackRange: 3.4, gold: [1800, 2600], respawn: 180, leash: 50,
    build: () => { const g = buildHumanoid('paleking'); g.scale.setScalar(1.8); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [{
      kind: 'zone', interval: 9, telegraph: 1.5, radius: 5, dmg: 520,
      center: 'player', avoid: 'move', color: 0xb090ff,
      warn: 'tears the earth beneath you — MOVE!',
      dodgeMsg: 'The grave-burst finds nothing.',
    }],
    summons: { at: [0.75, 0.5, 0.25], kind: 'thrall', count: 2 },
  },
  thrall: {
    name: 'Risen Thrall', level: 25, hp: 1400, dmgMin: 90, dmgMax: 130, xp: 60,
    speed: 5.6, aggroRadius: 40, attackRange: 2.2, gold: [20, 40],
    build: () => buildHumanoid('thrall'),
    humanoid: true, temporary: true,
  },
  // ---- the Sunken Crypt ----
  revenant: {
    name: 'Crypt Revenant', level: 41, hp: 6000, dmgMin: 120, dmgMax: 170, xp: 280,
    speed: 5.8, aggroRadius: 8, attackRange: 2.4, gold: [60, 120], respawn: 600, wanderR: 1.5,
    build: () => buildHumanoid('revenant'),
    humanoid: true,
  },
  ossus: {
    name: 'Gravelord Ossus', level: 49, hp: 55000, dmgMin: 330, dmgMax: 430, xp: 1100,
    speed: 4.4, aggroRadius: 15, attackRange: 3.4, gold: [3000, 4500], respawn: 240, wanderR: 2, leash: 80,
    build: () => { const g = buildHumanoid('gravelord'); g.scale.setScalar(2.0); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [{
      kind: 'zone', interval: 7, telegraph: 1.5, radius: 6, dmg: 850,
      center: 'player', avoid: 'move', color: 0x7aff9a,
      warn: 'calls bones from the floor — MOVE!',
      dodgeMsg: 'The bone spikes find nothing.',
    }],
    summons: { at: [0.6, 0.3], kind: 'boneguard', count: 2 },
  },
  vargoth: {
    name: 'Vargoth the Undying', level: 55, hp: 85000, dmgMin: 400, dmgMax: 500, xp: 2100,
    speed: 4.6, aggroRadius: 16, attackRange: 3.6, gold: [8000, 12000], respawn: 300, wanderR: 2, leash: 80,
    build: () => { const g = buildHumanoid('undying'); g.scale.setScalar(2.2); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [
      {
        kind: 'slam', interval: 9, telegraph: 1.5, radius: 9, dmg: 800,
        center: 'boss', avoid: 'jump', color: 0xc9921e,
        warn: 'shatters the crypt floor — JUMP!',
        dodgeMsg: 'You leap over the rolling quake!',
      },
      {
        kind: 'zone', interval: 8, telegraph: 1.4, radius: 6.5, dmg: 950,
        center: 'player', avoid: 'move', color: 0xb090ff,
        warn: 'curses the ground you stand on — MOVE!',
        dodgeMsg: 'The curse withers on empty stone.',
      },
    ],
    summons: { at: [0.75, 0.5, 0.25], kind: 'boneguard', count: 2 },
  },
  boneguard: {
    name: 'Boneguard', level: 47, hp: 8000, dmgMin: 200, dmgMax: 280, xp: 320,
    speed: 5.8, aggroRadius: 50, attackRange: 2.4, gold: [80, 150],
    build: () => buildHumanoid('boneguard'),
    humanoid: true, temporary: true,
  },

  // ===== The Ashen Highlands (level 56–75) =====
  cinderwraith: {
    name: 'Cinder Wraith', level: 56, hp: 4900, dmgMin: 0, dmgMax: 0, xp: 541,
    speed: 3.4, aggroRadius: 14, attackRange: 16, gold: [70, 130], respawn: 30,
    leash: 36, wanderR: 1.5,    // small: aggro is LOS-less, so westmost wander must clear ZONE_ENTER
    build: () => buildHumanoid('wraith'),
    humanoid: true,
    ranged: true, boltDmgMin: 297, boltDmgMax: 371, boltColor: 0xff6020, boltSpeed: 18,
    // dmgMin/dmgMax 0 because all damage is the ranged bolt
  },
  ashhound: {
    name: 'Ash Hound', level: 60, hp: 3800, dmgMin: 219, dmgMax: 273, xp: 627,
    speed: 7.4, aggroRadius: 13, attackRange: 2.0, gold: [50, 100], respawn: 25,
    leash: 30, wanderR: 3,      // small: aggro is LOS-less, so westmost wander must clear ZONE_ENTER
    build: () => buildWolf(),                  // beast: faces +X via animateBeast
  },
  obsidiangolem: {
    name: 'Obsidian Golem', level: 66, hp: 8900, dmgMin: 349, dmgMax: 435, xp: 770,
    speed: 2.6, aggroRadius: 9, attackRange: 3.2, gold: [180, 320], respawn: 60,
    leash: 26, wanderR: 2, armor: 48,          // flat per-hit damage reduction (≈20% of an at-level player hit)
    build: () => { const g = buildHumanoid('golem'); g.scale.setScalar(1.7); return g; },
    humanoid: true,
  },

  // ---- elite sub-area mini-boss ----
  emberlord: {
    // melee dps tuned to the sustain floor for L70 (base maxHp 2880): the
    // unavoidable auto-attack stream sits at ≈0.08×maxHp = 230/s. At 2.2s
    // elite interval that's avg ≈507 → 451/563. Meteor mechanic stays lethal.
    name: 'Emberlord Vssaric', level: 70, hp: 30500, dmgMin: 451, dmgMax: 563, xp: 2332,
    speed: 4.2, aggroRadius: 15, attackRange: 3.6, gold: [4000, 6000],
    respawn: 240, leash: 60, wanderR: 2, armor: 44,
    build: () => { const g = buildHumanoid('undying'); g.scale.setScalar(2.0); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [{
      kind: 'zone', interval: 7, telegraph: 1.5, radius: 6, dmg: 1152,
      center: 'player', avoid: 'move', color: 0xff5020,
      warn: 'hurls a meteor — MOVE!', dodgeMsg: 'The meteor cracks empty stone.',
    }],
    summons: { at: [0.6, 0.3], kind: 'ashhound', count: 3 },
  },

  // ---- world boss ----
  pyraxis: {
    // melee dps tuned to the sustain floor for L75 (base maxHp 3080): the
    // UNAVOIDABLE auto-attack stream must sit at ≈0.08×maxHp = 246/s, not lie
    // about its level. At 2.2s elite interval that's avg ≈542 → 482/602.
    // The three mechanics (slam/breath/firepatch) carry the near-lethal burst.
    name: 'Pyraxis, the Cinder Wyrm', level: 75, hp: 118600, dmgMin: 482, dmgMax: 602, xp: 4062,
    speed: 4.6, aggroRadius: 18, attackRange: 5.0, gold: [15000, 22000],
    respawn: 300, leash: 90, wanderR: 2, armor: 47,
    build: () => { const g = buildDragon(); g.scale.setScalar(1.25); return g; },  // beast: faces +X
    elite: true, ccImmune: true,
    mechanics: [
      { // (1) SLAM — jump
        kind: 'slam', interval: 10, telegraph: 1.5, radius: 10, dmg: 1294,
        center: 'boss', avoid: 'jump', color: 0xffaa30,
        warn: 'rears and crashes down — JUMP!', dodgeMsg: 'You leap the shockwave!',
      },
      { // (2) ZONE — move (breath on player)
        kind: 'zone', interval: 8, telegraph: 1.5, radius: 7, dmg: 1294,
        center: 'player', avoid: 'move', color: 0xff5020,
        warn: 'inhales a gout of cinders — MOVE!', dodgeMsg: 'The cinders scorch bare rock.',
      },
      { // (3) FIREPATCH — NEW persistent stack zone (lingers 20s, shrinks arena)
        kind: 'firepatch', interval: 12, telegraph: 1.4, radius: 4.5, dmg: 700,
        lingerDmg: 300, linger: 20, center: 'player', avoid: 'move', color: 0xff3a10,
        warn: 'spits clinging fire — MOVE, and stay out!', dodgeMsg: 'The fire takes root on empty ground.',
      },
    ],
    summons: { at: [0.75, 0.5, 0.25], kind: 'ashhound', count: 3 },
  },

  // ===== The Frostveil (level 82–92) =====
  hoarfrostserpent: {
    // ranged kiter on the L82 sustain floor (646.8 DPS): hp ≈ 11s of player
    // DPS = 7100; bolt avg 484 = ±11% spread, all damage on the bolt (no melee).
    name: 'Hoarfrost Serpent', level: 82, hp: 7100, dmgMin: 0, dmgMax: 0, xp: 1232,
    speed: 3.2, aggroRadius: 14, attackRange: 16, gold: [150, 280], respawn: 30,
    leash: 36, wanderR: 1.5,
    build: () => buildSerpent(),                       // NEW beast rig, faces +X
    serpent: true,                                     // routes through animateSerpent
    ranged: true, boltDmgMin: 430, boltDmgMax: 538, boltColor: 0x9fe8ff, boltSpeed: 19,
  },
  frostfangstalker: {
    // fast 3-pack: hit 0.69×506.9≈350 (pack discount), hp 8s×677.6≈5400.
    name: 'Frostfang Stalker', level: 86, hp: 5400, dmgMin: 312, dmgMax: 388, xp: 1367,
    speed: 7.6, aggroRadius: 13, attackRange: 2.0, gold: [120, 220], respawn: 25,
    leash: 30, wanderR: 3,
    build: () => buildWolf('frost'),                   // wolf rig + palette arg
  },
  rimeboundsentinel: {
    // slow solo sentry: hit 524 avg, hp 16.5s×700.7≈11600, armor 62 ≈ 19.5% of 318.5.
    name: 'Rimebound Sentinel', level: 89, hp: 11600, dmgMin: 466, dmgMax: 582, xp: 1473,
    speed: 2.6, aggroRadius: 9, attackRange: 3.2, gold: [380, 650], respawn: 60,
    leash: 26, wanderR: 2, armor: 62,
    build: () => { const g = buildHumanoid('rimebound'); g.scale.setScalar(1.7); return g; },
    humanoid: true,
  },
  hrimnir: {
    // zone elite: hit 661.5 avg, hp 50s×723.8≈36200 (TTK 50s, elite band), burst
    // 39%×3760=1466, sustain floor maxHp 3008 → base L74. Summons stalkers twice.
    name: 'Hrimnir, the Avalanche-Jarl', level: 92, hp: 36200, dmgMin: 595, dmgMax: 728, xp: 4222,
    speed: 4.2, aggroRadius: 15, attackRange: 4.0, gold: [7000, 10000],
    respawn: 240, leash: 60, wanderR: 2, armor: 60,
    build: () => { const g = buildHumanoid('frostjarl'); g.scale.setScalar(2.4); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [{
      kind: 'slam', interval: 8, telegraph: 1.5, radius: 9, dmg: 1466,
      center: 'boss', avoid: 'jump', color: 0x9fe8ff,
      warn: 'heaves the glacier — JUMP!',
      dodgeMsg: 'You leap the avalanche as it rolls beneath you!',
    }],
    summons: { at: [0.6, 0.3], kind: 'frostfangstalker', count: 3 },
  },

  // ===== The Starfall Sanctum (level 96–105) =====
  custodian: {
    // dungeon 2–3 packs: hit 0.60×564.5≈339 (pack discount), hp 13s×754.6≈9800.
    name: 'Astral Custodian', level: 96, hp: 9800, dmgMin: 305, dmgMax: 373, xp: 1737,
    speed: 5.6, aggroRadius: 8, attackRange: 2.4, gold: [200, 360],
    respawn: 600, wanderR: 1.5,
    build: () => buildHumanoid('custodian'),
    humanoid: true,
  },
  seraphel: {
    // mid-boss: hit 718 avg, hp 120s×785.4≈94200, bursts 40%×4080=1632, floor L80.
    // Two mechanics: starbeam-on-player (move) and orrery-slam (jump).
    name: 'Seraphel, the Vault Warden', level: 100, hp: 94200, dmgMin: 646, dmgMax: 790, xp: 5064,
    speed: 4.4, aggroRadius: 13, attackRange: 3.4, gold: [12000, 18000],
    respawn: 240, leash: 80, wanderR: 2, armor: 68,
    build: () => { const g = buildHumanoid('vaultwarden'); g.scale.setScalar(2.0); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [
      { kind: 'zone', interval: 7, telegraph: 1.5, radius: 6, dmg: 1632,
        center: 'player', avoid: 'move', color: 0xcfe8ff,
        warn: 'lances a beam of starlight at your feet — MOVE!',
        dodgeMsg: 'The starbeam scorches empty tiles.' },
      { kind: 'slam', interval: 9, telegraph: 1.5, radius: 9, dmg: 1632,
        center: 'boss', avoid: 'jump', color: 0xffd87a,
        warn: 'drags the orrery down — JUMP!',
        dodgeMsg: 'You leap the ring of falling brass!' },
    ],
    summons: { at: [0.6, 0.3], kind: 'custodian', count: 2 },
  },
  noctyra: {
    // capstone: hit 753 avg, hp 200s×823.9≈164800, slam 42% / sanctuary 45% / rift
    // 970+415-tick (Pyraxis ratios), sustain floor L84 base — at 96 her 342.4 dps
    // vs 392/s heal throughput = 49.6/s margin, TTK 218s, bursts 46–49% of a 96.
    name: 'Noctyra, the Hollow Star', level: 105, hp: 164800, dmgMin: 678, dmgMax: 828, xp: 8450,
    speed: 4.6, aggroRadius: 16, attackRange: 3.8, gold: [26000, 38000],
    respawn: 300, leash: 80, wanderR: 2, armor: 72,
    build: () => { const g = buildHumanoid('hollowstar'); g.scale.setScalar(2.4); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [
      { kind: 'slam', interval: 10, telegraph: 1.5, radius: 10, dmg: 1798,   // 42% of 4280
        center: 'boss', avoid: 'jump', color: 0xffd87a,
        warn: 'lets her weight return — JUMP!', dodgeMsg: 'You leap the gravity wave!' },
      { kind: 'firepatch', interval: 12, telegraph: 1.4, radius: 4.5, dmg: 970,   // Pyraxis ratios
        lingerDmg: 415, linger: 20, center: 'player', avoid: 'move', color: 0x6a5acd,
        warn: 'tears a rift where you stand — MOVE, and stay out!',
        dodgeMsg: 'The rift gnaws on empty floor.' },
      { kind: 'sanctuary', interval: 13, telegraph: 1.6, radius: 5.5, dmg: 1926,  // 45% — NEW kind, §5
        center: 'boss', avoid: 'in', color: 0xfff2c0,
        warn: 'draws every light into her shadow — GET IN!',
        dodgeMsg: 'You shelter in the umbra as the starfire falls.' },
    ],
    summons: { at: [0.75, 0.5, 0.25], kind: 'custodian', count: 2 },
  },

  // ===== meadow rare spawn (secret) =====
  thunderbristle: {
    // L97 rare boar: hit 697 avg, hp 55s×762.3≈41900, slam 40%×3960=1584;
    // leash 50 < home dist 53.8 so he can never reach the campfire.
    name: 'Thunderbristle, Sire of All Boars', level: 97, hp: 41900, dmgMin: 627, dmgMax: 767, xp: 4738,
    speed: 5.0, aggroRadius: 22, attackRange: 3.4, gold: [9000, 14000],
    respawn: 900, leash: 50, wanderR: 4,
    build: () => { const g = buildBoar(true, 'gold'); g.scale.setScalar(3.2); return g; },  // beast: +X
    elite: true, ccImmune: true,
    mechanics: [{
      kind: 'slam', interval: 9, telegraph: 1.5, radius: 9, dmg: 1584,
      center: 'boss', avoid: 'jump', color: 0xffaa30,
      warn: 'rears up on hooves the size of cartwheels — JUMP!',
      dodgeMsg: 'You leap as the meadow itself bounces.',
    }],
    summons: { at: [0.5], kind: 'boar', count: 4 },   // four LEVEL-1 Young Boars (auto-temporary)
  },

  // ===== The Verdant Hollow (level 106–118) =====
  sporecaller: {
    // ranged caster (NEW rig): bolt avg 540 ≈ sustain at the zone floor; hp 9150.
    name: 'Sporecaller', level: 106, hp: 9150, dmgMin: 0, dmgMax: 0, xp: 1880,
    speed: 3.2, aggroRadius: 14, attackRange: 16, gold: [200, 360], respawn: 30,
    leash: 36, wanderR: 1.5,
    build: () => buildSporeling(),                 // NEW rig (faces +X, beast formula)
    sporeling: true,                               // routes the animateSporeling branch
    ranged: true, boltDmgMin: 481, boltDmgMax: 599, boltColor: 0xff5ea8, boltSpeed: 18,
  },
  hollowstalker: {
    // fast 3-pack hunter; wolf rig + 'verdant' palette (mossy fur, pink eyes).
    name: 'Hollowstalker', level: 110, hp: 6900, dmgMin: 317, dmgMax: 387, xp: 2090,
    speed: 7.6, aggroRadius: 13, attackRange: 2.0, gold: [160, 300], respawn: 25,
    leash: 30, wanderR: 3,
    build: () => buildWolf('verdant'),             // wolf rig + NEW palette arg
  },
  bloomwarden: {
    // slow armored sentry (a person the Hollow grew through); armor 78 ≈ 19% of L113.
    name: 'Bloomwarden', level: 113, hp: 15000, dmgMin: 485, dmgMax: 595, xp: 2320,
    speed: 2.6, aggroRadius: 9, attackRange: 3.2, gold: [460, 780], respawn: 60,
    leash: 26, wanderR: 2, armor: 78,
    build: () => { const g = buildHumanoid('bloomwarden'); g.scale.setScalar(1.8); return g; },
    humanoid: true,
  },
  swarmling: {
    // soft trash, passive until hit (aggroRadius 0 = the "young boar" of the zone).
    name: 'Mycelial Swarmling', level: 108, hp: 5100, dmgMin: 360, dmgMax: 460, xp: 1700,
    speed: 4.0, aggroRadius: 0, attackRange: 1.8, gold: [120, 240], respawn: 18,
    leash: 32, wanderR: 5,
    build: () => buildBoar(false, 'verdant'),      // reuse boar rig + 'verdant' palette
  },
  spireshade: {
    // elite (Emberlord/Hrimnir role): TTK ~50s, zone burst 39%, summons the green hunt.
    name: 'Spireshade, the Mother-Bloom', level: 116, hp: 47200, dmgMin: 595, dmgMax: 725, xp: 5200,
    speed: 4.2, aggroRadius: 15, attackRange: 4.0, gold: [9000, 13000],
    respawn: 240, leash: 60, wanderR: 2, armor: 74,
    build: () => { const g = buildHumanoid('bloomwarden'); g.scale.setScalar(2.4); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [{
      kind: 'zone', interval: 8, telegraph: 1.5, radius: 6, dmg: 1840,   // 39% of L116 maxHp 4720
      center: 'player', avoid: 'move', color: 0xff5ea8,
      warn: 'erupts a spore-bloom beneath you — MOVE!',
      dodgeMsg: 'The bloom bursts on bare moss.',
    }],
    summons: { at: [0.6, 0.3], kind: 'hollowstalker', count: 3 },
  },
  vorthal: {
    // world boss, tuned to L118: sustain floor 0.08×4800=384/s; HP ≈ 200s×924.
    // Bursts 42–46% of 4800 (near-lethal, dodgeable). ONLY existing mechanic kinds.
    name: 'Vorthal, the First Root', level: 118, hp: 184800, dmgMin: 760, dmgMax: 930, xp: 9400,
    speed: 4.6, aggroRadius: 18, attackRange: 5.0, gold: [30000, 44000],
    respawn: 300, leash: 90, wanderR: 2, armor: 80,
    build: () => { const g = buildDragon(); g.scale.setScalar(1.35); return g; },  // beast +X
    elite: true, ccImmune: true,
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

  // ===== The Last Hour / the Horologium (level 116–120) =====
  cogwraith: {
    // dungeon trash (humanoid): pack-discounted hit 0.62×680≈420, hp 13s×908.6≈11800.
    // tight rooms → small aggroRadius 8 + wanderR 1.5 (LOS-less aggro).
    name: 'Cogwraith', level: 116, hp: 11800, dmgMin: 374, dmgMax: 467, xp: 2625,
    speed: 5.6, aggroRadius: 8, attackRange: 2.4, gold: [220, 400], respawn: 600,
    leash: 32, wanderR: 1.5, humanoid: true,
    build: () => buildHumanoid('cogwraith'),
  },
  sandflayer: {
    // fast 2-packs (beast): hit 0.69×686≈473, hp 8s×916.3≈7300. open corridors.
    name: 'Sandflayer', level: 117, hp: 7300, dmgMin: 426, dmgMax: 521, xp: 2670,
    speed: 7.6, aggroRadius: 13, attackRange: 2.0, gold: [180, 320], respawn: 600,
    leash: 30, wanderR: 3,
    build: () => buildWolf('sand'),               // wolf rig + NEW desiccated palette
  },
  quaranth: {
    // MINI-BOSS 1 (L116, elite): a stalled clockwork colossus. beam + zone.
    // Sustain 0.08×4720=378/s; hp 50s×908.6≈45000. armor 78 ≈ 19% of 413.
    name: 'Quaranth, the Unwound', level: 116, hp: 45000, dmgMin: 749, dmgMax: 915, xp: 7000,
    speed: 4.2, aggroRadius: 15, attackRange: 4.0, gold: [9000, 13000],
    respawn: 240, leash: 90, wanderR: 2, armor: 78,
    build: () => { const g = buildHumanoid('golem'); g.scale.setScalar(2.2); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [
      { kind: 'beam', interval: 9, telegraph: 2.2, length: 22, halfArc: 0.34, sweep: 2.4, radius: 22, dmg: 1888,
        center: 'boss', avoid: 'dodge', color: 0xff4d6d,
        warn: 'swings the great pendulum-arm — DODGE the arc!', dodgeMsg: 'The arm scythes past your heels.' },
      { kind: 'zone', interval: 8, telegraph: 1.5, radius: 6, dmg: 1841,
        center: 'player', avoid: 'move', color: 0xb06bff,
        warn: 'drops a stopped second on you — MOVE!', dodgeMsg: 'The frozen second cracks empty floor.' },
    ],
    summons: { at: [0.5], kind: 'cogwraith', count: 2 },
  },
  echo: {
    // MINI-BOSS 2 (L118, elite): a time-revenant fighting a half-second ahead.
    // tether + soak + slam. Sustain 0.08×4800=384/s; hp 55s×924≈50800. armor 80 ≈ 19% of 420.
    name: 'Echo of the First Minute', level: 118, hp: 50800, dmgMin: 760, dmgMax: 930, xp: 7120,
    speed: 4.4, aggroRadius: 15, attackRange: 4.0, gold: [11000, 16000],
    respawn: 240, leash: 90, wanderR: 2, armor: 80,
    build: () => { const g = buildHumanoid('wraith'); g.scale.setScalar(2.0); return g; },
    humanoid: true, elite: true, ccImmune: true,
    mechanics: [
      { kind: 'tether', interval: 10, telegraph: 2.4, breakDist: 10, radius: 10, pullBack: true, dmg: 1920,
        center: 'player', avoid: 'flee', color: 0xb06bff,
        warn: 'chains you to the minute you just left — RUN to break it!', dodgeMsg: 'The chain snaps and the past lets go.' },
      { kind: 'soak', interval: 11, telegraph: 2.0, radius: 3, dmg: 1824, unsoakedDmg: 4378,
        center: 'player', avoid: 'in', color: 0x4dd0ff,
        warn: 'gathers a falling weight — SOAK it or it falls on everything!', dodgeMsg: 'You take the weight square; better than the alternative.' },
      { kind: 'slam', interval: 9, telegraph: 1.5, radius: 9, dmg: 1968,
        center: 'boss', avoid: 'jump', color: 0xffd87a,
        warn: 'collapses the moment around it — JUMP!', dodgeMsg: 'You leap the imploding instant.' },
    ],
    summons: { at: [0.6, 0.3], kind: 'sandflayer', count: 2 },
  },
  khronaxis: {
    // CAPSTONE (level 120, RAISES CAP): all four new kinds + slam + the only enrage
    // timer in the game. Sustain 0.08×4880=390.4/s; hp 200s×939.4≈188000. armor 82 ≈ 19% of 427.
    name: 'Khronaxis, the Hour That Was Kept', level: 120, hp: 188000, dmgMin: 773, dmgMax: 945, xp: 11460,
    speed: 4.6, aggroRadius: 16, attackRange: 4.0, gold: [30000, 45000],
    respawn: 600, leash: 90, wanderR: 2, armor: 82,
    build: () => { const g = buildHumanoid('khronaxis'); g.scale.setScalar(2.6); attachGearHaloes(g); return g; },
    humanoid: true, elite: true, ccImmune: true,
    enrageAt: 200, enrageMult: 1.6,
    mechanics: [
      { kind: 'shatterfloor', interval: 13, telegraph: 2.0, tile: 4, parity: 'auto', radius: 18, dmg: 2098,
        center: 'boss', avoid: 'jump', color: 0xff8a3a,
        warn: 'the floor remembers it was never solid — JUMP or find footing!', dodgeMsg: 'You ride the gap as the tiles drop away.' },
      { kind: 'beam', interval: 9, telegraph: 2.2, length: 24, halfArc: 0.36, sweep: 2.6, radius: 24, dmg: 2147,
        center: 'boss', avoid: 'dodge', color: 0xff4d6d,
        warn: 'sweeps the hand of the great clock — DODGE!', dodgeMsg: 'The clock-hand scythes past you.' },
      { kind: 'tether', interval: 11, telegraph: 2.4, breakDist: 10, radius: 10, pullBack: true, dmg: 2196,
        center: 'player', avoid: 'flee', color: 0xb06bff,
        warn: 'binds you to a kept minute — RUN!', dodgeMsg: 'You outrun your own past.' },
      { kind: 'soak', interval: 12, telegraph: 2.0, radius: 3, dmg: 2098, unsoakedDmg: 5035,
        center: 'player', avoid: 'in', color: 0x4dd0ff,
        warn: 'lets a held hour fall — SOAK it!', dodgeMsg: 'You shoulder the hour.' },
      { kind: 'slam', interval: 10, telegraph: 1.5, radius: 10, dmg: 2050,
        center: 'boss', avoid: 'jump', color: 0xffd87a,
        warn: 'lets the weight of time return — JUMP!', dodgeMsg: 'You leap the gravity of years.' },
    ],
    summons: { at: [0.75, 0.5, 0.25], kind: 'cogwraith', count: 2 },
  },
  // ---- Iteration E: the hidden layer ----
  mimic: {
    // a fake loot chest that bites. Tuned as a level-60 elite surprise (at-level-60
    // player maxHp 2480; DPS 470.8). TTK ≈ 7.9s — a sharp scare, not a slog.
    name: 'Mimic', level: 60, hp: 3700, dmgMin: 95, dmgMax: 130, xp: 0,
    speed: 0,                          // ROOTED — a chest can't chase
    aggroRadius: 3.5,                  // only "wakes" at chest-open range
    attackRange: 3.0, gold: [400, 900],
    elite: true, ccImmune: true,       // every elite is ccImmune (CLAUDE.md)
    leash: 6, armor: 18,               // wooden hide ≈ 4% of an at-level-60 hit
    build: () => buildMimic(),
    humanoid: true,                    // faces the player squarely (more menacing)
    reveal: true,                      // render as a CLOSED chest until aggro'd
  },
  // Grim, the Tax Collector — ritual-summoned secret boss (level 119). Pays in loot
  // + title, not XP. aggroRadius 0 = passive until summoned (summonGrim sets chase)
  // or hit. Effective dps ≈ 0.074×4840 ≈ 359/s — right at the boss target; all
  // bursts dodgeable (jump/move). Difficulty by skill check, not stat wall.
  grim: {
    name: 'Grim, the Tax Collector', level: 119, humanoid: true, elite: true, ccImmune: true,
    hp: 140000, dmgMin: 360, dmgMax: 460, xp: 0,
    speed: 5.5, aggroRadius: 0, attackRange: 3.0,
    gold: [40000, 60000], leash: 80, armor: 0,
    // summon-once-per-ritual: a killed Grim is REMOVED (toRemove via the temporary
    // branch in updateEnemies), never auto-respawned at home. The only way back is
    // redoing the dim->bright->flicker ritual, which calls summonGrim() (§E.4).
    temporary: true,
    build: () => { const g = buildHumanoid('grim'); g.scale.setScalar(1.6); return g; },
    mechanics: [
      { kind: 'slam', interval: 9, telegraph: 1.6, radius: 5.5, dmg: 1950, center: 'player', avoid: 'jump',
        color: 0xffd24a, warn: 'tallies your debts!', dodgeMsg: 'You skip the bill!' },                       // 40% of 4840
      { kind: 'zone', interval: 11, telegraph: 2.0, radius: 9, dmg: 1840, center: 'boss', avoid: 'move',
        color: 0xc8a23a, warn: 'seizes the surrounding assets!', dodgeMsg: 'You keep what is yours!' },        // 38%
      { kind: 'firepatch', interval: 13, telegraph: 1.5, radius: 4, dmg: 1450, center: 'player', avoid: 'move',
        linger: 18, lingerDmg: 290, color: 0xe0b84a, warn: 'lets the interest accrue.', dodgeMsg: 'Paid early!' }, // 6%/s linger
    ],
    summons: { at: [0.5], kind: 'mimic', count: 2 },   // at 50%, "calls in the collateral"
  },
};

export const TRIAL_SITES = {
  korgrim: { x: 0, z: -125 },
  vexnar: { x: 125, z: 55 },
  morgrath: { x: -105, z: 95 },
};

export const HIGHLANDS_SITES = {
  emberlord: { x: 178, z: -40 },   // elite sub-area, north basin
  pyraxis:   { x: 196, z: 40 },    // world-boss arena, far east shelf
};

export const FROSTVEIL_SITES = { hrimnir: { x: -345, z: 32 } };

export const HOLLOW_SITES = { vorthal: { x: 0, z: -345 }, spireshade: { x: -30, z: -300 } };

// Boss-room centers in the Horologium — MUST match the shell's arena-room walls.
// DEVIATION FROM CONTRACT (loud): the contract pinned x=0, but the shell
// (horologium.js, already written) builds the whole dungeon CENTERED ON x≈305
// (the pocket is x250..360, like CRYPT in the same band — x=0 is OUTSIDE it and
// would land on world terrain, not the y60 floor). horologium.js lines 8-21
// explicitly supersede the x=0 coords with the centerline x=305 (CX). Engine
// follows the shell's real geometry: quaranth (305,245), echo (305,278),
// khronaxis (305,303); arrival/exit at (305,210).
export const HOROLOGIUM_SITES = {
  quaranth: { x: 305, z: 245 },
  echo: { x: 305, z: 278 },
  khronaxis: { x: 305, z: 303 },
};

function makeRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}

function placeOnGround(obj, x, z) {
  obj.position.set(x, heightAt(x, z), z);
}

function makeEnemy(kind, x, z) {
  const t = ENEMY_TYPES[kind];
  const group = t.build();
  placeOnGround(group, x, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  return {
    kind, type: t,
    name: t.name, level: t.level, elite: !!t.elite, humanoid: !!t.humanoid,
    group,
    hp: t.hp, maxHp: t.hp,
    home: new THREE.Vector3(x, 0, z),
    wanderTarget: null,
    state: 'idle', stateTimer: 1 + Math.random() * 3,
    attackCd: 0, pendingHit: -1,
    anim: { moving: false, speed: 1, attackT: -1, dead: false },
    alive: true, deathT: 0, respawnTimer: 0,
    baseRotZ: 0,
    temporary: !!t.temporary,
    mechTimer: 4, summonAt: t.summons ? [...t.summons.at] : null, minions: [],
    combatT: 0,                 // accumulates while engaged; drives Khronaxis' enrage
    _shatterCount: 0,           // per-enemy shatterfloor parity counter ('auto')
    _enraged: false,            // latches the one-time enrage announce
    // Iteration E — mimic reveal state (harmless on every other enemy)
    _revealed: false,           // a reveal:true chest has sprung its trap
    _creaked: false,            // the one-time proximity creak has played
    _wantReveal: false,         // combat-hit path defers the reveal to updateEnemies
    // crowd-control state from the level-55 class skills (all transient)
    ccT: 0, rooted: false, snareT: 0, snareAmt: 0, silenceT: 0,
  };
}

export function spawnEnemies(scene) {
  const rng = makeRng(4242);
  const enemies = [];

  const tryPlace = (minD, maxD, kind, count) => {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 500) {
      const a = rng() * Math.PI * 2;
      const d = minD + rng() * (maxD - minD);
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (heightAt(x, z) > 8) continue;
      const e = makeEnemy(kind, x, z);
      enemies.push(e);
      scene.add(e.group);
      placed++;
    }
  };

  tryPlace(26, 65, 'boar', 11);
  tryPlace(62, 112, 'wolf', 8);

  // Bodo lairs at the end of the eastern path
  const bx = Math.cos(0.5) * 108, bz = Math.sin(0.5) * 108;
  const boss = makeEnemy('boss', bx, bz);
  enemies.push(boss);
  scene.add(boss.group);

  // Grimblade bandits ring their camp on the northwest ridge
  const campX = Math.cos(-2.2) * 95, campZ = Math.sin(-2.2) * 95;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const d = 9 + rng() * 9; // spaced out so careful pulls stay single
    const e = makeEnemy('bandit', campX + Math.cos(a) * d, campZ + Math.sin(a) * d);
    enemies.push(e);
    scene.add(e.group);
  }
  const king = makeEnemy('banditking', campX, campZ + 1.5);
  enemies.push(king);
  scene.add(king.group);

  // (trial bosses spawn lazily via spawnTrialBoss once the quest chain reaches them)

  // the Sunken Crypt: revenant packs, the Gravelord, and the Undying on his throne
  const cryptSpawns = [
    // entry room pair
    [272, -5], [272, 5],
    // great hall packs (kept clear of the corridor walls — aggro has no eyes)
    [297, -7], [299, -5], [302, 7], [304, 5], [309, -7], [311, -5],
    // corridor B sentry
    [322, 0],
    // throne room guard
    [331, -6], [331, 6], [338, 7],
  ];
  for (const [x, z] of cryptSpawns) {
    const e = makeEnemy('revenant', x, z);
    enemies.push(e);
    scene.add(e.group);
  }
  const ossus = makeEnemy('ossus', 305, 0);
  const vargoth = makeEnemy('vargoth', 338, 0);
  enemies.push(ossus, vargoth);
  scene.add(ossus.group, vargoth.group);
  // Iteration E: a Mimic among the corridor-B decor, off-wall, posing as loot.
  // Placed unconditionally (spawnEnemies has no game ref); the integrator removes
  // it on LOAD if secrets.mimics.crypt_b is set, but it respawns within a session
  // (default elite 45s) so counters.mimic can reach 10 for the exterminator title.
  const mimicCrypt = makeEnemy('mimic', 320, 4);
  mimicCrypt.mimicId = 'crypt_b';
  enemies.push(mimicCrypt);
  scene.add(mimicCrypt.group);

  // ---- the Ashen Highlands: wraith/hound/golem packs, the Emberlord, Pyraxis ----
  // Aggro is LOS-less pure distance AND wander offsets home by up to wanderR, so the
  // true westernmost pull point is (spawnX − wanderR − aggroRadius). Every westmost
  // spawn below keeps that ≥ ZONE_ENTER(158) with margin, so a player standing inside
  // the arch (before the zone even flips) can never get yanked into a highland mob:
  //   cinderwraith  180 − 1.5 − 14 = 164.5 ≥ 158  ✓
  //   ashhound      180 − 3   − 13 = 164   ≥ 158  ✓
  //   obsidiangolem 184 − 2   − 9  = 173   ≥ 158  ✓
  const highlandSpawns = [
    // Cinder Wraith casters (ranged) — spread so they kite singly, not bunched
    ['cinderwraith', 180, 8], ['cinderwraith', 186, -14], ['cinderwraith', 191, 20],
    // Ash Hound packs (fast) — small clusters
    ['ashhound', 180, -28], ['ashhound', 182, -26], ['ashhound', 184, -30],
    ['ashhound', 188, 64],  ['ashhound', 190, 66],  ['ashhound', 186, 62],
    // Obsidian Golems (slow tanks) — solo sentries
    ['obsidiangolem', 184, 0], ['obsidiangolem', 192, -8], ['obsidiangolem', 197, 14],
  ];
  for (const [kind, x, z] of highlandSpawns) {
    const e = makeEnemy(kind, x, z);
    enemies.push(e);
    scene.add(e.group);
  }
  const emberlord = makeEnemy('emberlord', HIGHLANDS_SITES.emberlord.x, HIGHLANDS_SITES.emberlord.z);
  const pyraxis = makeEnemy('pyraxis', HIGHLANDS_SITES.pyraxis.x, HIGHLANDS_SITES.pyraxis.z);
  enemies.push(emberlord, pyraxis);
  scene.add(emberlord.group, pyraxis.group);

  // ---- The Frostveil: serpents/stalkers/sentinels, Hrimnir on his knoll ----
  // The pocket is portal-gated (arch at (−108,18) needs pyraxis-slain or L78), so
  // eager spawning is safe and nothing here can be pulled from the valley. Arrival
  // (−263,0) clears every solo serpent's 15.5 pull reach; spawns keep ≥4u off walls.
  const frostveilSpawns = [
    // Hoarfrost Serpents — solo kiters (pull reach 15.5; arrival (−263,0) clears all ✓)
    ['hoarfrostserpent', -285,  12], ['hoarfrostserpent', -295, -18], ['hoarfrostserpent', -310, 26],
    // Frostfang Stalker 3-packs
    ['frostfangstalker', -300, -34], ['frostfangstalker', -302, -31], ['frostfangstalker', -298, -37],
    ['frostfangstalker', -326,  18], ['frostfangstalker', -328,  21], ['frostfangstalker', -324, 15],
    // Rimebound Sentinels — solo sentries on the moraine line
    ['rimeboundsentinel', -318, -8], ['rimeboundsentinel', -332, -22], ['rimeboundsentinel', -344, 6],
  ];
  for (const [kind, x, z] of frostveilSpawns) {
    const e = makeEnemy(kind, x, z);
    enemies.push(e);
    scene.add(e.group);
  }
  const hrimnir = makeEnemy('hrimnir', FROSTVEIL_SITES.hrimnir.x, FROSTVEIL_SITES.hrimnir.z);
  enemies.push(hrimnir);
  scene.add(hrimnir.group);

  // ---- The Starfall Sanctum: Astral Custodian packs, Seraphel, Noctyra ----
  // Fissure-gated (needs hrimnir-slain or L92); dungeon trash respawn 600 so cleared
  // rooms stay cleared, bosses leash 80 (whole-dungeon). Arrival (0,263) clears the
  // entry pair's 9.5 reach; every spawn keeps a ≥4u wall margin (LOS-less aggro).
  const sanctumSpawns = [
    [-6, 274], [-4, 276],                                  // entry pair
    [-7, 297], [-5, 299], [7, 302], [5, 304], [-7, 309], [-5, 311],   // mid-hall packs
    [0, 322],                                              // corridor-B sentry
    [-6, 331], [6, 331], [7, 338],                         // final-hall guard
  ];
  for (const [x, z] of sanctumSpawns) {
    const e = makeEnemy('custodian', x, z);
    enemies.push(e);
    scene.add(e.group);
  }
  const seraphel = makeEnemy('seraphel', 0, 306);
  const noctyra = makeEnemy('noctyra', 0, 338);
  enemies.push(seraphel, noctyra);
  scene.add(seraphel.group, noctyra.group);
  // Iteration E: a Mimic in the entry alcove, off-wall, posing as loot. Same
  // load-removal + in-session respawn contract as the crypt mimic.
  const mimicSanctum = makeEnemy('mimic', -4, 271);
  mimicSanctum.mimicId = 'sanctum_entry';
  enemies.push(mimicSanctum);
  scene.add(mimicSanctum.group);

  // ---- The Verdant Hollow: sporecallers/hollowstalkers/bloomwardens/swarmlings, ----
  // ---- Spireshade in the glow-pool basin, Vorthal at the spiral's center ----
  // Gated entry at z −258 needs noctyra-slain or L102, so eager spawning is safe —
  // nothing here can be pulled from elsewhere (same reasoning as the Frostveil). Every
  // spawn keeps z>-275 (off the entry line), |x|<54 (≥4u off walls), and ≥6u off the
  // boss/elite sites; small aggroRadius+wanderR prevent LOS-less chain-pulls.
  const hollowSpawns = [
    // Sporecallers (ranged) — spread so they kite singly (small wanderR already)
    ['sporecaller', -38, -288], ['sporecaller', 36, -292], ['sporecaller', -20, -318], ['sporecaller', 24, -322],
    // Hollowstalker 3-packs — kept ≥6u off the spireshade basin (-30,-300)
    ['hollowstalker', -44, -296], ['hollowstalker', -46, -299], ['hollowstalker', -42, -293],
    ['hollowstalker', 30, -312], ['hollowstalker', 28, -315], ['hollowstalker', 32, -309],
    // Bloomwardens — slow sentries, solo
    ['bloomwarden', -12, -282], ['bloomwarden', 14, -286], ['bloomwarden', 0, -326],
    // Mycelial Swarmlings — passive trash herd (aggroRadius 0)
    ['swarmling', -42, -300], ['swarmling', 40, -300], ['swarmling', -44, -318], ['swarmling', 42, -318], ['swarmling', -46, -330],
  ];
  for (const [kind, x, z] of hollowSpawns) {
    const e = makeEnemy(kind, x, z);
    enemies.push(e);
    scene.add(e.group);
  }
  const spireshadeE = makeEnemy('spireshade', HOLLOW_SITES.spireshade.x, HOLLOW_SITES.spireshade.z);
  const vorthal = makeEnemy('vorthal', HOLLOW_SITES.vorthal.x, HOLLOW_SITES.vorthal.z);
  enemies.push(spireshadeE, vorthal);
  scene.add(spireshadeE.group, vorthal.group);

  // ---- The Last Hour / the Horologium: Cogwraith/Sandflayer packs + 3 bosses ----
  // Entry portal gated (needs noctyra-slain or L112) so eager spawning is safe.
  // Dungeon trash respawn 600 (cleared rooms stay cleared), bosses leash 90.
  // The shell builds the dungeon CENTERED ON x≈305 (CX) — see HOROLOGIUM_SITES
  // note. All coords below sit on the centerline ±a few u, ≥4u off the shell's
  // wall AABBs (horologium.js WALLS), with small aggroRadius (cogwraith 8) so the
  // LOS-less aggro can't chain-pull through walls. Doors are the x∈[303,307] lane.
  const HCX = 305;
  const horologiumSpawns = [
    // Entry Antechamber (x294..316, z204..222): 2 Cogwraiths, off-wall, clear of
    // the arrival swirl at (305,210) and the door gap at z221
    ['cogwraith', HCX - 4, 221], ['cogwraith', HCX + 4, 221],
    // Corridor A (x302..308, z222..234): 3 Cogwraiths down the middle
    ['cogwraith', HCX, 225], ['cogwraith', HCX - 1.5, 229], ['cogwraith', HCX + 1.5, 232],
    // Pendulum Hall gate (just inside the south door, south of Quaranth @z245): 1 Sandflayer
    ['sandflayer', HCX, 239],
    // Corridor B (x302..308, z258..270): 2+2 Sandflayers (the sand rains heavier)
    ['sandflayer', HCX - 1.5, 261], ['sandflayer', HCX + 1.5, 263],
    ['sandflayer', HCX - 1.5, 267], ['sandflayer', HCX + 1.5, 269],
    // Final Corridor: NO trash (clean run to Khronaxis)
  ];
  for (const [kind, x, z] of horologiumSpawns) {
    const e = makeEnemy(kind, x, z);
    enemies.push(e);
    scene.add(e.group);
  }
  const quaranth = makeEnemy('quaranth', HOROLOGIUM_SITES.quaranth.x, HOROLOGIUM_SITES.quaranth.z);
  const echo = makeEnemy('echo', HOROLOGIUM_SITES.echo.x, HOROLOGIUM_SITES.echo.z);
  const khronaxis = makeEnemy('khronaxis', HOROLOGIUM_SITES.khronaxis.x, HOROLOGIUM_SITES.khronaxis.z);
  enemies.push(quaranth, echo, khronaxis);
  scene.add(quaranth.group, echo.group, khronaxis.group);

  // ---- meadow rare spawn: Thunderbristle, in the level-1 boar ring (secret) ----
  // Nudge ±3u off any high ground, mirroring the boar-scatter heightAt>8 rule.
  let tbX = 44, tbZ = 31;
  if (heightAt(tbX, tbZ) > 8) { tbX += 3; tbZ -= 3; }
  const thunderbristle = makeEnemy('thunderbristle', tbX, tbZ);
  enemies.push(thunderbristle);
  scene.add(thunderbristle.group);

  return enemies;
}

// trial bosses materialize only once the quest chain reaches them
export function spawnTrialBoss(game, kind) {
  const site = TRIAL_SITES[kind];
  const e = makeEnemy(kind, site.x, site.z);
  game.enemies.push(e);
  game.scene.add(e.group);
  return e;
}

// Grim, the Tax Collector — summoned by the Sanctum ritual (integrator calls this
// from the ritual F-handler). Spawns at the Star Cradle dais (0, 346); engages
// immediately (aggroRadius 0 would otherwise leave it passive). Re-summonable
// after kill, but never doubled while one is alive.
export function summonGrim(game) {
  const existing = game.enemies.find((e) => e.kind === 'grim' && e.alive);
  if (existing) return existing;
  const e = makeEnemy('grim', 0, 346);
  e.state = 'chase';
  game.enemies.push(e);
  game.scene.add(e.group);
  return e;
}

export function removeEnemy(game, e) {
  game.scene.remove(e.group);
  const i = game.enemies.indexOf(e);
  if (i >= 0) game.enemies.splice(i, 1);
  game.ui.removePlate(e);
  if (game.player.target === e) game.player.target = null;
}

function clearMinions(game, boss) {
  for (const m of boss.minions) removeEnemy(game, m);
  boss.minions.length = 0;
}

function summonThralls(game, boss) {
  const s = boss.type.summons;
  for (let i = 0; i < s.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = makeEnemy(
      s.kind,
      boss.group.position.x + Math.cos(a) * 4,
      boss.group.position.z + Math.sin(a) * 4
    );
    // Summoned minions are a ONE-TIME pack: mark the instance temporary so it is
    // removed on death and never respawns — even when the summon kind (e.g.
    // 'ashhound') is otherwise a normal respawning highland mob. (thrall/boneguard
    // carry temporary on the TYPE; this also covers reused-mob summons.)
    e.temporary = true;
    e.state = 'chase';
    // a summoned reveal:true minion (Grim's "collateral" mimics) is already in
    // chase, so it skips the proximity-aggro reveal — spring it open immediately.
    if (e.type.reveal) revealMimic(e, game);
    game.enemies.push(e);
    game.scene.add(e.group);
    boss.minions.push(e);
  }
  game.ui.log(`${boss.name} raises the dead!`, 'log-in');
  game.fx.burst(boss.group.position, 0xb090ff, 24);
}

export function spawnNpc(scene) {
  const group = buildHumanoid('npc');
  const x = -2.5, z = -3;
  placeOnGround(group, x, z);
  group.rotation.y = Math.PI / 4;
  group.castShadow = true;
  return {
    name: 'Pioneer Barnaby',
    group,
    anim: { moving: false, speed: 1, attackT: -1, dead: false },
  };
}

// Emberwarden Kaska guards the mountain pass, just west of the gate arch.
export function spawnGateNpc(scene) {
  const group = buildHumanoid('kaska');
  const x = HIGHLANDS.GATE_X - 5, z = 0;        // in the low pass corridor (z∈[-12,12]),
                                                // not on the z² pass wall to the north
  placeOnGround(group, x, z);
  group.rotation.y = -Math.PI / 2;              // face back down the path toward the player
  group.castShadow = true;
  return {
    name: 'Emberwarden Kaska',
    group,
    anim: { moving: false, speed: 1, attackT: -1, dead: false },
  };
}

// The two expansion questgivers: Surveyor Odda waits by the Frostveil arrival
// arch, Archivist Fenwick frets by the Sanctum fissure. Same shape as the other
// NPC factories; both clear their nearest pull (margins verified in the spec).
export function spawnExpansionNpcs(scene) {
  const odda = buildHumanoid('odda');
  placeOnGround(odda, -268, -4);
  odda.rotation.y = Math.atan2(-260 - -268, 0 - -4);   // face the arrival arch (−260,0)
  odda.castShadow = true;

  const fenwick = buildHumanoid('fenwick');
  placeOnGround(fenwick, -299, 2);
  fenwick.rotation.y = Math.atan2(-305 - -299, 8 - 2);  // face the fissure (−305,8)
  fenwick.castShadow = true;

  return {
    odda: {
      name: 'Surveyor Odda',
      group: odda,
      anim: { moving: false, speed: 1, attackT: -1, dead: false },
    },
    fenwick: {
      name: 'Archivist Fenwick',
      group: fenwick,
      anim: { moving: false, speed: 1, attackT: -1, dead: false },
    },
  };
}

// Greta Thornby, botanist-in-exile, runs the Verdant Hollow surface chain.
// She waits just off the entry-grove arch (z −258) by her first signpost,
// taking notes while the vale tries to eat her. Same factory shape as the rest.
export function spawnHollowNpc(scene) {
  const greta = buildHumanoid('greta');
  placeOnGround(greta, -6, -262);                       // beside the entry sign (0,−262), clear of the arch line
  greta.rotation.y = Math.atan2(0 - -6, -258 - -262);   // face the arrival arch (0,−258)
  greta.castShadow = true;
  return {
    greta: {
      name: 'Greta Thornby',
      group: greta,
      anim: { moving: false, speed: 1, attackT: -1, dead: false },
    },
  };
}

// Tamsin Verge, the time-broken survivor, runs the Horologium descent chain.
// She stands at the Hollow's deepest signpost (the spiral's center, 0,−332),
// which is the dungeon mouth. Same factory shape as the rest; the integrator
// attaches her .chain and pushes her into game.npcs (mirrors greta).
export function spawnHorologiumNpc(scene) {
  const tamsin = buildHumanoid('tamsin');
  placeOnGround(tamsin, 0, -332);
  tamsin.castShadow = true;
  return {
    tamsin: {
      name: 'Tamsin Verge',
      group: tamsin,
      anim: { moving: false, speed: 1, attackT: -1, dead: false },
    },
  };
}

const v1 = new THREE.Vector3();

// ---- enemy projectiles (Cinder Wraith etc.) ----
// Inverts the player projectile pattern: launched from a caster, homes the
// player's torso, routes damage through player.takeDamage (NOT applyDamage,
// which is for enemy-directed damage).
const enemyBolts = [];

function fireEnemyBolt(game, e) {
  const t = e.type;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 6, 6),
    new THREE.MeshBasicMaterial({ color: t.boltColor })
  );
  mesh.position.copy(e.group.position);
  mesh.position.y += 1.4;
  game.scene.add(mesh);
  game.audio.bolt();
  const dmg = Math.round(t.boltDmgMin + Math.random() * (t.boltDmgMax - t.boltDmgMin));
  enemyBolts.push({ mesh, source: e, dmg, speed: t.boltSpeed || 18 });
}

function updateEnemyBolts(game, dt) {
  const p = game.player;
  for (let i = enemyBolts.length - 1; i >= 0; i--) {
    const b = enemyBolts[i];
    v1.copy(p.group.position); v1.y += 1.1;
    const d = b.mesh.position.distanceTo(v1);
    if (d < 0.7 || !p.alive) {
      if (p.alive && d < 0.9) p.takeDamage(game, b.dmg, b.source);
      game.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      enemyBolts.splice(i, 1);
      continue;
    }
    v1.sub(b.mesh.position).normalize().multiplyScalar(b.speed * dt);
    b.mesh.position.add(v1);
  }
}

// ---- persistent fire patches (Pyraxis firepatch mechanic) ----
// A patch lingers `linger` seconds after its telegraph resolves, damaging
// anyone inside on a 1s tick and visibly shrinking as it burns out (the
// "arena shrinks" cue). Telegraph UX (ring/fill/banner/sfx) is the normal
// 4-part one from castMechanic; this disc is a fifth, post-telegraph visual.
const firePatches = [];

function spawnFirePatch(game, tg) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(tg.mech.radius, 32),
    new THREE.MeshBasicMaterial({
      color: tg.mech.color, transparent: true, opacity: 0.55,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(tg.x, heightAt(tg.x, tg.z) + 0.06, tg.z);
  game.scene.add(disc);
  firePatches.push({
    x: tg.x, z: tg.z, r: tg.mech.radius, disc,
    life: tg.mech.linger, tickT: 0, dmg: tg.mech.lingerDmg, source: tg.source,
  });
}

function updateFirePatches(game, dt) {
  const p = game.player;
  for (let i = firePatches.length - 1; i >= 0; i--) {
    const fp = firePatches[i];
    fp.life -= dt;
    const frac = Math.max(0, fp.life / 20);
    fp.disc.material.opacity = 0.30 + 0.25 * (0.5 + 0.5 * Math.sin(game._elapsed * 6 + fp.x));
    fp.disc.scale.setScalar(0.6 + 0.4 * frac);                 // shrinks toward 0.6× as it dies
    if (fp.life <= 0) {
      game.scene.remove(fp.disc);
      fp.disc.geometry.dispose();
      fp.disc.material.dispose();
      firePatches.splice(i, 1);
      continue;
    }
    if (!p.alive) continue;
    fp.tickT -= dt;
    if (fp.tickT <= 0) {
      fp.tickT = 1.0;                                          // 1s damage tick
      const eff = fp.r * (0.6 + 0.4 * frac);                  // match the shrunk visual
      const dist = Math.hypot(p.group.position.x - fp.x, p.group.position.z - fp.z);
      if (dist < eff) p.takeDamage(game, fp.dmg, fp.source);
    }
  }
}

// ---- telegraphed boss mechanics ----
const telegraphs = [];

// wrap an angle into [-PI, PI)
function wrapPi(a) {
  return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
}

// the live enrage multiplier for a boss instance (Khronaxis only): 1× until its
// combat timer crosses enrageAt, then enrageMult. Threads through every damage path.
function enrageMul(e) {
  return (e.type.enrageAt && e.combatT >= e.type.enrageAt) ? e.type.enrageMult : 1;
}

// tear down a telegraph's meshes (ring + fill + every per-kind extra). Used both
// on normal resolve and on the abort paths (boss death / leash mid-cast).
function disposeTelegraph(game, tg) {
  for (const m of [tg.ring, tg.fill, ...tg.extra]) {
    game.scene.remove(m);
    m.geometry.dispose();
    m.material.dispose();
  }
}

// cancel every in-flight telegraph cast by enemy `e` WITHOUT resolving it — no
// damage, no dodge credit. Called when its source dies or leashes mid-cast so a
// beam/tether/soak/shatterfloor wedge can't keep tracking the player and then
// fire (possibly enraged) up to `telegraph` seconds after the fight has ended.
export function cancelTelegraphsFor(game, e) {
  for (let i = telegraphs.length - 1; i >= 0; i--) {
    if (telegraphs[i].source !== e) continue;
    disposeTelegraph(game, telegraphs[i]);
    telegraphs.splice(i, 1);
  }
}

function castMechanic(game, e, mech) {
  const c = mech.center === 'boss' ? e.group.position : game.player.group.position;
  const x = c.x, z = c.z;
  const y = heightAt(x, z) + 0.07;
  const enraged = enrageMul(e) > 1;
  const col = enraged ? 0xff2a2a : mech.color;       // when enraged, tint every telegraph red
  const matOpts = { color: col, transparent: true, side: THREE.DoubleSide, depthWrite: false };
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(mech.radius - 0.3, mech.radius, 40),
    new THREE.MeshBasicMaterial({ ...matOpts, opacity: 0.9 })
  );
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(mech.radius, 40),
    new THREE.MeshBasicMaterial({ ...matOpts, opacity: 0.3 })
  );
  for (const m of [ring, fill]) {
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    game.scene.add(m);
  }
  fill.scale.setScalar(0.01);
  const tg = { x, z, mech, t: 0, ring, fill, source: e, extra: [] };

  // ---- per-kind geometry: beam wedge, tether anchor+chain, shatterfloor tiles ----
  if (mech.kind === 'beam') {
    // a flat angular wedge aimed where the player stood, sweeping over telegraph.
    // angle0: direction from boss to player (atan2(dx,dz), the +Z facing formula).
    tg.angle0 = Math.atan2(game.player.group.position.x - x, game.player.group.position.z - z);
    const wedge = new THREE.Mesh(
      // CircleGeometry(radius, segs, thetaStart, thetaLength) — half-arc each side of 0
      new THREE.CircleGeometry(mech.length, 24, -mech.halfArc, mech.halfArc * 2),
      new THREE.MeshBasicMaterial({ ...matOpts, opacity: 0.32 })
    );
    wedge.rotation.x = -Math.PI / 2;            // lay flat
    wedge.position.set(x, y, z);
    game.scene.add(wedge);
    tg.wedge = wedge;
    tg.extra.push(wedge);
  } else if (mech.kind === 'tether') {
    // the ring is drawn at breakDist (mech.radius). Snapshot the anchor (it does
    // NOT follow). Build a thin chain line anchor->player, updated each frame.
    tg.anchor = { x, z };
    const chain = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, depthWrite: false })
    );
    game.scene.add(chain);
    tg.chain = chain;
    tg.extra.push(chain);
  } else if (mech.kind === 'shatterfloor') {
    // a checker grid of translucent tiles over (2·radius)² centered on the boss;
    // only the tiles matching this cast's parity bit fall.
    const pb = (mech.parity === 'auto') ? (e._shatterCount++ % 2) : (mech.parity === 'odd' ? 1 : 0);
    const ox = x - mech.radius, oz = z - mech.radius;     // grid origin (SW corner)
    tg.ox = ox; tg.oz = oz; tg.tile = mech.tile; tg.parityBit = pb;
    tg.tiles = [];
    const n = Math.floor((mech.radius * 2) / mech.tile);
    const tileMat = new THREE.MeshBasicMaterial({ ...matOpts, opacity: 0.28 });
    for (let ix = 0; ix < n; ix++) {
      for (let iz = 0; iz < n; iz++) {
        if (((ix + iz) & 1) !== pb) continue;             // only the falling parity
        const t = new THREE.Mesh(new THREE.PlaneGeometry(mech.tile * 0.92, mech.tile * 0.92), tileMat);
        t.rotation.x = -Math.PI / 2;
        t.position.set(ox + ix * mech.tile + mech.tile / 2, y, oz + iz * mech.tile + mech.tile / 2);
        game.scene.add(t);
        tg.tiles.push(t);
        tg.extra.push(t);
      }
    }
  }

  telegraphs.push(tg);
  game.ui.log(`${e.name} ${mech.warn}`, 'log-in');
  game.ui.mechWarning(mech.avoid);
  // sfx: shatterfloor branches on KIND first (it uses avoid:'jump' but wants its
  // own crack); then the avoid-verb switch covers the rest.
  if (mech.kind === 'shatterfloor') game.audio.warnShatter();
  else if (mech.avoid === 'jump') game.audio.warnJump();
  else if (mech.avoid === 'dodge') game.audio.warnSweep();
  else if (mech.avoid === 'flee') game.audio.warnTether();
  else if (mech.avoid === 'in') game.audio.warnIn();   // inverted "sanctuary"/soak telegraph
  else game.audio.warnMove();
}

function updateTelegraphs(game, dt) {
  for (let i = telegraphs.length - 1; i >= 0; i--) {
    const tg = telegraphs[i];
    // Abort guard (defense in depth): if the source boss died, leashed, or is
    // otherwise no longer engaged mid-cast, cancel the telegraph instead of
    // letting it track the player and fire. killEnemy() and the leash 'return'
    // transition already cancel directly; this also covers respawn/idle resets.
    const s = tg.source;
    if (!s || !s.alive || s.state === 'return' || s.state === 'idle' ||
        s.state === 'wander' || s.state === 'dead') {
      disposeTelegraph(game, tg);
      telegraphs.splice(i, 1);
      continue;
    }
    tg.t += dt;
    tg.fill.scale.setScalar(Math.max(0.01, Math.min(1, tg.t / tg.mech.telegraph)));

    // per-frame follow during the telegraph window (mirror where fill.scale is set)
    if (tg.t < tg.mech.telegraph) {
      if (tg.mech.kind === 'beam' && tg.wedge) {
        // sweep the wedge from angle0 across `sweep` radians over the telegraph.
        // angle0 is a +Z-facing world angle (atan2(dx,dz)). For a CircleGeometry
        // centered on local +X laid flat by rotation.x=-PI/2, rotation.z = θ-PI/2
        // aims the wedge center at world angle θ (verified empirically).
        const theta = tg.angle0 + tg.mech.sweep * (tg.t / tg.mech.telegraph);
        tg.wedge.rotation.z = theta - Math.PI / 2;
      } else if (tg.mech.kind === 'tether' && tg.chain) {
        // stretch the chain segment from the fixed anchor to the live player pos
        const a = tg.anchor, pp = game.player.group.position;
        const dx = pp.x - a.x, dz = pp.z - a.z;
        const len = Math.max(0.001, Math.hypot(dx, dz));
        const y = heightAt(a.x, a.z) + 0.6;
        tg.chain.position.set(a.x + dx / 2, y, a.z + dz / 2);
        tg.chain.scale.x = len;                       // BoxGeometry base length is 1u
        tg.chain.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;  // x-axis along anchor→player
      }
      continue;
    }

    // ---- resolve: dispose ALL meshes (ring/fill + every per-kind extra) ----
    disposeTelegraph(game, tg);
    telegraphs.splice(i, 1);
    const eMul = enrageMul(tg.source);
    const burstColor = eMul > 1 ? 0xff2a2a : tg.mech.color;   // red burst when enraged
    game.fx.burst(new THREE.Vector3(tg.x, heightAt(tg.x, tg.z), tg.z), burstColor, 32);
    game.audio.bolt();

    // firepatch: drop a lingering hazard disc where the telegraph resolved (enrage
    // scales the linger tick too — stash the mult on the patch via a temp field)
    if (tg.mech.kind === 'firepatch') {
      const baseLinger = tg.mech.lingerDmg;
      if (eMul > 1) tg.mech = { ...tg.mech, lingerDmg: Math.round(baseLinger * eMul) };
      spawnFirePatch(game, tg);
    }

    const p = game.player;
    if (!p.alive) continue;
    const px = p.group.position.x, pz = p.group.position.z, py = p.group.position.y;
    const dist = Math.hypot(px - tg.x, pz - tg.z);

    // ===== new kinds (resolve BEFORE the generic dist check; mirror sanctuary) =====

    // beam: lethal angular wedge. Final center-angle aF = angle0 + sweep. Player
    // is hit if within `length` AND within halfArc of the final wedge angle.
    if (tg.mech.kind === 'beam') {
      const b = tg.source.group.position;
      const aF = tg.angle0 + tg.mech.sweep;
      const ap = Math.atan2(px - b.x, pz - b.z);
      const d = Math.hypot(px - b.x, pz - b.z);
      if (d <= tg.mech.length && Math.abs(wrapPi(ap - aF)) <= tg.mech.halfArc) {
        p.takeDamage(game, Math.round(tg.mech.dmg * eMul), tg.source);
      } else {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        game.ui.floatText(p.group.position, 'Dodged!', 'heal');
        armAvenger(game);
      }
      continue;
    }

    // soak: ALWAYS damages. Inside = dmg (+armAvenger); outside = the magnified
    // unsoaked burst (NO armAvenger — eating the full weight is the punish).
    if (tg.mech.kind === 'soak') {
      if (dist <= tg.mech.radius + 0.4) {
        p.takeDamage(game, Math.round(tg.mech.dmg * eMul), tg.source);
        game.ui.floatText(p.group.position, 'Soaked!', 'heal');
        armAvenger(game);
      } else {
        p.takeDamage(game, Math.round(tg.mech.unsoakedDmg * eMul), tg.source);
      }
      continue;
    }

    // tether: break by distance from the FIXED anchor. Break = dodge; else pull
    // back to the anchor and eat the burst. breakDist is 10 (Dash is only 8u).
    if (tg.mech.kind === 'tether') {
      const a = tg.anchor;
      const d = Math.hypot(px - a.x, pz - a.z);
      if (d > tg.mech.breakDist) {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        game.ui.floatText(p.group.position, 'Broken!', 'heal');
        armAvenger(game);
      } else {
        if (tg.mech.pullBack) placeOnGround(p.group, a.x, a.z);   // snap to anchor, on the floor
        p.takeDamage(game, Math.round(tg.mech.dmg * eMul), tg.source);
      }
      continue;
    }

    // shatterfloor: checker collapse. Hit if on a falling-parity tile within the
    // grid AND grounded; airborne OR a safe tile OR off-grid = dodge.
    if (tg.mech.kind === 'shatterfloor') {
      const b = tg.source.group.position;
      const pb = (Math.floor((px - tg.ox) / tg.tile) + Math.floor((pz - tg.oz) / tg.tile)) & 1;
      const withinGrid = Math.abs(px - b.x) <= tg.mech.radius && Math.abs(pz - b.z) <= tg.mech.radius;
      const air = py - heightAt(px, pz);
      if (withinGrid && pb === tg.parityBit && air <= 0.7) {
        p.takeDamage(game, Math.round(tg.mech.dmg * eMul), tg.source);
      } else {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        game.ui.floatText(p.group.position, 'Dodged!', 'heal');
        armAvenger(game);
      }
      continue;
    }

    // ===== existing kinds =====
    // sanctuary (avoid 'in'): the circle is the ONLY safe ground — inverted.
    // Jumping does not save you; you must consciously step into the umbra.
    if (tg.mech.kind === 'sanctuary') {
      if (dist <= tg.mech.radius + 0.4) {            // INSIDE = sheltered
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        game.ui.floatText(p.group.position, 'Sheltered!', 'heal');
        armAvenger(game);
      } else {
        p.takeDamage(game, Math.round(tg.mech.dmg * eMul), tg.source);  // outside = full burst, anywhere
      }
      continue;
    }
    if (dist > tg.mech.radius + 0.4) {
      if (tg.mech.avoid === 'move' && dist < tg.mech.radius + 6) {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        armAvenger(game);
      }
      continue;
    }
    if (tg.mech.avoid === 'jump') {
      const air = py - heightAt(px, pz);
      if (air > 0.7) {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        game.ui.floatText(p.group.position, 'Dodged!', 'heal');
        armAvenger(game);
        continue;
      }
    }
    p.takeDamage(game, Math.round(tg.mech.dmg * eMul), tg.source);
  }
}

function moveToward(e, target, speed, dt) {
  v1.set(target.x - e.group.position.x, 0, target.z - e.group.position.z);
  const dist = v1.length();
  if (dist < 0.05) return dist;
  v1.normalize();
  const step = Math.min(speed * dt, dist);
  const nx = e.group.position.x + v1.x * step;
  const nz = e.group.position.z + v1.z * step;
  e.group.position.set(nx, heightAt(nx, nz), nz);
  // beasts are modeled facing +X, humanoids facing +Z
  e.group.rotation.y = e.humanoid ? Math.atan2(v1.x, v1.z) : Math.atan2(-v1.z, v1.x);
  return dist;
}

export function updateEnemies(game, dt, elapsed) {
  const { player } = game;
  const pPos = player.group.position;
  const toRemove = [];
  game._elapsed = elapsed;     // shared clock for fire-patch pulsing

  for (const e of game.enemies) {
    const t = e.type;

    if (!e.alive) {
      e.deathT += dt;
      // fall over, then sink away
      if (e.deathT < 0.4) {
        e.group.rotation.z = (e.deathT / 0.4) * (Math.PI / 2);
      } else if (e.deathT > 3 && e.deathT < 4.4) {
        e.group.position.y -= dt * 0.9;
      } else if (e.deathT >= 4.4) {
        e.group.visible = false;
        if (e.temporary) { toRemove.push(e); continue; }
      }
      e.respawnTimer -= dt;
      if (e.respawnTimer <= 0 && !e.temporary) {
        // respawn at home
        e.alive = true;
        e.hp = e.maxHp;
        e.state = 'idle';
        e.stateTimer = 2;
        e.anim.dead = false;
        e.group.rotation.z = 0;
        e.group.visible = true;
        e.mechTimer = 4;
        e.combatT = 0;          // enrage resets on respawn too
        e._enraged = false;
        // a respawned mimic re-closes its lid so it can ambush again (the
        // in-session re-kills that let counters.mimic reach 10 for exterminator)
        if (t.reveal) {
          e._revealed = false; e._creaked = false; e._wantReveal = false;
          e.anim._revealed = false;
          const r = e.group.userData.rig;
          if (r && r.lid) r.lid.rotation.x = 0;
        }
        if (t.summons) e.summonAt = [...t.summons.at];
        placeOnGround(e.group, e.home.x, e.home.z);
      }
      continue;
    }

    const distToPlayer = e.group.position.distanceTo(pPos);
    const distToHome = v1.set(e.group.position.x - e.home.x, 0, e.group.position.z - e.home.z).length();
    e.attackCd -= dt;

    // Iteration E — mimic ambush hooks (reveal:true enemies only)
    if (t.reveal) {
      // a hit before it woke deferred its reveal to this pass (aggroEnemy has no game)
      if (e._wantReveal && !e._revealed) revealMimic(e, game);
      // proximity creak: within 5u but outside aggro range, one low wooden groan.
      // The ONLY warning — no banner — a skill check of attention.
      if (!e._creaked && !e._revealed && distToPlayer < 5 && distToPlayer >= t.aggroRadius) {
        e._creaked = true;
        game.audio.creak?.();
      }
    }

    // scheduled attack impact lands mid-animation
    if (e.pendingHit > 0) {
      e.pendingHit -= dt;
      if (e.pendingHit <= 0) {
        e.pendingHit = -1;
        if (player.alive && distToPlayer < t.attackRange + 1.2) {
          const enraged = t.enrageAt && e.combatT >= t.enrageAt;
          const dmg = Math.round((t.dmgMin + Math.random() * (t.dmgMax - t.dmgMin)) * (enraged ? t.enrageMult : 1));
          player.takeDamage(game, dmg, e);
        }
      }
    }
    // progress attack animation
    if (e.anim.attackT >= 0) {
      e.anim.attackT += dt / 0.55;
      if (e.anim.attackT >= 1) e.anim.attackT = -1;
    }

    // crowd control: tick down the timers from the level-55 class skills.
    e.ccT = Math.max(0, e.ccT - dt);
    e.snareT = Math.max(0, e.snareT - dt);
    e.silenceT = Math.max(0, e.silenceT - dt);
    if (e.ccT <= 0) e.rooted = false;
    // SIMPLIFICATION: while ccT>0 (stun OR root) we freeze BOTH movement and the
    // attack swing. Spec wants root to block movement only, but roots come only
    // from Frost Nova (2s, on trash packs you're already AoEing) and bosses are
    // ccImmune (0.5s stagger), so a unified short freeze is the pragmatic choice.
    // Keep death/respawn/animation alive so a stunned mob still reads as present.
    if (e.ccT > 0) {
      e.anim.moving = false;
      e.anim.attackT = -1;
      e.pendingHit = -1;
      if (t.reveal) animateMimic(e.group, e.anim, elapsed + e.home.x);   // chest rig (mimic is ccImmune, but keep dispatch consistent)
      else if (e.humanoid) animateHumanoid(e.group, e.anim, elapsed + e.home.x);
      else if (t.serpent) animateSerpent(e.group, e.anim, elapsed + e.home.x);
      else if (t.sporeling) animateSporeling(e.group, e.anim, elapsed + e.home.x);
      else animateBeast(e.group, e.anim, elapsed + e.home.x);
      continue;
    }

    switch (e.state) {
      case 'idle':
        e.anim.moving = false;
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          const a = Math.random() * Math.PI * 2;
          const max = t.wanderR ?? 7;
          const r = Math.min(max, 1.5 + Math.random() * max);
          e.wanderTarget = new THREE.Vector3(
            e.home.x + Math.cos(a) * r, 0, e.home.z + Math.sin(a) * r
          );
          e.state = 'wander';
        }
        break;

      case 'wander': {
        e.anim.moving = true;
        e.anim.speed = 0.55;
        const sp = t.speed * 0.45 * (e.snareT > 0 ? (1 - e.snareAmt) : 1);   // Hamstring slow
        const d = moveToward(e, e.wanderTarget, sp, dt);
        if (d < 0.3) { e.state = 'idle'; e.stateTimer = 2 + Math.random() * 4; }
        break;
      }

      case 'chase': {
        if (!player.alive) { e.state = 'return'; break; }
        if (distToHome > (t.leash ?? 32)) { e.state = 'return'; e.hp = e.maxHp; break; }
        e.anim.moving = true;
        e.anim.speed = 1;
        if (distToPlayer > t.attackRange) {
          const sp = t.speed * (e.snareT > 0 ? (1 - e.snareAmt) : 1);   // Hamstring slow
          moveToward(e, pPos, sp, dt);
        } else {
          e.state = 'attack';
        }
        break;
      }

      case 'attack': {
        if (!player.alive) { e.state = 'return'; break; }
        e.anim.moving = false;
        if (distToPlayer > t.attackRange + 0.6) { e.state = 'chase'; break; }
        // face the player
        v1.set(pPos.x - e.group.position.x, 0, pPos.z - e.group.position.z).normalize();
        e.group.rotation.y = e.humanoid ? Math.atan2(v1.x, v1.z) : Math.atan2(-v1.z, v1.x);
        if (e.attackCd <= 0) {
          e.attackCd = e.elite ? 2.2 : 1.8;
          e.anim.attackT = 0;
          if (t.ranged) fireEnemyBolt(game, e);   // lob a bolt instead of a melee swing
          else e.pendingHit = 0.28;
        }
        break;
      }

      case 'return': {
        e.anim.moving = true;
        e.anim.speed = 1;
        if (e.minions.length) clearMinions(game, e);
        // leashed/disengaged mid-cast: drop any in-flight telegraph so its wedge/
        // chain/soak/tile can't follow the player home and fire after the reset.
        cancelTelegraphsFor(game, e);
        const d = moveToward(e, e.home, t.speed * 1.2, dt);
        if (d < 0.5) {
          e.state = 'idle';
          e.stateTimer = 1;
          e.hp = e.maxHp;
          e.mechTimer = 4;
          e.combatT = 0;          // enrage resets when the fight resets (leash)
          e._enraged = false;
          if (t.summons) e.summonAt = [...t.summons.at];
        }
        break;
      }
    }

    // enrage clock: accumulate while engaged (drives Khronaxis' enrageAt timer)
    if (e.state === 'chase' || e.state === 'attack') {
      e.combatT += dt;
      // one-time announce the moment the hour runs out
      if (t.enrageAt && !e._enraged && e.combatT >= t.enrageAt) {
        e._enraged = true;
        game.ui.log(`${e.name} — the hour finally runs out.`, 'log-in');
        game.ui.mechWarning('enrage');     // unmissable center-screen banner
        game.audio.warnEnrage?.();         // distinct doom-klaxon for the one hard timer
        game.fx.burst(e.group.position, 0xff2a2a, 36);
      }
    }

    // boss mechanics fire while engaged (silence suppresses the "casting")
    if (t.mechanics && player.alive && e.silenceT <= 0 && (e.state === 'chase' || e.state === 'attack')) {
      e.mechTimer -= dt;
      if (e.mechTimer <= 0) {
        const mech = t.mechanics[Math.floor(Math.random() * t.mechanics.length)];
        castMechanic(game, e, mech);
        e.mechTimer = mech.interval;
      }
    }
    // necromancy at health thresholds
    if (e.summonAt && e.summonAt.length && e.hp / e.maxHp <= e.summonAt[0]) {
      e.summonAt.shift();
      summonThralls(game, e);
    }

    // aggressive types pull when the player wanders close
    if (
      t.aggroRadius > 0 && player.alive &&
      (e.state === 'idle' || e.state === 'wander') &&
      distToPlayer < t.aggroRadius
    ) {
      e.state = 'chase';
      if (t.reveal) {
        // the chest springs — its own log/snarl/burst, not the generic charge line
        revealMimic(e, game);
      } else {
        game.ui.log(
          e.humanoid ? `${e.name} draws steel and charges!` : `${e.name} growls and charges at you!`,
          'log-in'
        );
      }
    }

    if (t.reveal) animateMimic(e.group, e.anim, elapsed + e.home.x);   // closed chest until revealed
    else if (e.humanoid) animateHumanoid(e.group, e.anim, elapsed + e.home.x);
    else if (t.serpent) animateSerpent(e.group, e.anim, elapsed + e.home.x); // undulating beast rig
    else if (t.sporeling) animateSporeling(e.group, e.anim, elapsed + e.home.x); // glowcap caster rig
    else animateBeast(e.group, e.anim, elapsed + e.home.x); // offset so herds don't sync
  }

  for (const e of toRemove) removeEnemy(game, e);
  updateTelegraphs(game, dt);
  updateEnemyBolts(game, dt);
  updateFirePatches(game, dt);
}

// The mimic reveal: a closed chest springs its trap. Snaps the lid open via the
// rig (animateMimic honors anim._revealed), bursts, logs, snarls. Idempotent.
function revealMimic(e, game) {
  if (e._revealed) return;
  e._revealed = true;
  e._wantReveal = false;
  e.anim._revealed = true;     // animateMimic keeps the lid thrown open from here
  const r = e.group.userData.rig;
  if (r && r.lid) r.lid.rotation.x = -1.1;   // snap open this frame
  game.fx.burst(e.group.position, 0xff5a3a, 20);
  game.ui.log('The chest had TEETH.', 'log-sys');
  game.audio.snarl?.();
}

// called by combat when an enemy takes damage
export function aggroEnemy(e) {
  if (e.alive && e.state !== 'chase' && e.state !== 'attack') e.state = 'chase';
  // a reveal:true chest hit before it woke must spring — but aggroEnemy has no
  // game ref, so defer the visual reveal to the next updateEnemies pass.
  if (e.type && e.type.reveal && !e._revealed) e._wantReveal = true;
}

export function killEnemy(e, game) {
  e.alive = false;
  e.anim.dead = true;
  e.anim.moving = false;
  e.anim.attackT = -1;
  e.pendingHit = -1;
  e.deathT = 0;
  e.respawnTimer = e.type.respawn ?? (e.elite ? 45 : 14);
  e.state = 'dead';
  if (game) {
    if (e.minions.length) clearMinions(game, e);
    // cancel any in-flight telegraph this enemy was casting — a dead boss must
    // not keep tracking the player and then fire the burst on the kill itself.
    cancelTelegraphsFor(game, e);
  }
}

export function updateNpc(npc, game, elapsed) {
  animateHumanoid(npc.group, npc.anim, elapsed);
  // face the player when nearby
  const pPos = game.player.group.position;
  const d = npc.group.position.distanceTo(pPos);
  if (d < 8) {
    const dx = pPos.x - npc.group.position.x;
    const dz = pPos.z - npc.group.position.z;
    npc.group.rotation.y = Math.atan2(dx, dz);
  }
  return d;
}
