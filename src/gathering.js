import * as THREE from 'three';
import { heightAt, HOLLOW, FROSTVEIL, HIGHLANDS } from './noise.js';
import { makeMaterial, MATERIALS } from './items.js';

// Gathering nodes — the harvestable half of crafting. Each node is a tiny static
// rig (frostveil/world scatter idiom: lambert + castShadow, base translated to
// y=0, group dropped onto heightAt). Placement is deterministic per zone (own
// seeded LCG — makeRng is module-local in world.js/entities.js, not exported)
// so the integrator's positional nodesDepleted save stays stable across loads.
// Press F by a node -> gatherNode(): yield-roll, addItem(makeMaterial), deplete,
// chime, float; the node re-shows after type.respawn seconds.

function lambert(color) { return new THREE.MeshLambertMaterial({ color }); }
function shadowed(mesh) { mesh.castShadow = true; return mesh; }

// own LCG (same constants as world.js/entities.js makeRng) — () => float [0,1)
function makeRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}

// ---- node rigs (each returns a Group whose base sits at local y=0) ----

// herb: three small grass cones in the node color
function buildHerbNode(color) {
  const g = new THREE.Group();
  const mat = lambert(color);
  const offs = [[0, 0, 0, 0.7], [0.22, 0.05, 0.18, 0.55], [-0.2, 0.0, -0.16, 0.6]];
  for (const [x, , z, s] of offs) {
    const geo = new THREE.ConeGeometry(0.12 * (s / 0.7), 0.62 * s, 5);
    geo.translate(0, 0.31 * s, 0);
    const m = shadowed(new THREE.Mesh(geo, mat));
    m.position.set(x, 0, z);
    g.add(m);
  }
  return g;
}

// emberveins: two emissive dodecahedrons (the ore reads hot)
function buildEmberNode(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.55 });
  const a = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.34), mat));
  a.position.set(-0.12, 0.34, 0.08);
  const b = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.26), mat));
  b.position.set(0.22, 0.26, -0.14);
  g.add(a, b);
  return g;
}

// rimecluster: two cold-blue tetrahedrons leaning out of the snow
function buildRimeNode(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const a = shadowed(new THREE.Mesh(new THREE.TetrahedronGeometry(0.42), mat));
  a.position.set(-0.1, 0.36, 0.06); a.rotation.set(0.4, 0.6, 0.2);
  const b = shadowed(new THREE.Mesh(new THREE.TetrahedronGeometry(0.3), mat));
  b.position.set(0.2, 0.28, -0.1); b.rotation.set(-0.3, 1.2, 0.5);
  g.add(a, b);
  return g;
}

// starshard: a single faint icosahedron, humming above the floor
function buildStarNode(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 });
  const s = shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry(0.4), mat));
  s.position.y = 0.5;
  g.add(s);
  return g;
}

// sporepod: a flattened magenta sphere bulb on a short pale stalk
function buildSporePod(color) {
  const g = new THREE.Group();
  const stalkGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.5, 6);
  stalkGeo.translate(0, 0.25, 0);
  const stalk = shadowed(new THREE.Mesh(stalkGeo, lambert(0xe8e0d0)));
  const bulb = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 7),
    new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4 })));
  bulb.scale.y = 0.6;
  bulb.position.y = 0.62;
  g.add(stalk, bulb);
  return g;
}

// FROZEN keys/shape — integrator + save read node.type.name/matId/respawn.
export const NODE_TYPES = {
  herb:       { name: 'Meadow Herb',  matId: 'fiber',      yield: [1, 2], color: 0x6fd06a, respawn: 60,  build: buildHerbNode },
  emberveins: { name: 'Ember Vein',   matId: 'cinderbark', yield: [1, 2], color: 0xff7a30, respawn: 90,  build: buildEmberNode },
  rimecluster:{ name: 'Rime Cluster', matId: 'frostcore',  yield: [1, 2], color: 0xaad9ff, respawn: 90,  build: buildRimeNode },
  starshard:  { name: 'Star Shard',   matId: 'stardust',   yield: [1, 1], color: 0xb8c4ff, respawn: 120, build: buildStarNode },
  sporepod:   { name: 'Spore-Pod',    matId: 'sporesilk',  yield: [1, 2], color: 0xff5ea8, respawn: 120, build: buildSporePod },
};

