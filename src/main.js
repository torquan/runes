import * as THREE from 'three';
import { buildWorld } from './world.js';
import { buildDungeon } from './dungeon.js';
import { buildHighlands } from './highlands.js';
import { buildFrostveil } from './frostveil.js';
import { buildSanctum } from './sanctum.js';
import { buildHollow } from './hollow.js';
import { buildHorologium } from './horologium.js';
import { buildLarder } from './larder.js';
import { buildGathering, gatherNode } from './gathering.js';
import { heightAt, HIGHLANDS } from './noise.js';
import { spawnEnemies, spawnNpc, spawnGateNpc, spawnExpansionNpcs, spawnHollowNpc, spawnHorologiumNpc, updateEnemies, updateNpc, spawnTrialBoss, summonGrim, removeEnemy } from './entities.js';
import { createPlayer, updatePlayer, CLASSES } from './player.js';
import { freshTalents, sanitizeTalents } from './talents.js';
import { castSkill, updateCombat, clickTarget, tabTarget, useRune, createFx } from './combat.js';
import { createQuests, createHighlandQuests, createFrostveilQuests, createSanctumQuests, createHollowQuests, createHorologiumQuests } from './quests.js';
import { makeUnique, makeGenerated, rollUid, ALL_SLOTS } from './items.js';
import { buildHumanoid } from './characters.js';
import { createUi } from './ui.js';
import { checkAchievements } from './achievements.js';
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
const frostveil = buildFrostveil(scene);
const sanctum = buildSanctum(scene);
const hollow = buildHollow(scene);
const horologium = buildHorologium(scene);
const larder = buildLarder(scene);
const gathering = buildGathering(scene);
const enemies = spawnEnemies(scene);
const npc = spawnNpc(scene);
const gateNpc = spawnGateNpc(scene);
const { odda, fenwick } = spawnExpansionNpcs(scene);
const { greta } = spawnHollowNpc(scene);
const { tamsin } = spawnHorologiumNpc(scene);
// Hermit Madge — no chain, no marker; just a sock and three riddles
const madge = {
  name: 'Hermit Madge',
  group: buildHumanoid('npc'),
  anim: { moving: false, speed: 1, attackT: -1, dead: false },
};
madge.group.position.copy(world.madgePos);
madge.group.rotation.y = 0.9;
// Smith Halla — the bench. No chain (like Madge); F near her opens the craft panel.
// Pioneer camp, opposite Barnaby(-2.5,-3) so the two questgivers don't crowd.
const halla = {
  name: 'Smith Halla',
  group: buildHumanoid('smith'),
  anim: { moving: false, speed: 1, attackT: -1, dead: false },
  chain: null,
};
halla.group.position.set(2.5, heightAt(2.5, -3), -3);
halla.group.rotation.y = -Math.PI / 4;
scene.add(npc.group, gateNpc.group, odda.group, fenwick.group, greta.group, tamsin.group, madge.group, halla.group);

