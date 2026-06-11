import * as THREE from 'three';
import { buildWorld } from './world.js';
import { buildDungeon } from './dungeon.js';
import { heightAt } from './noise.js';
import { spawnEnemies, spawnNpc, updateEnemies, updateNpc } from './entities.js';
import { createPlayer, updatePlayer, CLASSES } from './player.js';
import { castSkill, updateCombat, clickTarget, tabTarget, useRune, createFx } from './combat.js';
import { createQuests } from './quests.js';
import { createUi } from './ui.js';
import { initAudio, sfx } from './audio.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 18);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- build the world up front so it sits behind the title screen ---
const world = buildWorld(scene);
const dungeon = buildDungeon(scene);
const enemies = spawnEnemies(scene);
const npc = spawnNpc(scene);
scene.add(npc.group);

const game = {
  scene, camera, renderer, world, dungeon, enemies, npc,
  player: null,
  ui: createUi(),
  fx: createFx(scene),
  quests: createQuests(),
  audio: sfx,
  input: { keys: new Set() },
  classes: CLASSES,
  started: false,
  zone: 'world',
};

// --- zone atmosphere: golden meadow vs crypt gloom ---
function setZone(zone) {
  game.zone = zone;
  if (zone === 'crypt') {
    scene.fog.color.set(0x0a0c10);
    scene.fog.near = 8;
    scene.fog.far = 52;
    scene.background.set(0x05060a);
    world.sky.visible = false;
    world.hemi.intensity = 0.25;
    world.sunLight.intensity = 0.1;
  } else {
    scene.fog.color.set(0xc4d4e0);
    scene.fog.near = 60;
    scene.fog.far = 230;
    scene.background.set(0x9ec4e8);
    world.sky.visible = true;
    world.hemi.intensity = 0.85;
    world.sunLight.intensity = 1.6;
  }
}

function usePortal(portal) {
  const p = game.player;
  const { x, z, zone } = portal.dest;
  p.target = null;
  p.casting = null;
  game.ui.hideCastBar();
  p.group.position.set(x, heightAt(x, z), z);
  setZone(zone);
  sfx.rune();
  game.ui.log(
    zone === 'crypt'
      ? 'Cold air swallows you. The Sunken Crypt does not echo — it listens.'
      : 'Daylight. You had forgotten it had a color.',
    'log-sys'
  );
  // snap the camera so it doesn't pan across the void
  const cam = p.cam;
  camera.position.set(
    x + Math.sin(cam.yaw) * cam.dist,
    heightAt(x, z) + 4,
    z + Math.cos(cam.yaw) * cam.dist
  );
}

function nearestPortal() {
  if (!game.player) return null;
  const pos = game.player.group.position;
  for (const portal of dungeon.portals) {
    if (Math.hypot(pos.x - portal.x, pos.z - portal.z) < 4) return portal;
  }
  return null;
}
game.onCast = (i) => castSkill(game, i);
window.__game = game;

// --- save system ---
const SAVE_KEY = 'runes-of-taborea-save';

game.save = () => {
  if (!game.player) return;
  const p = game.player;
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    v: 2,
    classId: p.classId, secondaryId: p.secondaryId,
    level: p.level, xp: p.xp, gold: p.gold,
    runes: p.runes, runeBonus: p.runeBonus,
    potions: p.potions, trainDmg: p.trainDmg, trainHp: p.trainHp,
    trainCrit: p.trainCrit, boots: p.boots,
    quests: game.quests.serialize(),
  }));
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && (s.v === 1 || s.v === 2) && CLASSES[s.classId] ? s : null;
  } catch { return null; }
}

// console helper: restore a pre-save-system hero, e.g. __veteran('scout')
window.__veteran = (classId = 'warrior') => {
  if (!CLASSES[classId]) { console.warn('classes:', Object.keys(CLASSES).join(', ')); return; }
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    v: 1, classId, secondaryId: null,
    level: 10, xp: 0, gold: 400, runes: 3, runeBonus: 0,
    quests: {
      boars: { status: 'done', progress: 6 },
      wolves: { status: 'done', progress: 4 },
      boss: { status: 'done', progress: 1 },
    },
  }));
  location.reload();
};

// --- input ---
window.addEventListener('keydown', (e) => {
  if (!game.started || e.repeat) return;
  game.input.keys.add(e.code);

  if (e.code === 'Tab') { e.preventDefault(); tabTarget(game); }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= 8) castSkill(game, n - 1);
  }
  if (e.code === 'KeyR') useRune(game);
  if (e.code === 'KeyQ') game.player.usePotion(game);
  if (e.code === 'Space') { e.preventDefault(); game.player.tryJump(); }
  if (e.code === 'KeyF') {
    const portal = nearestPortal();
    if (game.player.group.position.distanceTo(npc.group.position) < 5) {
      game.quests.openDialog(game);
    } else if (portal && game.player.alive) {
      usePortal(portal);
    }
  }
  if (e.code === 'Escape') {
    if (game.ui.shopOpen()) game.ui.hideShop();
    else if (game.ui.dialogOpen()) game.ui.hideDialog();
    else game.player.target = null;
  }
});
window.addEventListener('keyup', (e) => game.input.keys.delete(e.code));
window.addEventListener('blur', () => game.input.keys.clear());

