import * as THREE from 'three';
import { buildWorld } from './world.js';
import { buildDungeon } from './dungeon.js';
import { buildHighlands } from './highlands.js';
import { heightAt, HIGHLANDS } from './noise.js';
import { spawnEnemies, spawnNpc, spawnGateNpc, updateEnemies, updateNpc, spawnTrialBoss } from './entities.js';
import { createPlayer, updatePlayer, CLASSES } from './player.js';
import { castSkill, updateCombat, clickTarget, tabTarget, useRune, createFx } from './combat.js';
import { createQuests, createHighlandQuests } from './quests.js';
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
const highlands = buildHighlands(scene);
const enemies = spawnEnemies(scene);
const npc = spawnNpc(scene);
const gateNpc = spawnGateNpc(scene);
scene.add(npc.group, gateNpc.group);

const game = {
  scene, camera, renderer, world, dungeon, highlands, enemies,
  npc, gateNpc, npcs: [npc, gateNpc],
  player: null,
  ui: createUi(),
  fx: createFx(scene),
  quests: createQuests(),
  highlandQuests: createHighlandQuests(),
  audio: sfx,
  input: { keys: new Set(), mouseForward: false },
  classes: CLASSES,
  started: false,
  zone: 'world',
  slain: new Set(),
  gates: { korgrim: false, vexnar: false, morgrath: false },
};

// --- zone atmosphere: golden meadow vs crypt gloom vs ashen highlands ---
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
  } else if (zone === 'highlands') {
    scene.fog.color.set(0x3a140c);     // smoky red-brown
    scene.fog.near = 28;
    scene.fog.far = 140;               // hazier than meadow, clearer than crypt
    scene.background.set(0x2a0e08);    // dark ember sky
    world.sky.visible = false;         // pocket-of-ash look; the lava lights carry it
    world.hemi.intensity = 0.45;
    world.hemi.color.set(0xff8050);    // warm ambient
    world.sunLight.intensity = 0.6;
    world.sunLight.color.set(0xff7a40);
  } else {
    scene.fog.color.set(0xc4d4e0);
    scene.fog.near = 60;
    scene.fog.far = 230;
    scene.background.set(0x9ec4e8);
    world.sky.visible = true;
    world.hemi.intensity = 0.85;
    world.hemi.color.set(0xbed8ff);    // RESTORE original hemi color (highlands mutates it)
    world.sunLight.intensity = 1.6;
    world.sunLight.color.set(0xffe0b0); // RESTORE original sun color
  }
}
game.setZone = setZone;

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
    // the crypt entrance only exists once the Pale King has fallen
    if (portal.dest.zone === 'crypt' && !game.quests.reached('ossus')) continue;
    if (Math.hypot(pos.x - portal.x, pos.z - portal.z) < 4) return portal;
  }
  return null;
}

// content reveals itself as the quest chain advances: each trial arena and its
// boss appear when Barnaby can offer that quest; the crypt opens after Morgrath
const GATE_FLAVOR = {
  korgrim: 'Far to the north, the earth begins to tremble…',
  vexnar: 'A winged shadow crosses the eastern rim…',
  morgrath: 'Something pale stirs among the southwestern stones…',
};
let gatesInitialized = false;
function updateGates() {
  for (const kind of ['korgrim', 'vexnar', 'morgrath']) {
    const open = game.quests.reached(kind);
    world.trialArenas[kind].visible = open;
    if (open && !game.gates[kind]) {
      game.gates[kind] = true;
      spawnTrialBoss(game, kind);
      if (gatesInitialized) game.ui.log(GATE_FLAVOR[kind], 'log-quest');
    }
  }
  const cryptOpen = game.quests.reached('ossus');
  if (cryptOpen && !dungeon.entrance.visible && gatesInitialized) {
    game.ui.log('Northwest of camp, an ancient archway grinds open…', 'log-quest');
  }
  dungeon.entrance.visible = cryptOpen;
  gatesInitialized = true;
}
game.onCast = (i) => castSkill(game, i);
window.__game = game;

// --- save system ---
const SAVE_KEY = 'runes-of-taborea-save';

