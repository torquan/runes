import * as THREE from 'three';
import { heightAt } from './noise.js';
import { buildBoar, buildWolf, buildHumanoid, buildDragon, animateBeast, animateHumanoid } from './characters.js';

const ENEMY_TYPES = {
  boar: {
    name: 'Young Boar', level: 1, hp: 60, dmgMin: 3, dmgMax: 7, xp: 28,
    speed: 3.2, aggroRadius: 0, attackRange: 1.7, gold: [1, 4], build: () => buildBoar(false),
  },
  wolf: {
    name: 'Forest Wolf', level: 3, hp: 120, dmgMin: 7, dmgMax: 12, xp: 60,
    speed: 4.6, aggroRadius: 11, attackRange: 1.8, gold: [3, 8], build: () => buildWolf(),
  },
  boss: {
    name: 'Bodo the Ravager', level: 5, hp: 520, dmgMin: 13, dmgMax: 20, xp: 320,
    speed: 4.0, aggroRadius: 14, attackRange: 3.2, gold: [40, 60], build: () => buildBoar(true),
    elite: true,
  },
  bandit: {
    name: 'Grimblade Bandit', level: 8, hp: 300, dmgMin: 14, dmgMax: 20, xp: 140,
    speed: 5.2, aggroRadius: 10, attackRange: 2.2, gold: [8, 15],
    build: () => buildHumanoid('bandit'), humanoid: true,
  },
  banditking: {
    name: 'Rurik the Red', level: 12, hp: 1600, dmgMin: 24, dmgMax: 34, xp: 850,
    speed: 4.6, aggroRadius: 13, attackRange: 2.9, gold: [80, 120],
    build: () => { const g = buildHumanoid('banditking'); g.scale.setScalar(1.35); return g; },
    humanoid: true, elite: true,
  },
  // ---- the Trials: endgame bosses with mechanics ----
  korgrim: {
    name: 'Korgrim the Mountain', level: 35, hp: 28000, dmgMin: 150, dmgMax: 210, xp: 5000,
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
    name: 'Vexnar the Ash Dragon', level: 45, hp: 45000, dmgMin: 190, dmgMax: 260, xp: 9000,
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
    name: 'Morgrath, the Pale King', level: 58, hp: 70000, dmgMin: 230, dmgMax: 310, xp: 15000,
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
    name: 'Risen Thrall', level: 35, hp: 1400, dmgMin: 90, dmgMax: 130, xp: 350,
    speed: 5.6, aggroRadius: 40, attackRange: 2.2, gold: [20, 40],
    build: () => buildHumanoid('thrall'),
    humanoid: true, temporary: true,
  },
  // ---- the Sunken Crypt ----
  revenant: {
    name: 'Crypt Revenant', level: 65, hp: 6000, dmgMin: 280, dmgMax: 380, xp: 800,
    speed: 5.8, aggroRadius: 8, attackRange: 2.4, gold: [60, 120], respawn: 600, wanderR: 1.5,
    build: () => buildHumanoid('revenant'),
    humanoid: true,
  },
  ossus: {
    name: 'Gravelord Ossus', level: 80, hp: 80000, dmgMin: 380, dmgMax: 480, xp: 25000,
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
    name: 'Vargoth the Undying', level: 90, hp: 140000, dmgMin: 450, dmgMax: 580, xp: 50000,
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
    name: 'Boneguard', level: 75, hp: 8000, dmgMin: 300, dmgMax: 400, xp: 1200,
    speed: 5.8, aggroRadius: 50, attackRange: 2.4, gold: [80, 150],
    build: () => buildHumanoid('boneguard'),
    humanoid: true, temporary: true,
  },
};

export const TRIAL_SITES = {
  korgrim: { x: 0, z: -125 },
  vexnar: { x: 125, z: 55 },
  morgrath: { x: -105, z: 95 },
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

  // the Trials wait at the valley's edges
  for (const [kind, site] of Object.entries(TRIAL_SITES)) {
    const e = makeEnemy(kind, site.x, site.z);
    enemies.push(e);
    scene.add(e.group);
  }

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

  return enemies;
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

const v1 = new THREE.Vector3();

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
          e.pendingHit = 0.28;
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