const game = {
  scene, camera, renderer, world, dungeon, highlands, frostveil, sanctum, hollow, horologium, larder, gathering, enemies,
  npc, gateNpc, npcs: [npc, gateNpc, odda, fenwick, greta, tamsin, madge, halla],
  player: null,
  ui: createUi(),
  fx: createFx(scene),
  quests: createQuests(),
  highlandQuests: createHighlandQuests(),
  frostveilQuests: createFrostveilQuests(),
  sanctumQuests: createSanctumQuests(),
  hollowQuests: createHollowQuests(),
  horologiumQuests: createHorologiumQuests(),
  audio: sfx,
  input: { keys: new Set(), mouseForward: false },
  classes: CLASSES,
  started: false,
  zone: 'world',
  slain: new Set(),
  gates: { korgrim: false, vexnar: false, morgrath: false },
};
// each questgiver carries its chain (nameplate markers + the F dispatch)
npc.chain = game.quests;
gateNpc.chain = game.highlandQuests;
odda.chain = game.frostveilQuests;
fenwick.chain = game.sanctumQuests;
greta.chain = game.hollowQuests;
tamsin.chain = game.horologiumQuests;

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
  } else if (zone === 'frostveil') {
    scene.fog.color.set(0x121d33);     // polar night under the aurora
    scene.fog.near = 20;
    scene.fog.far = 95;
    scene.background.set(0x0a1124);
    world.sky.visible = false;         // fog + aurora ribbons are the sky
    world.hemi.intensity = 0.35;
    world.hemi.color.set(0x8fb0d8);
    world.sunLight.intensity = 0.25;   // moonlight
    world.sunLight.color.set(0xaac4e8);
  } else if (zone === 'sanctum') {
    scene.fog.color.set(0x0d0a1c);     // drowned astral observatory
    scene.fog.near = 8;
    scene.fog.far = 60;
    scene.background.set(0x060414);
    world.sky.visible = false;
    world.hemi.intensity = 0.25;
    world.hemi.color.set(0x9a96c8);
    world.sunLight.intensity = 0.1;
    world.sunLight.color.set(0xcfe8ff);
  } else if (zone === 'hollow') {
    scene.fog.color.set(0x18301c);     // dense, close, warm-green grotto haze
    scene.fog.near = 12;
    scene.fog.far = 95;
    scene.background.set(0x05080a);    // olive→near-black dome, no sun disc
    world.sky.visible = false;         // a low rock dome; the placed lights + emissive ground carry it
    world.hemi.intensity = 0.3;
    world.hemi.color.set(0x6fbf80);    // green-lit from below by the flora
    world.sunLight.intensity = 0.08;   // no sun reaches the Hollow
    world.sunLight.color.set(0xbfffd0);
  } else if (zone === 'horologium') {
    scene.fog.color.set(0x0a0e1c);     // cold-blue clockwork tomb under the world
    scene.fog.near = 8;
    scene.fog.far = 56;
    scene.background.set(0x05070f);
    world.sky.visible = false;         // a sealed vault; the brass-gold + cold-blue point lights carry it
    world.hemi.intensity = 0.25;
    world.hemi.color.set(0x9ab0c8);
    world.sunLight.intensity = 0.1;
    world.sunLight.color.set(0xcfe8ff);
  } else if (zone === 'larder') {
    scene.fog.color.set(0x1a1208);     // dim amber root-cellar, buried under the SW corner
    scene.fog.near = 6;
    scene.fog.far = 30;
    scene.background.set(0x0d0905);
    world.sky.visible = false;         // a buried cellar; the lone amber PointLight carries it
    world.hemi.intensity = 0.3;
    world.hemi.color.set(0xb08850);    // warm amber wash
    world.sunLight.intensity = 0.06;   // no sun reaches the Larder
    world.sunLight.color.set(0xffd9a0);
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
    portal.arriveMsg ?? (
      zone === 'crypt'
        ? 'Cold air swallows you. The Sunken Crypt does not echo — it listens.'
        : 'Daylight. You had forgotten it had a color.'),
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

// every zone module may expose portals: [{x, z, label, dest, gate?, arriveMsg?}]
function allPortals() {
  const list = [...dungeon.portals];
  if (game.frostveil) list.push(...game.frostveil.portals);
  if (game.sanctum) list.push(...game.sanctum.portals);
  if (game.hollow) list.push(...game.hollow.portals);
  if (game.horologium) list.push(...game.horologium.portals);
  // the Larder exit is always live; the Frostveil->Larder ENTRY portal stays
  // off every map until the knock puzzle sets secrets.pocket.larderOpen (§E.1).
  if (game.larder) list.push(...game.larder.portals);
  if (game.frostveil && game.player?.secrets?.pocket?.larderOpen) list.push(game.frostveil.larderPortal);
  return list;
}

// nearest non-depleted gather node within 3.5u (F-gather + tick interact prompt)
function nearestNode() {
  if (!game.player) return null;
  const pos = game.player.group.position;
  let best = null, bestD = 3.5;
  for (const n of game.gathering.nodes) {
    if (n.depleted) continue;
    const d = Math.hypot(pos.x - n.group.position.x, pos.z - n.group.position.z);
    if (d < bestD) { best = n; bestD = d; }
  }
  return best;
}

function nearestPortal() {
  if (!game.player) return null;
  const pos = game.player.group.position;
  for (const portal of allPortals()) {
    // the crypt entrance only exists once the Pale King has fallen
    if (portal.dest.zone === 'crypt' && !game.quests.reached('ossus')) continue;
    if (portal.gate && !portal.gate(game)) continue;
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

// level-55 control-skill learn toasts (§C.4)
const LEARN_TOAST = {
  warrior: "You've learned Shield Bash. Some conversations end with a guard to the teeth.",
  scout: "You've learned Hamstring Shot. Let them run. Slower.",
  mage: "You've learned Frost Nova. Now they can watch.",
  priest: "You've learned Word of Stillness. The old quiet has a name, and you can say it now.",
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

// ===== secrets: Vargoth's hoard, Madge's riddles, the Stillest Pond, the Festival =====

function openVault() {
  const p = game.player;
  if (p.secrets.vault || !p.alive) return;
  p.secrets.vault = true;
  dungeon.openChest();
  sfx.loot();
  game.fx.burst(p.group.position, 0xffd76e, 30);
  p.gainGold(game, 25000);
  p.runes += 5;
  p.addItem(game, makeUnique('vargoth_vault'));
  game.ui.log("Vargoth's hoard: a king's gold, five runes, and a spare crown. He had spares. Of course he had spares.", 'log-loot-legendary');
  game.save();
  checkAchievements(game);   // instant feedback (hoardfinder)
}

// --- Hermit Madge: three riddles, one pebble ---
const RIDDLES = [
  { q: 'No legs, but it outruns every hero. No mouth, but every camp in Taborea feeds it nightly. What is it?',
    options: ['A fire', 'A wolf', 'A river'], answer: 0 },
  { q: 'The more of it you take, the more you leave behind.',
    options: ['Gold', 'Footsteps', 'Potions'], answer: 1 },
  { q: 'Every hero in this valley has killed it a hundred times, and it has never once died.',
    options: ['A boar', 'Vargoth', 'Time'], answer: 0 },
  // §E.5 — riddle #4 is the Grim ritual-order hint (dim -> bright -> flicker)
  { q: 'Three debts hang in the sanctum sky. You must pay the dim one first, the bright one second, and the one that cannot make up its mind, last. In what order do you press them?',
    options: ['Dim, bright, flickering', 'Bright, dim, flickering', 'Flickering, dim, bright'], answer: 0 },
  { q: 'It is opened a thousand times by every hero and has nothing inside but, once, has everything inside but you. What is it?',
    options: ['A door', 'A chest', 'A hand'], answer: 1 },   // the Mimic joke
  { q: 'A badger buried it, the aurora hides it, and three knocks wake it. I have never been down there. Would YOU knock on a thing that knocks back?',
    options: ['Yes, obviously', 'Three times, then wait', 'Never'], answer: 1 },   // the Larder hint
];

// Smith Halla's bench — log her introduction the first time, then open the panel.
function openCraftBench() {
  if (!game._metHalla) {
    game._metHalla = true;
    game.ui.log("Halla: \"Halla. I shoe boars and bend bad iron straight. Bring me what the world's lying around and I'll make it worth carrying.\"", 'log-quest');
  }
  game.ui.toggleCraft(game);
}

function openMadgeDialog() {
  const ui = game.ui;
  const s = game.player.secrets;
  if (s.riddles >= 6) {
    ui.showDialog({
      title: 'Hermit Madge',
      text: 'The pebble knows the way home. So do you. Off with you — the sock and I are at a delicate juncture.',
      buttons: [{ label: 'Farewell', action: () => ui.hideDialog() }],
    });
    return;
  }
  const r = RIDDLES[s.riddles];
  const lead = s.riddles === 0
    ? 'Forty years I have knitted this sock, and you are the first to climb all the way up here. Heroes. Always climbing. Well then — earn the view. '
    : s.riddles === 3
      ? "You've a knack for this. Here's one that's actually useful, which I resent. "
      : 'Another, then. ';
  ui.showDialog({
    title: 'Hermit Madge',
    text: lead + r.q,
    buttons: [
      ...r.options.map((label, i) => ({
        label,
        action: () => {
          if (i !== r.answer) {
            ui.showDialog({
              title: 'Hermit Madge',
              text: 'No. Sit with it. The sock and I have all day.',
              buttons: [
                { label: 'Think again', primary: true, action: () => openMadgeDialog() },
                { label: 'Leave', action: () => ui.hideDialog() },
              ],
            });
            return;
          }
          s.riddles++;
          sfx.quest();
          const p = game.player;
          if (s.riddles === 3) {
            // the pebble pays at exactly riddle 3 (the original cap), +5 runes
            p.runes += 5;
            p.addItem(game, makeUnique('madge'));
            ui.log('Madge: "Aye. They come back. They ALWAYS come back. Why do you think I live up here?"', 'log-quest');
            ui.log("Madge presses a perfectly ordinary pebble into your hand. (+5 runes, Madge's Lucky Pebble)", 'log-loot-legendary');
            game.fx.burst(p.group.position, 0xffd76e, 26);
            ui.log('Madge nods slowly, needles never stopping.', 'log-quest');
            game.save();
            checkAchievements(game);
            openMadgeDialog();   // straight on to the §E riddles (lead-in handles #4)
          } else if (s.riddles === 6) {
            // the sixth riddle: +5 runes and the 'Madge-Approved' title
            p.runes += 5;
            p.title = 'Madge-Approved';
            if (!p.titles.includes('Madge-Approved')) p.titles.push('Madge-Approved');
            ui.hideDialog();
            ui.log('Madge: "Six. SIX. Nobody does six. Take the title. Take it and go before I get attached."', 'log-quest');
            game.fx.burst(p.group.position, 0xffd76e, 30);
            game.save();
            checkAchievements(game);   // fires madge_six (riddles >= 6)
          } else {
            // riddles 1, 2, 4, 5: +5 runes from riddle 4 onward (the §E payout)
            if (s.riddles >= 4) p.runes += 5;
            ui.log('Madge nods slowly, needles never stopping.', 'log-quest');
            game.save();
            openMadgeDialog();
          }
        },
      })),
      { label: 'Not now', action: () => ui.hideDialog() },
    ],
  });
}

// ===== Iteration E: the Hidden Layer (Larder knock, urns, treasure digs, Grim) =====

// boss uniques the dig's uniqueChance can grant (the named, boss-keyed UNIQUES).
// Excludes the secret/vanity/quest uniques (vault, madge, carp, larder, greta_*)
// and the maps themselves. The dig grants the FIRST one the hero doesn't own.
const DIG_UNIQUE_KEYS = [
  'korgrim', 'vexnar', 'morgrath', 'ossus', 'vargoth', 'emberlord', 'pyraxis',
  'hrimnir', 'seraphel', 'noctyra', 'spireshade', 'vorthal',
  'quaranth', 'echo', 'khronaxis', 'grim', 'glowcap_carbine',
];

// does the player already hold (bag or equipped) a unique with this item id?
function ownsUniqueId(p, id) {
  if (p.inventory.some((it) => it?.id === id)) return true;
  return ALL_SLOTS.some((slot) => p.equipped[slot]?.id === id);
}

// grant a random boss unique the player doesn't already own (dig uniqueChance).
// Returns the granted item, or null if they own them all.
function grantRandomUnownedUnique(p) {
  const pool = [...DIG_UNIQUE_KEYS];
  for (let i = pool.length - 1; i > 0; i--) {   // shuffle
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (const key of pool) {
    const item = makeUnique(key);
    if (item && !ownsUniqueId(p, item.id)) { p.addItem(game, item); return item; }
  }
  return null;
}

// --- the Larder knock puzzle (Frostveil mound: F x3 within 6s) ---
function knockLarderMound() {
  const s = game.player.secrets;
  const now = performance.now();
  const w = game._larderKnocks ?? (game._larderKnocks = { count: 0, t: 0 });
  if (now - w.t > 6000) w.count = 0;   // window lapsed -> start over
  w.t = now;
  w.count++;
  game.audio.knock();
  if (w.count >= 3) {
    w.count = 0;
    s.pocket.larderOpen = true;
    game.frostveil.openLarder();
    game.ui.log('The trapdoor thaws with a groan, and the dark below exhales old fur and older gold.', 'log-quest');
    sfx.levelup();
    game.fx.burst(game.frostveil.larderMoundPos, 0xffb060, 26);
    game.save();
    checkAchievements(game);
  } else {
    game.ui.log('Something underneath shifts.', 'log-sys');
  }
}

// --- the Larder urns (F once each; index 0/1 gold, index 2 the relic) ---
function openLarderUrn(urn, idx) {
  if (urn.looted) return;
  const p = game.player;
  const s = p.secrets;
  urn.looted = true;
  // persist THIS urn so the reward never re-drops on reload (each urn is a
  // one-time payout — gold and relic alike). ensureSecrets guarantees the array.
  (s.pocket.urns ||= [false, false, false])[idx] = true;
  if (idx === 0) {
    p.gainGold(game, 8000);
    sfx.loot();
    game.fx.burst(urn.group.position, 0xffd87a, 18);
    game.ui.log('A clay urn cracks: eight thousand in cold coin.', 'log-loot');
  } else if (idx === 1) {
    p.gainGold(game, 12000);
    sfx.loot();
    game.fx.burst(urn.group.position, 0xffd87a, 18);
    game.ui.log('Another urn, fatter: twelve thousand more.', 'log-loot');
  } else {
    // the relic urn — the vanity BiS + the title
    p.addItem(game, makeUnique('larder'));
    p.title = 'the Hoardfinder';
    if (!p.titles.includes('the Hoardfinder')) p.titles.push('the Hoardfinder');
    s.pocket.larderLooted = true;
    sfx.levelup();
    game.fx.burst(urn.group.position, 0xffd76e, 30);
    game.ui.log("The Badger's Hoard is yours. (title: the Hoardfinder)", 'log-loot-legendary');
  }
  game.save();
  checkAchievements(game);   // fires hoardfinder on the relic urn
}

// nearest unlooted urn within ~3u (also used by the tick interact prompt)
function nearestLarderUrn() {
  if (game.zone !== 'larder' || !game.player) return null;
  const pos = game.player.group.position;
  for (let i = 0; i < game.larder.urns.length; i++) {
    const u = game.larder.urns[i];
    if (u.looted) continue;
    if (Math.hypot(pos.x - u.x, pos.z - u.z) < 3) return { urn: u, idx: i };
  }
  return null;
}

// --- treasure-map digs (held undug map + standing on its spot -> 2.5s cast) ---
// the held undug map whose spot is the current zone and the player is standing on
function diggableMap() {
  if (!game.player) return null;
  const s = game.player.secrets;
  const pos = game.player.group.position;
  for (const item of game.player.inventory) {
    if (item?.kind !== 'map') continue;
    if (s.maps[item.key] === 'dug') continue;
    const sp = item.spot;
    if (sp.zone !== game.zone) continue;
    if (Math.hypot(pos.x - sp.x, pos.z - sp.z) <= sp.r) return item;
  }
  return null;
}

function startDig() {
  const p = game.player;
  if (!p.alive || digging || fishing || p.casting) return;
  const map = diggableMap();
  if (!map) { game.ui.log('The map insists. The ground disagrees.', 'log-sys'); return; }
  digging = { t: 0, dur: 2.5, map, digCd: 0 };
  game.audio.dig();
  game.ui.showCastBar('Digging…');
}

function resolveDig() {
  const p = game.player;
  const s = p.secrets;
  const map = digging.map;
  const loot = map.loot;
  // a small decorative chest at the player's feet, disposed after a few seconds
  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.7, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2e })
  );
  const cp = p.group.position;
  chest.position.set(cp.x, heightAt(cp.x, cp.z) + 0.35, cp.z);
  scene.add(chest);
  setTimeout(() => { scene.remove(chest); chest.geometry.dispose(); chest.material.dispose(); }, 4000);

  const gold = loot.gold[0] + Math.floor(Math.random() * (loot.gold[1] - loot.gold[0] + 1));
  p.gainGold(game, gold);
  p.addItem(game, makeGenerated(ALL_SLOTS[Math.floor(Math.random() * ALL_SLOTS.length)], loot.rarity, p.level));
  let uniqueLine = '';
  if (loot.uniqueChance > 0 && Math.random() < loot.uniqueChance) {
    const u = grantRandomUnownedUnique(p);
    if (u) uniqueLine = ` And — buried deeper — ${u.name}.`;
  }
  s.maps[map.key] = 'dug';
  // consume the map from the bag
  const mi = p.inventory.indexOf(map);
  if (mi >= 0) p.inventory.splice(mi, 1);
  sfx.loot();
  game.fx.burst(chest.position, 0xffd76e, 26);
  game.ui.log(`The shovel strikes wood. ${gold} gold, and the map was right after all.${uniqueLine}`, 'log-loot');
  game.save();
  checkAchievements(game);   // fires cartographer at 5 dug
}

// --- the Grim ritual (sanctum nodes: dim -> bright -> flicker) ---
const RITUAL_ORDER = ['dim', 'bright', 'flicker'];

function nearestRitualNode() {
  if (game.zone !== 'sanctum' || !game.player || !game.sanctum.ritualNodes) return null;
  const pos = game.player.group.position;
  for (const n of game.sanctum.ritualNodes) {
    if (Math.hypot(pos.x - n.x, pos.z - n.z) < 3) return n;
  }
  return null;
}

function pressRitualNode(node) {
  const s = game.player.secrets;
  const expected = RITUAL_ORDER[s.ritual.step];
  if (node.glint === expected) {
    game.audio.ritualHum();
    s.ritual.step++;
    if (s.ritual.step >= 3) {
      // correct full sequence — crack the Cradle and summon Grim at the dais
      s.ritual.step = 0;
      s.ritual.done = true;
      sfx.levelup();
      game.fx.burst(new THREE.Vector3(0, heightAt(0, 346) + 1.5, 346), 0xffd24a, 34);
      game.ui.log('The Star Cradle cracks. Something has come to audit.', 'log-quest');
      summonGrim(game);
      game.save();
      checkAchievements(game);
    } else {
      game.ui.log('A star answers.', 'log-quest');
    }
  } else {
    s.ritual.step = 0;
    game.ui.log('The stars lose their place.', 'log-sys');
    sfx.warnMove();
  }
}

// --- the Stillest Pond: fishing for junk (and one absurd legendary) ---
const JUNK_CATCHES = [
  ['Old Boot', 'Left.'],
  ['A Different Old Boot', 'Also left.'],
  ['Soggy Plank', 'Load-bearing, somewhere.'],
  ['Surprisingly Angry Minnow', 'It will remember this.'],
];
let fishing = null;     // { t, dur } while the line is out
let fishingCd = 0;
let digging = null;     // { t, dur, map, digCd } while a treasure dig is in progress (§E.2)

function startFishing() {
  const p = game.player;
  if (!p.alive || fishing || fishingCd > 0 || p.casting) return;
  fishing = { t: 0, dur: 3 };
  game.ui.showCastBar('Fishing…');
}

function resolveCatch() {
  const p = game.player;
  fishingCd = 4;
  const roll = Math.random();
  if (roll < 0.005) {
    const carp = makeUnique('carp');
    p.addItem(game, carp);
    game.ui.log('Something enormous takes the line — the CARP OF A THOUSAND REGRETS is yours!', 'log-loot-legendary');
    game.ui.floatText(p.group.position, carp.name, 'loot-legendary');
    game.fx.burst(p.group.position, 0xff9a30, 30);
    sfx.levelup();
    checkAchievements(game);   // instant feedback (angler)
  } else if (roll < 0.4) {
    p.gainGold(game, 5 + Math.floor(Math.random() * 21));
  } else {
    const [name, flavor] = JUNK_CATCHES[Math.floor(Math.random() * JUNK_CATCHES.length)];
    p.addItem(game, { uid: rollUid(), id: 'junk', name, slot: 'trinket', rarity: 'common', stats: {}, value: 5, ilvl: 0, unique: false, flavor });
    game.ui.log(`You catch: ${name}.`, 'log-loot-common');
    sfx.loot();
  }
  game.save();
}

// --- the Festival of the Boar (↑↑↓↓←→←→BA): purely cosmetic ---
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiIdx = 0;
let festivalT = 0;
let festivalHats = [];

function partyHat() {
  const geo = new THREE.ConeGeometry(0.18, 0.45, 8);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.setHSL(((pos.getY(i) + 0.225) / 0.45) * 0.9, 0.9, 0.6);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true }));
}