// Cross-tab guard: localStorage is one slot, so the last tab to save wins.
// With two game tabs open, a stale tab autosaving (any kill/equip/XP) silently
// clobbers the other's progress — "I swapped gear and got the old set back".
// The storage event fires only in OTHER tabs, so: once anyone else writes the
// save, this tab is stale and stops saving until reloaded.
let saveBlocked = false;
window.addEventListener('storage', (e) => {
  if (e.key !== SAVE_KEY && e.key !== null) return;   // null = storage.clear()
  if (!game.started || saveBlocked) return;
  saveBlocked = true;
  game.ui.log('Your hero was saved from another tab — autosave here is off to protect that progress. Reload this tab to keep playing.', 'log-sys');
});

game.save = () => {
  if (!game.player || saveBlocked) return;
  const p = game.player;
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    v: 3,
    classId: p.classId, secondaryId: p.secondaryId,
    level: p.level, xp: p.xp, gold: p.gold,
    runes: p.runes, runeBonus: p.runeBonus,
    potions: p.potions, trainDmg: p.trainDmg, trainHp: p.trainHp,
    trainCrit: p.trainCrit, boots: p.boots,
    inventory: p.inventory,
    equipped: p.equipped,
    talents: p.talents,
    spent: p.talentSpent(),     // derived; written for forward-compat, recomputed on load
    slain: [...game.slain],
    quests: game.quests.serialize(),
    highlandQuests: game.highlandQuests.serialize(),
  }));
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && (s.v === 1 || s.v === 2 || s.v === 3) && CLASSES[s.classId] ? s : null;
  } catch { return null; }
}

// console helper: restore a pre-save-system hero, e.g. __veteran('scout')
window.__veteran = (classId = 'warrior') => {
  if (!CLASSES[classId]) { console.warn('classes:', Object.keys(CLASSES).join(', ')); return; }
  // writes a v:1 stub; inventory/equipped default-fill on load
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
    if (n >= 1 && n <= 9) castSkill(game, n - 1);   // 1–9 -> indices 0–8
    else if (n === 0) castSkill(game, 9);           // 0 -> index 9
  }
  if (e.code === 'Minus') castSkill(game, 10);       // - -> 11th slot (3rd capstone)
  if (e.code === 'KeyR') useRune(game);
  if (e.code === 'KeyQ') game.player.usePotion(game);
  if (e.code === 'KeyI') game.ui.toggleInventory(game);
  if (e.code === 'KeyC') game.ui.toggleCharSheet(game);
  if (e.code === 'KeyT') game.ui.toggleTalents(game);
  if (e.code === 'Space') { e.preventDefault(); game.player.tryJump(); }
  if (e.code === 'KeyF') {
    const p = game.player.group.position;
    const dNpc = p.distanceTo(npc.group.position);
    const dGate = p.distanceTo(gateNpc.group.position);
    if (dNpc < 5 && dNpc <= dGate) {
      game.quests.openDialog(game);              // Barnaby
    } else if (dGate < 5) {
      game.highlandQuests.openDialog(game);      // Emberwarden Kaska
    } else {
      const portal = nearestPortal();            // crypt is still a walk-in/portal pocket
      if (portal && game.player.alive) usePortal(portal);
    }
  }
  if (e.code === 'Escape') {
    if (game.ui.shopOpen()) game.ui.hideShop();
    else if (game.ui.inventoryOpen()) game.ui.hideInventory();
    else if (game.ui.talentOpen()) game.ui.hideTalents();
    else if (game.ui.charOpen()) game.ui.hideCharSheet();
    else if (game.ui.dialogOpen()) game.ui.hideDialog();
    else game.player.target = null;
  }
});
window.addEventListener('keyup', (e) => game.input.keys.delete(e.code));
window.addEventListener('blur', () => game.input.keys.clear());