// --- mouse: drag = orbit camera, click = target ---
let dragging = false, dragMoved = 0, lastX = 0, lastY = 0;
canvas.addEventListener('mousedown', (e) => {
  dragging = true;
  dragMoved = 0;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('mousemove', (e) => {
  if (!dragging || !game.started) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  dragMoved += Math.abs(dx) + Math.abs(dy);
  lastX = e.clientX;
  lastY = e.clientY;
  if (dragMoved > 4) {
    canvas.classList.add('dragging');
    const cam = game.player.cam;
    cam.yaw -= dx * 0.008;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.005, 0.05, 1.25);
  }
});
window.addEventListener('mouseup', (e) => {
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove('dragging');
  if (dragMoved <= 4 && game.started && e.target === canvas) {
    clickTarget(game, e.clientX, e.clientY);
  }
});
canvas.addEventListener('wheel', (e) => {
  if (!game.started) return;
  const cam = game.player.cam;
  cam.dist = THREE.MathUtils.clamp(cam.dist + e.deltaY * 0.01, 4, 22);
}, { passive: true });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// --- rune pouch + potion pouch + shop + respawn buttons ---
document.getElementById('rune-pouch').addEventListener('click', () => game.started && useRune(game));
document.getElementById('potion-pouch').addEventListener('click', () => game.started && game.player.usePotion(game));
document.getElementById('shop-close').addEventListener('click', () => game.ui.hideShop());
document.getElementById('respawn-btn').addEventListener('click', () => {
  setZone('world');
  game.player.respawn(game);
});

// --- title screen / class select ---
document.querySelectorAll('#class-select .class-card').forEach((card) => {
  card.addEventListener('click', () => {
    initAudio();
    sfx.select();
    localStorage.removeItem(SAVE_KEY); // class cards always forge a new hero
    startGame(card.dataset.class, null);
  });
});

// offer Continue when a saved hero exists
{
  const saved = loadSave();
  if (saved) {
    const wrap = document.getElementById('continue-wrap');
    const btn = document.createElement('button');
    btn.className = 'btn-ornate';
    const clsName = CLASSES[saved.classId].name +
      (saved.secondaryId ? ' / ' + CLASSES[saved.secondaryId].name : '');
    btn.textContent = `Continue — Level ${saved.level} ${clsName}`;
    btn.addEventListener('click', () => {
      initAudio();
      sfx.select();
      startGame(saved.classId, saved);
    });
    const note = document.createElement('span');
    note.className = 'continue-note';
    note.textContent = 'or forge a new hero below (erases the old one)';
    wrap.append(btn, note);
  }
}

function startGame(classId, saved) {
  game.player = createPlayer(classId, scene);

  if (saved) {
    const p = game.player;
    p.level = saved.level;
    p.xp = saved.xp;
    p.gold = saved.gold;
    p.runes = saved.runes;
    p.runeBonus = saved.runeBonus;
    p.potions = saved.potions ?? 0;
    p.trainDmg = saved.trainDmg ?? 0;
    p.trainHp = saved.trainHp ?? 0;
    p.trainCrit = saved.trainCrit ?? 0;
    p.boots = saved.boots ?? false;
    if (saved.secondaryId) p.chooseSecondary(game, saved.secondaryId, true);
    p.recalcStats();
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    game.quests.load(saved.quests);
  }

  game.ui.buildActionBar(game, game.onCast);
  game.ui.refreshQuestTracker(game.quests);
  game.ui.refreshIdentity(game);
  game.started = true;

  const title = document.getElementById('title-screen');
  title.classList.add('fading');
  setTimeout(() => title.remove(), 1100);
  document.getElementById('hud').classList.remove('hidden');

  if (saved) {
    game.ui.log(`Welcome back, level ${game.player.level} ${game.player.name}.`, 'log-sys');
  } else {
    game.ui.log('Welcome to the Howling Plains, adventurer.', 'log-sys');
  }
  game.ui.log('Pioneer Barnaby at the camp has work for you. (Walk up and press F)', 'log-quest');
  game.save();

  // a returning hero past level 10 may still owe themselves a second class
  if (game.player.level >= 10 && !game.player.secondary) {
    setTimeout(() => game.ui.showSecondaryChoice(game), 1300);
  }
}

// --- title screen idle camera drift ---
let titleAngle = 0;

// --- main loop ---
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (game.started) {
    updatePlayer(game, dt, elapsed);
    updateEnemies(game, dt, elapsed);
    updateCombat(game, dt);
    world.update(dt, elapsed, game.player.group.position);

    const npcDist = updateNpc(npc, game, elapsed);
    const portal = nearestPortal();
    if (npcDist < 5 && !game.ui.dialogOpen() && game.player.alive) {
      game.ui.setInteractPrompt(true, 'Talk');
    } else if (portal && game.player.alive) {
      game.ui.setInteractPrompt(true, portal.label);
    } else {
      game.ui.setInteractPrompt(false);
    }

    dungeon.update(elapsed);
    game.fx.update(dt);
    game.ui.update(game);
  } else {
    // slow orbit around the camp behind the title screen
    titleAngle += dt * 0.04;
    camera.position.set(Math.sin(titleAngle) * 26, 12, Math.cos(titleAngle) * 26);
    camera.lookAt(0, 2, 0);
    world.update(dt, elapsed, null);
    updateNpc(npc, { player: { group: { position: camera.position } } }, elapsed);
  }

  renderer.render(scene, camera);
}
tick();