function festivalOfTheBoar() {
  if (festivalT > 0) return;
  festivalT = 60;
  festivalHats = [];
  for (const e of game.enemies) {
    if (!e.alive || !['boar', 'boss', 'thunderbristle'].includes(e.kind)) continue;
    const hat = partyHat();
    const rig = e.group.userData.rig;
    const mountPt = rig && rig.headPivot ? rig.headPivot : e.group;
    mountPt.add(hat);
    hat.position.y = 0.5;
    festivalHats.push(hat);
  }
  const pHat = partyHat();
  game.player.group.userData.rig.headPivot.add(pHat);
  pHat.position.y = 0.62;
  festivalHats.push(pHat);
  const confetti = [0xff5a8a, 0xffd76e, 0x8aff9d, 0x8ad9ff, 0xb08aff, 0xff9a30];
  confetti.forEach((col, i) => setTimeout(() => game.fx.burst(game.player.group.position, col, 18), i * 120));
  sfx.levelup();
  game.ui.log('The old words are spoken. Somewhere far away, a developer feels a disturbance — and approves. The boars are celebrating.', 'log-quest');
}

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
    v: 5,
    classId: p.classId, secondaryId: p.secondaryId,
    level: p.level, xp: p.xp, gold: p.gold,
    runes: p.runes, runeBonus: p.runeBonus,
    potions: p.potions, trainDmg: p.trainDmg, trainHp: p.trainHp,
    trainCrit: p.trainCrit, boots: p.boots,
    inventory: p.inventory,
    equipped: p.equipped,
    talents: p.talents,
    spent: p.talentSpent(),     // derived; written for forward-compat, recomputed on load
    mount: p.mount, glow: p.glow,
    secrets: p.secrets,
    slain: [...game.slain],
    quests: game.quests.serialize(),
    highlandQuests: game.highlandQuests.serialize(),
    frostveilQuests: game.frostveilQuests.serialize(),
    sanctumQuests: game.sanctumQuests.serialize(),
    hollowQuests: game.hollowQuests.serialize(),
    horologiumQuests: game.horologiumQuests.serialize(),
    nodesDepleted: game.gathering.nodes.map((n) => (n.depleted ? Math.round(n.respawnT) : 0)),
    counters: p.counters,
    achievements: p.achievements,
    title: p.title, titles: p.titles,
  }));
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && [1, 2, 3, 4, 5].includes(s.v) && CLASSES[s.classId] ? s : null;
  } catch { return null; }
}