// per §C.1b: which zone spawns what & how many. ORDER IS FIXED (world, highlands,
// frostveil, sanctum, hollow) — the integrator's nodesDepleted save indexes nodes
// positionally, so this iteration order must never change.
const NODE_SITES = [
  { zone: 'world',     kind: 'herb',        count: 24 },
  { zone: 'highlands', kind: 'emberveins',  count: 14 },
  { zone: 'frostveil', kind: 'rimecluster', count: 14 },
  { zone: 'sanctum',   kind: 'starshard',   count: 8  },
  { zone: 'hollow',    kind: 'sporepod',    count: 14 },
];

// per-zone sampling boxes (keep nodes inside the playable interior). 'world' is
// the meadow around camp — NOT the Highlands shelf (that is its own site).
// The sanctum is a narrow walled corridor, NOT the full SANCTUM pocket box: the
// player is wall-blocked from the dead pocket outside. Its box is a coarse
// bound; SANCTUM_ROOMS below is the real walkable footprint a node must land in.
const ZONE_SAMPLE = {
  world:     { x1: -120, x2: 120, z1: -120, z2: 120 },
  highlands: { x1: HIGHLANDS.BLEND_HI, x2: HIGHLANDS.EAST_EDGE - 4, z1: -120, z2: 120 }, // x178..201 shelf
  frostveil: { x1: FROSTVEIL.x1 + 10, x2: FROSTVEIL.x2 - 10, z1: FROSTVEIL.z1 + 10, z2: FROSTVEIL.z2 - 10 },
  sanctum:   { x1: -12, x2: 12, z1: 259, z2: 349 }, // coarse bound; SANCTUM_ROOMS is the real footprint
  hollow:    { x1: HOLLOW.x1 + 10, x2: HOLLOW.x2 - 10, z1: HOLLOW.z1 + 10, z2: HOLLOW.z2 - 10 },
};

// The sanctum is the only walled gather zone. Its rooms/corridors are narrow and
// the gaps beside the corridors are dead (unreachable) pockets that aren't walls,
// so a wall-only reject isn't enough — a node must land INSIDE one of the
// walkable room/corridor rectangles. These are the WALLS interiors inset by a
// node-footprint margin so meshes never clip a wall (kept in sync with
// sanctum.js WALLS; see review concern 4 / §C.1b "no node inside walls/portals").
const SANCTUM_M = 0.7; // inset from wall faces for the node's footprint
const SANCTUM_ROOMS = [
  { x1: -10, x2: 10, z1: 259, z2: 279 }, // entry room
  { x1: -3,  x2: 3,  z1: 280, z2: 292 }, // corridor A
  { x1: -12, x2: 12, z1: 293, z2: 317 }, // mid hall (Seraphel)
  { x1: -3,  x2: 3,  z1: 318, z2: 326 }, // corridor B
  { x1: -11, x2: 11, z1: 327, z2: 349 }, // final hall (Noctyra)
].map((r) => ({ x1: r.x1 + SANCTUM_M, x2: r.x2 - SANCTUM_M, z1: r.z1 + SANCTUM_M, z2: r.z2 - SANCTUM_M }));

// per-zone "is this point on walkable floor?" predicates — only the sanctum is
// constrained (every other gather zone is open terrain). undefined => always ok.
const ZONE_WALKABLE = {
  sanctum: (x, z) => SANCTUM_ROOMS.some((r) => x > r.x1 && x < r.x2 && z > r.z1 && z < r.z2),
};

