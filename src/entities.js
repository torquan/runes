import * as THREE from 'three';
import { heightAt, HIGHLANDS } from './noise.js';
import { buildBoar, buildWolf, buildHumanoid, buildDragon, animateBeast, animateHumanoid } from './characters.js';

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
    elite: true,
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
    humanoid: true, elite: true,
  },
  // ---- the Trials: endgame bosses with mechanics ----
  korgrim: {
    name: 'Korgrim the Mountain', level: 25, hp: 24000, dmgMin: 150, dmgMax: 210, xp: 600,
    speed: 3.6, aggroRadius: 13, attackRange: 4.2, gold: [600, 900], respawn: 120, leash: 50,
    build: () => { const g = buildHumanoid('giant'); g.scale.setScalar(2.7); return g; },
    humanoid: true, elite: true,
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
    elite: true,
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
    humanoid: true, elite: true,
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
    humanoid: true, elite: true,
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
    humanoid: true, elite: true,
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
    humanoid: true, elite: true,
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
    elite: true,
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

function castMechanic(game, e, mech) {
  const c = mech.center === 'boss' ? e.group.position : game.player.group.position;
  const x = c.x, z = c.z;
  const y = heightAt(x, z) + 0.07;
  const matOpts = { color: mech.color, transparent: true, side: THREE.DoubleSide, depthWrite: false };
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
  telegraphs.push({ x, z, mech, t: 0, ring, fill, source: e });
  game.ui.log(`${e.name} ${mech.warn}`, 'log-in');
  game.ui.mechWarning(mech.avoid);
  if (mech.avoid === 'jump') game.audio.warnJump();
  else game.audio.warnMove();
}

function updateTelegraphs(game, dt) {
  for (let i = telegraphs.length - 1; i >= 0; i--) {
    const tg = telegraphs[i];
    tg.t += dt;
    tg.fill.scale.setScalar(Math.max(0.01, Math.min(1, tg.t / tg.mech.telegraph)));
    if (tg.t < tg.mech.telegraph) continue;

    for (const m of [tg.ring, tg.fill]) {
      game.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
    telegraphs.splice(i, 1);
    game.fx.burst(new THREE.Vector3(tg.x, heightAt(tg.x, tg.z), tg.z), tg.mech.color, 32);
    game.audio.bolt();

    // firepatch: drop a lingering hazard disc where the telegraph resolved
    if (tg.mech.kind === 'firepatch') spawnFirePatch(game, tg);

    const p = game.player;
    if (!p.alive) continue;
    const dist = Math.hypot(p.group.position.x - tg.x, p.group.position.z - tg.z);
    if (dist > tg.mech.radius + 0.4) {
      if (tg.mech.avoid === 'move' && dist < tg.mech.radius + 6) {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
      }
      continue;
    }
    if (tg.mech.avoid === 'jump') {
      const air = p.group.position.y - heightAt(p.group.position.x, p.group.position.z);
      if (air > 0.7) {
        game.ui.log(tg.mech.dodgeMsg, 'log-sys');
        game.ui.floatText(p.group.position, 'Dodged!', 'heal');
        continue;
      }
    }
    p.takeDamage(game, tg.mech.dmg, tg.source);
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
        if (t.summons) e.summonAt = [...t.summons.at];
        placeOnGround(e.group, e.home.x, e.home.z);
      }
      continue;
    }

    const distToPlayer = e.group.position.distanceTo(pPos);
    const distToHome = v1.set(e.group.position.x - e.home.x, 0, e.group.position.z - e.home.z).length();
    e.attackCd -= dt;

    // scheduled attack impact lands mid-animation
    if (e.pendingHit > 0) {
      e.pendingHit -= dt;
      if (e.pendingHit <= 0) {
        e.pendingHit = -1;
        if (player.alive && distToPlayer < t.attackRange + 1.2) {
          const dmg = Math.round(t.dmgMin + Math.random() * (t.dmgMax - t.dmgMin));
          player.takeDamage(game, dmg, e);
        }
      }
    }
    // progress attack animation
    if (e.anim.attackT >= 0) {
      e.anim.attackT += dt / 0.55;
      if (e.anim.attackT >= 1) e.anim.attackT = -1;
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
        const d = moveToward(e, e.wanderTarget, t.speed * 0.45, dt);
        if (d < 0.3) { e.state = 'idle'; e.stateTimer = 2 + Math.random() * 4; }
        break;
      }

      case 'chase': {
        if (!player.alive) { e.state = 'return'; break; }
        if (distToHome > (t.leash ?? 32)) { e.state = 'return'; e.hp = e.maxHp; break; }
        e.anim.moving = true;
        e.anim.speed = 1;
        if (distToPlayer > t.attackRange) {
          moveToward(e, pPos, t.speed, dt);
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
        const d = moveToward(e, e.home, t.speed * 1.2, dt);
        if (d < 0.5) {
          e.state = 'idle';
          e.stateTimer = 1;
          e.hp = e.maxHp;
          e.mechTimer = 4;
          if (t.summons) e.summonAt = [...t.summons.at];
        }
        break;
      }
    }

    // boss mechanics fire while engaged
    if (t.mechanics && player.alive && (e.state === 'chase' || e.state === 'attack')) {
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
      game.ui.log(
        e.humanoid ? `${e.name} draws steel and charges!` : `${e.name} growls and charges at you!`,
        'log-in'
      );
    }

    if (e.humanoid) animateHumanoid(e.group, e.anim, elapsed + e.home.x);
    else animateBeast(e.group, e.anim, elapsed + e.home.x); // offset so herds don't sync
  }

  for (const e of toRemove) removeEnemy(game, e);
  updateTelegraphs(game, dt);
  updateEnemyBolts(game, dt);
  updateFirePatches(game, dt);
}

// called by combat when an enemy takes damage
export function aggroEnemy(e) {
  if (e.alive && e.state !== 'chase' && e.state !== 'attack') e.state = 'chase';
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
  if (game && e.minions.length) clearMinions(game, e);
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