// console helper: a level-90 post-Pyraxis hero at the expansion gate (v4 save)
window.__veteran2 = (classId = 'warrior') => {
  if (!CLASSES[classId]) { console.warn('classes:', Object.keys(CLASSES).join(', ')); return; }
  const done = (id, n) => [id, { status: 'done', progress: n }];
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    v: 5, classId, secondaryId: null,
    level: 90, xp: 0,
    gold: 250000, runes: 40, runeBonus: 30,
    potions: 25, trainDmg: 0, trainHp: 0, trainCrit: 0, boots: true,
    mount: false, glow: false,
    inventory: [],
    equipped: { weapon: null, armor: null, trinket: null, relic: null },  // the relic chase, from zero
    talents: { onslaught: 0, bulwark: 0, pathfinder: 0, choices: {}, mastery: null },  // 81 points derive
    secrets: { vault: false, riddles: 0 },
    slain: ['boss', 'banditking', 'korgrim', 'vexnar', 'morgrath', 'ossus', 'vargoth', 'emberlord', 'pyraxis'],
    quests: { quests: Object.fromEntries([
      done('boars', 6), done('wolves', 4), done('boss', 1), done('bandits', 6), done('banditking', 1),
      done('korgrim', 1), done('vexnar', 1), done('morgrath', 1), done('ossus', 1), done('vargoth', 1),
    ]), bounty: { status: 'ready', progress: 0 } },
    highlandQuests: { quests: Object.fromEntries([
      done('h_cinders', 6), done('h_packs', 8), done('h_emberlord', 1), done('h_pyraxis', 1),
    ]), bounty: { status: 'ready', progress: 0 } },
    // frostveil/sanctum/hollow chains intentionally absent -> fresh expansion
  }));
  location.reload();
};