// --- mouse: drag = orbit camera, click = target, both buttons = run ---
let dragging = false, dragMoved = 0, lastX = 0, lastY = 0;
const mouseButtons = new Set();
canvas.addEventListener('mousedown', (e) => {
  mouseButtons.add(e.button);
  game.input.mouseForward = mouseButtons.has(0) && mouseButtons.has(2);
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
  const wasMouseRun = game.input.mouseForward;
  mouseButtons.delete(e.button);
  game.input.mouseForward = mouseButtons.has(0) && mouseButtons.has(2);
  if (mouseButtons.size > 0) return; // still steering with the other button
  dragging = false;
  canvas.classList.remove('dragging');
  if (dragMoved <= 4 && game.started && e.target === canvas && !wasMouseRun) {
    clickTarget(game, e.clientX, e.clientY);
  }
});
window.addEventListener('blur', () => {
  mouseButtons.clear();
  game.input.mouseForward = false;
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
document.getElementById('inv-close').addEventListener('click', () => game.ui.hideInventory());
document.getElementById('inv-tab-bag').addEventListener('click', () => { game.ui._invTab = 'bag'; game.ui.renderInventory(game); });
document.getElementById('inv-tab-sell').addEventListener('click', () => { game.ui._invTab = 'sell'; game.ui.renderInventory(game); });
document.getElementById('player-frame').addEventListener('click', () => game.started && game.ui.toggleCharSheet(game));
document.getElementById('char-close').addEventListener('click', () => game.ui.hideCharSheet());
document.getElementById('talent-badge').addEventListener('click', () => game.started && game.ui.toggleTalents(game));
document.getElementById('talent-close').addEventListener('click', () => game.ui.hideTalents());
document.getElementById('talent-respec').addEventListener('click', () => { game.ui.hideTalents(); game.ui.showShop(game); });
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
    p.inventory = saved.inventory ?? [];
    p.equipped = saved.equipped ?? { weapon: null, armor: null, trinket: null };
    // migrate partial equipped (v2/old v3) so all three keys exist:
    p.equipped.weapon ??= null; p.equipped.armor ??= null; p.equipped.trinket ??= null;
    // talents: default-fill on any save lacking them (v1/v2/old-v3); ignore stored `spent` (recomputed)
    p.talents = saved.talents ?? { onslaught: 0, bulwark: 0, pathfinder: 0 };
    p.talents.onslaught ??= 0; p.talents.bulwark ??= 0; p.talents.pathfinder ??= 0;
    if (saved.secondaryId) p.chooseSecondary(game, saved.secondaryId, true);
    p.recalcStats();
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    game.quests.load(saved.quests);
    game.highlandQuests.load(saved.highlandQuests);   // no-ops on undefined (old saves)
    game.slain = new Set(saved.slain ?? []);
  }

  game.ui.buildActionBar(game, game.onCast);
  game.ui.refreshQuestTracker(game.quests);
  game.ui.refreshIdentity(game);
  game.ui.refreshTalentBadge(game);     // show/populate the talent badge
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
    updateGates();
    updatePlayer(game, dt, elapsed);
    updateEnemies(game, dt, elapsed);
    updateCombat(game, dt);
    world.update(dt, elapsed, game.player.group.position);
    highlands.update(elapsed);

    const npcDist = updateNpc(npc, game, elapsed);
    const gateDist = updateNpc(gateNpc, game, elapsed);
    const portal = nearestPortal();
    const p = game.player.group.position;
    const nearSign = p.distanceTo(highlands.signPos) < 6 && p.x < HIGHLANDS.GATE_X;

    if (game.player.alive && (npcDist < 5 || gateDist < 5) && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, 'Talk');
    } else if (nearSign && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, 'The Ashen Highlands — recommended level 55+');
    } else if (portal && game.player.alive) {
      game.ui.setInteractPrompt(true, portal.label);
    } else {
      game.ui.setInteractPrompt(false);
    }

    // one-time scorched-signpost flavor as the player first nears the pass
    if (!game._sawHighlandSign && game.player.alive &&
        p.distanceTo(highlands.gatePos) < 10) {
      game._sawHighlandSign = true;
      game.ui.log('A scorched signpost: "AHEAD — THE ASHEN HIGHLANDS. Cinders, wyrms, and worse. Turn back unless you have seen fifty-five summers (level 55)."', 'log-quest');
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
    highlands.update(elapsed);
    const fakeGame = { player: { group: { position: camera.position } } };
    updateNpc(npc, fakeGame, elapsed);
    updateNpc(gateNpc, fakeGame, elapsed);
  }

  renderer.render(scene, camera);
}
tick();