// known anchors to keep nodes off (questgivers / portals / boss sites) — passive
// nodes are fine to crowd, but don't drop them on top of a portal mouth or a camp.
const ZONE_AVOID = {
  world:     [{ x: -2.5, z: -3, r: 6 }, { x: 2.5, z: -3, r: 6 }],   // Barnaby + Smith Halla camp
  highlands: [],
  frostveil: [{ x: -263, z: 0, r: 12 }, { x: -305, z: 8, r: 18 }],  // arch + tarn
  sanctum:   [{ x: 0, z: 348, r: 10 }, { x: 0, z: 350, r: 10 }],    // portal lane
  hollow:    [{ x: 0, z: -258, r: 12 }, { x: 0, z: -305, r: 20 }, { x: 0, z: -345, r: 16 }], // arch, pool, Vorthal
};

// each zone gets its OWN deterministic seed so placement is stable per zone.
const ZONE_SEED = {
  world: 0x9a7705, highlands: 0xe3b021, frostveil: 0x5cd1f0, sanctum: 0x70a5e2, hollow: 0xb1003c,
};

export function buildGathering(scene) {
  const nodes = [];

  for (const site of NODE_SITES) {
    const box = ZONE_SAMPLE[site.zone];
    const avoid = ZONE_AVOID[site.zone] || [];
    const walkable = ZONE_WALKABLE[site.zone];
    const type = NODE_TYPES[site.kind];
    const rng = makeRng(ZONE_SEED[site.zone]);

    const placed = [];
    let tries = 0;
    // the walled sanctum hall is tight — give it a bigger budget and a smaller
    // inter-node spread so all 8 star-shards fit in the walkable footprint.
    const maxTries = site.count * (walkable ? 200 : 60);
    const minSpread = walkable ? 4 : 8;
    while (placed.length < site.count && tries < maxTries) {
      tries++;
      const x = box.x1 + rng() * (box.x2 - box.x1);
      const z = box.z1 + rng() * (box.z2 - box.z1);
      // a constrained zone (sanctum) must land on walkable room floor, never in
      // a wall or a dead pocket beside a corridor (§C.1b "no node inside walls")
      if (walkable && !walkable(x, z)) continue;
      // reject too-close to anchors, and to other nodes of this zone (spread them)
      let bad = false;
      for (const a of avoid) if (Math.hypot(x - a.x, z - a.z) < a.r) { bad = true; break; }
      if (!bad) for (const p of placed) if (Math.hypot(x - p.x, z - p.z) < minSpread) { bad = true; break; }
      if (bad) continue;
      placed.push({ x, z });
    }

    for (const p of placed) {
      const y = heightAt(p.x, p.z);
      const group = type.build(type.color);
      group.position.set(p.x, y, p.z);
      group.rotation.y = rng() * Math.PI * 2;
      scene.add(group);
      nodes.push({
        kind: site.kind, type, group,
        home: new THREE.Vector3(p.x, y, p.z),
        depleted: false, respawnT: 0,
      });
    }
  }

  function update(dt) {
    for (const n of nodes) {
      if (!n.depleted) continue;
      n.respawnT -= dt;
      if (n.respawnT <= 0) { n.depleted = false; n.respawnT = 0; n.group.visible = true; }
    }
  }

  return { nodes, update };
}

export function gatherNode(game, node) {
  if (node.depleted) return;
  const [lo, hi] = node.type.yield;
  const q = lo + Math.floor(Math.random() * (hi - lo + 1));
  game.player.addItem(game, makeMaterial(node.type.matId, q));
  node.depleted = true;
  node.respawnT = node.type.respawn;
  node.group.visible = false;
  game.audio.gather();
  game.ui.log(`Gathered ${q}× ${MATERIALS[node.type.matId].name}.`, 'log-loot');
  game.ui.floatText(node.group.position, `+${q} ${node.type.name}`, 'loot');
  game.save?.();
}