// console helper: a level-118 post-Vorthal hero at the Hollow's dungeon mouth (v5 save).
// Hollow chain done, the Last Hour gate open (level ≥ 112), but horologiumQuests
// intentionally absent -> the descent is fresh (default-fills via .load(undefined)).
window.__veteran3 = (classId = 'warrior') => {
  if (!CLASSES[classId]) { console.warn('classes:', Object.keys(CLASSES).join(', ')); return; }
  const done = (id, n) => [id, { status: 'done', progress: n }];
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    v: 5, classId, secondaryId: null,
    level: 118, xp: 0,
    gold: 600000, runes: 60, runeBonus: 45,
    potions: 40, trainDmg: 0, trainHp: 0, trainCrit: 0, boots: true,
    mount: true, glow: true,
    inventory: [],
    equipped: { weapon: null, armor: null, trinket: null, relic: null },
    talents: { onslaught: 0, bulwark: 0, pathfinder: 0, choices: {}, mastery: null },  // 90 ranks derive
    secrets: { vault: false, riddles: 0 },
    slain: ['boss', 'banditking', 'korgrim', 'vexnar', 'morgrath', 'ossus', 'vargoth',
            'emberlord', 'pyraxis', 'hrimnir', 'seraphel', 'noctyra',
            'thunderbristle', 'spireshade', 'vorthal'],
    quests: { quests: Object.fromEntries([
      done('boars', 6), done('wolves', 4), done('boss', 1), done('bandits', 6), done('banditking', 1),
      done('korgrim', 1), done('vexnar', 1), done('morgrath', 1), done('ossus', 1), done('vargoth', 1),
    ]), bounty: { status: 'ready', progress: 0 } },
    highlandQuests: { quests: Object.fromEntries([
      done('h_cinders', 6), done('h_packs', 8), done('h_emberlord', 1), done('h_pyraxis', 1),
    ]), bounty: { status: 'ready', progress: 0 } },
    hollowQuests: { quests: Object.fromEntries([
      done('h_swarm', 8), done('h_stalkers', 8), done('h_callers', 6), done('h_wardens', 5),
      done('h_spireshade', 1), done('h_proof', 10), done('h_vorthal', 1), done('h_coda', 6),
    ]), bounty: { status: 'ready', progress: 0 } },
    // horologiumQuests intentionally absent -> fresh descent
  }));
  location.reload();
};

// console helper: conjure a generated item into the bag, e.g. __give('relic', 'epic')
window.__give = (slot = 'relic', rarity = 'epic', ilvl) => {
  if (!game.player) return;
  game.player.addItem(game, makeGenerated(slot, rarity, ilvl ?? game.player.level));
  game.save();
};

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

  // the old words (↑↑↓↓←→←→BA) — see festivalOfTheBoar
  konamiIdx = e.code === KONAMI[konamiIdx] ? konamiIdx + 1 : (e.code === KONAMI[0] ? 1 : 0);
  if (konamiIdx === KONAMI.length) { konamiIdx = 0; festivalOfTheBoar(); }

  if (e.code === 'Tab') { e.preventDefault(); tabTarget(game); }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= 9) castSkill(game, n - 1);   // 1–9 -> indices 0–8
    else if (n === 0) castSkill(game, 9);           // 0 -> index 9
  }
  if (e.code === 'Minus') castSkill(game, 10);       // - -> 11th slot (3rd capstone)
  if (e.code === 'Equal') castSkill(game, 11);       // = -> 12th slot (dual-class + new skill headroom)
  if (e.code === 'KeyR') useRune(game);
  if (e.code === 'KeyQ') game.player.usePotion(game);
  if (e.code === 'KeyI') game.ui.toggleInventory(game);
  if (e.code === 'KeyC') game.ui.toggleCharSheet(game);
  if (e.code === 'KeyT') game.ui.toggleTalents(game);
  if (e.code === 'KeyK') game.ui.toggleAchievements(game); // K is collision-free (NOT in KONAMI) — no guard needed, unlike B
  if (e.code === 'KeyB' && konamiIdx !== 9) game.ui.toggleCraft(game); // 9 = B just spoke as the old words' 9th syllable
  if (e.code === 'Space') { e.preventDefault(); game.player.tryJump(); }
  if (e.code === 'KeyF') {
    const p = game.player.group.position;
    // nearest questgiver within 5 wins; then the secrets; then portals
    let bestChain = null, bestD = 5;
    for (const n of game.npcs) {
      if (!n.chain) continue;
      const d = p.distanceTo(n.group.position);
      if (d < bestD) { bestChain = n.chain; bestD = d; }
    }
    if (bestChain) {
      bestChain.openDialog(game);
    } else if (p.distanceTo(halla.group.position) < 5) {
      openCraftBench();
    } else if (nearestNode()) {
      gatherNode(game, nearestNode());
    } else if (p.distanceTo(madge.group.position) < 5) {
      openMadgeDialog();
    } else if (game.zone === 'crypt' && !game.player.secrets.vault &&
               Math.hypot(p.x - dungeon.chestPos.x, p.z - dungeon.chestPos.z) < 4) {
      openVault();
    } else if (game.zone === 'world' && p.distanceTo(world.pondPos) < 4.5 && !diggableMap()) {
      startFishing();   // a held, undug pond map on its spot wins F over fishing (the clue sends you here)
    } else if (game.zone === 'frostveil' && !game.player.secrets.pocket.larderOpen &&
               p.distanceTo(game.frostveil.larderMoundPos) < 4) {
      knockLarderMound();   // §E.1 — F x3 within 6s thaws the trapdoor
    } else if (nearestLarderUrn()) {
      const { urn, idx } = nearestLarderUrn();
      openLarderUrn(urn, idx);   // §E.1 — loot the urns (0/1 gold, 2 relic)
    } else if (nearestRitualNode()) {
      pressRitualNode(nearestRitualNode());   // §E.4 — Grim summon ritual order
    } else if (diggableMap()) {
      startDig();   // §E.2 — held undug map + on its spot -> 2.5s dig cast
    } else {
      const portal = nearestPortal();
      if (portal && game.player.alive) usePortal(portal);
    }
  }
  if (e.code === 'Escape') {
    if (game.ui.achievementsOpen()) game.ui.hideAchievements();
    else if (game.ui.craftOpen()) game.ui.hideCraft();
    else if (game.ui.shopOpen()) game.ui.hideShop();
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
document.getElementById('craft-close').addEventListener('click', () => game.ui.hideCraft());
document.getElementById('talent-badge').addEventListener('click', () => game.started && game.ui.toggleTalents(game));
document.getElementById('talent-close').addEventListener('click', () => game.ui.hideTalents());
document.getElementById('talent-respec').addEventListener('click', () => { game.ui.hideTalents(); game.ui.showShop(game); });
document.getElementById('achieve-close').addEventListener('click', () => game.ui.hideAchievements());
document.getElementById('achieve-badge').addEventListener('click', () => game.started && game.ui.toggleAchievements(game));
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

// Iteration E secrets default-fill. createPlayer sets only {vault, riddles};
// save() serializes p.secrets wholesale, so these fields must EXIST on both the
// new-game and saved paths for the dig/larder/ritual/mimic flows to round-trip.
function ensureSecrets(p) {
  p.secrets ??= { vault: false, riddles: 0 };
  p.secrets.vault ??= false;
  p.secrets.riddles ??= 0;
  p.secrets.maps ??= {};
  p.secrets.pocket ??= { larderOpen: false, larderLooted: false };
  // per-urn looted flags so a returning hero can't re-loot for +20,000g and a
  // duplicate relic every reload. Legacy saves that only carried the one-time
  // larderLooted boolean back-fill all three as looted (the relic urn is what
  // set larderLooted, and it's looted last, so the gold urns were taken too).
  p.secrets.pocket.urns ??= p.secrets.pocket.larderLooted
    ? [true, true, true]
    : [false, false, false];
  p.secrets.ritual ??= { step: 0, done: false };
  p.secrets.mimics ??= {};
}

function startGame(classId, saved) {
  game.player = createPlayer(classId, scene);
  // createPlayer (player.js) lacks these iteration-D fields — guarantee them on
  // BOTH the new-game and saved paths so the K panel never reads undefined.
  game.player.counters ??= {};
  game.player.achievements ??= {};
  game.player.titles ??= [];
  game.player.title ??= null;
  ensureSecrets(game.player);   // new-game path: fields exist so save() round-trips them

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
    p.equipped = saved.equipped ?? { weapon: null, armor: null, trinket: null, relic: null };
    // migrate partial equipped (v2/v3) so all four keys exist:
    p.equipped.weapon ??= null; p.equipped.armor ??= null;
    p.equipped.trinket ??= null; p.equipped.relic ??= null;
    // talents v4: { ranks×3, choices, mastery }. Anything older gets THE GREAT
    // UNLEARNING — a full refund (points are derived, so zeroing IS the refund).
    if (saved.v >= 4 && saved.talents && saved.talents.choices) {
      p.talents = sanitizeTalents(saved.talents);
    } else {
      const hadSpent = saved.talents &&
        ((saved.talents.onslaught || 0) + (saved.talents.bulwark || 0) + (saved.talents.pathfinder || 0)) > 0;
      p.talents = freshTalents();
      if (hadSpent) {
        setTimeout(() => {
          game.ui.log('A great unlearning sweeps Taborea — the talent paths have been redrawn, and they run twice as deep.', 'log-quest');
          game.ui.log(`All ${Math.max(0, saved.level - 9)} of your talent points have been returned. Press T — this time, you must choose.`, 'log-quest');
          game.ui.nudgeTalentBadge();
        }, 1600);
      }
    }
    p.mount = saved.mount ?? false;
    p.glow = saved.glow ?? false;
    p.secrets = saved.secrets ?? { vault: false, riddles: 0 };
    p.secrets.vault ??= false; p.secrets.riddles ??= 0;
    ensureSecrets(p);   // §E: default-fill maps/pocket/ritual/mimics (old saves stay loadable)
    // iteration D: achievements/bestiary/titles — default-fill on all prior versions
    p.counters = saved.counters ?? {};
    p.achievements = saved.achievements ?? {};
    p.titles = saved.titles ?? [];
    p.title = saved.title ?? null;
    if (saved.secondaryId) p.chooseSecondary(game, saved.secondaryId, true);
    p.recalcStats();
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    game.quests.load(saved.quests);
    game.highlandQuests.load(saved.highlandQuests);   // no-ops on undefined (old saves)
    game.frostveilQuests.load(saved.frostveilQuests);
    game.sanctumQuests.load(saved.sanctumQuests);
    game.hollowQuests.load(saved.hollowQuests);
    game.horologiumQuests.load(saved.horologiumQuests);   // no-ops on undefined (old saves / fresh dungeon)
    const nd = saved.nodesDepleted;   // restore depleted gather nodes by index (skip if absent)
    if (nd) game.gathering.nodes.forEach((n, i) => {
      if (nd[i] > 0) { n.depleted = true; n.respawnT = nd[i]; n.group.visible = false; }
    });
    game.slain = new Set(saved.slain ?? []);
    if (p.secrets.vault) dungeon.openChest();         // the hoard stays plundered

    // §E: a returning hero who solved the knock puzzle finds the mound already
    // thawed (and allPortals() includes the entry portal via the larderOpen gate).
    if (p.secrets.pocket.larderOpen) game.frostveil.openLarder();
    // §E.1: re-mark already-looted urns so they don't re-drop gold/relic on reload.
    // larder.js rebuilds every urn as { looted:false } each page load; restore the
    // persisted per-urn flags (ensureSecrets back-fills legacy larderLooted saves).
    const lootedUrns = p.secrets.pocket.urns;
    if (lootedUrns) game.larder.urns.forEach((u, i) => { if (lootedUrns[i]) u.looted = true; });
    // §E: remove any placed mimic the hero already cleared in a prior session, so
    // a returning hero doesn't re-find a sprung chest (in-session respawns still
    // happen at elite 45s, letting counters.mimic farm toward exterminator).
    for (const e of [...game.enemies]) {
      if (e.mimicId && p.secrets.mimics[e.mimicId]) removeEnemy(game, e);
    }
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
let achieveCheckT = 0;   // ~1s throttle for the out-of-combat achievement catch-all
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (game.started) {
    // level-55 crossing learns the class control skill (it joins the bar via
    // allSkills()'s minLevel filter). One-shot rebuild — no learn-state stored.
    if (game.player && game.player.level >= 55 && !game._learned55) {
      game._learned55 = true;
      game.ui.buildActionBar(game, game.onCast);
      game.ui.log(LEARN_TOAST[game.player.classId] || 'You have learned a new skill — it joins your bar.', 'log-quest');
    }
    updateGates();
    // out-of-combat achievement catch-all (~1/sec): level-up, swearMastery,
    // quest turn-in, fishing/larder/riddle flags. combat.js handles in-combat.
    achieveCheckT += dt;
    if (achieveCheckT >= 1) { achieveCheckT = 0; checkAchievements(game); }
    updatePlayer(game, dt, elapsed);
    updateEnemies(game, dt, elapsed);
    updateCombat(game, dt);
    world.update(dt, elapsed, game.player.group.position);
    highlands.update(elapsed);
    frostveil.update(elapsed, game);
    sanctum.update(elapsed);
    hollow.update(elapsed, game);
    horologium.update(elapsed);
    gathering.update(dt);

    let npcDist = Infinity;
    for (const n of game.npcs) npcDist = Math.min(npcDist, updateNpc(n, game, elapsed));
    const portal = nearestPortal();
    const p = game.player.group.position;
    const nearSign = p.distanceTo(highlands.signPos) < 6 && p.x < HIGHLANDS.GATE_X;
    const frostSign = game.player.alive &&
      frostveil.signs.find((s) => Math.hypot(p.x - s.x, p.z - s.z) < 6);
    const hollowSign = game.player.alive &&
      hollow.signs.find((s) => Math.hypot(p.x - s.x, p.z - s.z) < 6);
    const nearPond = game.zone === 'world' && p.distanceTo(world.pondPos) < 4.5;
    const nearChest = game.zone === 'crypt' && !game.player.secrets.vault &&
      Math.hypot(p.x - dungeon.chestPos.x, p.z - dungeon.chestPos.z) < 4;
    const nearNode = game.player.alive ? nearestNode() : null;
    // §E interact targets (computed once; no map pip — the entry portal is gated)
    const alive = game.player.alive;
    const nearMound = alive && game.zone === 'frostveil' &&
      !game.player.secrets.pocket.larderOpen &&
      p.distanceTo(game.frostveil.larderMoundPos) < 4;
    const nearUrn = alive && nearestLarderUrn();
    const nearRitual = alive && nearestRitualNode();
    const nearDig = alive && !digging && diggableMap();

    if (game.player.alive && npcDist < 5 && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, 'Talk');
    } else if (nearChest && game.player.alive) {
      game.ui.setInteractPrompt(true, "Open Vargoth's hoard");
    } else if (nearPond && game.player.alive && !fishing && !nearDig) {
      game.ui.setInteractPrompt(true, 'Fish');   // dig wins over fish when a pond map is held on its spot (matches F-chain)
    } else if (nearMound && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, 'Knock');
    } else if (nearUrn) {
      game.ui.setInteractPrompt(true, 'Open the urn');
    } else if (nearRitual && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, 'Touch the star');
    } else if (nearDig && !digging) {
      game.ui.setInteractPrompt(true, 'Dig');
    } else if (nearSign && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, 'The Ashen Highlands — recommended level 55+');
    } else if (frostSign && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, frostSign.label);
    } else if (hollowSign && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, hollowSign.label);
    } else if (nearNode && !game.ui.dialogOpen()) {
      game.ui.setInteractPrompt(true, `Gather ${nearNode.type.name}`);
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

    // expansion cues + secret hints (all one-time per session)
    if (!game._archCracked && (game.slain.has('pyraxis') || game.player.level >= 78)) {
      game._archCracked = true;
      game.ui.log('Far to the west, something cracks like spring ice…', 'log-quest');
    }
    if (!game._fissureWoke && game.slain.has('hrimnir')) {
      game._fissureWoke = true;
      game.ui.log('Beneath the tarn, gold light wakes. The fissure is breathing.', 'log-quest');
    }
    if (!game._hollowWoke && (game.slain.has('noctyra') || game.player.level >= 102)) {
      game._hollowWoke = true;
      game.ui.log('Where the Hollow Star fell, the Sanctum floor has cracked — green light, and the smell of something growing back.', 'log-quest');
    }
    if (!game._lastHourWoke && (game.slain.has('noctyra') || game.player.level >= 112)) {
      game._lastHourWoke = true;
      game.ui.log('At the edge of the Hollow, a second arch stops mid-collapse and holds. Below it, the sand has stopped falling.', 'log-quest');
    }
    if (!game._hintVault && game.zone === 'crypt' &&
        Math.hypot(p.x - dungeon.thronePos.x, p.z - dungeon.thronePos.z) < 4) {
      game._hintVault = true;
      game.ui.log("The wall behind Vargoth's throne does not echo like the others.", 'log-sys');
    }
    if (p.distanceTo(world.cairnPos) < 4) {
      if (!game._cairnSeen) {
        game._cairnSeen = true;
        game.ui.log('A small cairn, lovingly stacked: "BODO — He ravaged."', 'log-sys');
      } else if (!game._cairnSeen2 && game.slain.has('thunderbristle')) {
        game._cairnSeen2 = true;
        game.ui.log('The cairn has a second, much larger stone now.', 'log-sys');
      }
    }

    // fishing line out: moving (or casting a real spell) cancels, patience pays
    fishingCd = Math.max(0, fishingCd - dt);
    if (fishing) {
      if (!game.player.alive || game.player.anim.moving || game.player.casting) {
        fishing = null;
        game.ui.hideCastBar();
        game.ui.log('The line snaps back. The pond forgives.', 'log-sys');
      } else {
        fishing.t += dt;
        game.ui.updateCastBar(fishing.t / fishing.dur);
        if (fishing.t >= fishing.dur) {
          fishing = null;
          game.ui.hideCastBar();
          resolveCatch();
        }
      }
    }

    // treasure dig in progress: moving / death / casting cancels (mirror fishing).
    // play game.audio.dig() periodically so it reads as a scrape-loop (§E.2).
    if (digging) {
      if (!game.player.alive || game.player.anim.moving || game.player.casting) {
        digging = null;
        game.ui.hideCastBar();
        game.ui.log('You stop digging. The ground keeps its secret a while longer.', 'log-sys');
      } else {
        digging.t += dt;
        digging.digCd -= dt;
        if (digging.digCd <= 0) { game.audio.dig(); digging.digCd = 0.4; }
        game.ui.updateCastBar(digging.t / digging.dur);
        if (digging.t >= digging.dur) {
          game.ui.hideCastBar();
          resolveDig();
          digging = null;
        }
      }
    }

    // §E.3: persist cleared placed-mimics so a returning hero doesn't re-find them.
    // combat.js handles counters.mimic + slain (mimic is elite) automatically; here
    // we only flag the secrets clear when an observed placed mimic is dead. In-session
    // the mimic still respawns (elite 45s) so counters.mimic can climb to 10.
    for (const e of game.enemies) {
      if (e.mimicId && !e.alive && !game.player.secrets.mimics[e.mimicId]) {
        game.player.secrets.mimics[e.mimicId] = true;
        game.save();
      }
    }

    // festival hats melt away after a minute (dispose — convention for transients)
    if (festivalT > 0) {
      festivalT -= dt;
      if (festivalT <= 0) {
        for (const h of festivalHats) {
          h.parent?.remove(h);
          h.geometry.dispose();
          h.material.dispose();
        }
        festivalHats = [];
        game.ui.log('The festival ends, as festivals do. The boars pretend it never happened.', 'log-sys');
      }
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
    frostveil.update(elapsed, null);
    sanctum.update(elapsed);
    hollow.update(elapsed, null);
    horologium.update(elapsed);
    const fakeGame = { player: { group: { position: camera.position } } };
    for (const n of game.npcs) updateNpc(n, fakeGame, elapsed);
  }

  renderer.render(scene, camera);
}
tick();
