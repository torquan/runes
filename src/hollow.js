import * as THREE from 'three';
import { heightAt, HOLLOW } from './noise.js';

// The Verdant Hollow — a far-south pocket (z≈−360..−250), SANCTUM's mirror: a
// sinkhole-grotto choked with bioluminescent overgrowth, where the Hollow Star's
// spilled light fertilized everything at once. Lush, wet, glowing, and wrong.
// Mirrors frostveil.js: every static mesh of the biome builds into one Group
// added to the shared scene — glowcap mushrooms, bracket-fungus shelves, glow-
// ferns, mossy boulders, the glow-pool inlays, a rising-spore field, and the
// single entry-grove arch (arrival + ungated return portal). `setZone('hollow')`
// (main.js) drops the meadow sun to near-zero so the green/magenta lights placed
// here carry the scene — no sun reaches the grotto.

const tmpMat = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpEuler = new THREE.Euler();

function makeRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}

// vertex-color a displaced ground geometry by height band:
//   wet peat <12 #243018, moss+spore-mat 12..22 #2f6b34, glow-lichen rock >22 #5a2f6e
const C_PEAT = new THREE.Color(0x243018);
const C_MOSS = new THREE.Color(0x2f6b34);
const C_LICHEN = new THREE.Color(0x5a2f6e);

export function buildHollow(scene) {
  const group = new THREE.Group();
  const rng = makeRng(0x4b10);
  const H = HOLLOW;

  // the grotto's landmarks (world coords): the entry grove + the glow-pool basin.
  const arch = { x: 0, z: -258 };                              // entry grove arch / return portal
  const pool = { x: 0, z: -305 };                              // central glow-pool basin (elite)
  const spireshade = { x: -30, z: -300 };                      // the Mother-Bloom (elite)
  const vorthalSite = { x: 0, z: -345 };                       // Vorthal, the First Root (world boss)
  // trash spawn sites to keep clear of scatter — mirrored from entities.js so a
  // scatter near a pull-radius can never block a pull or the entry line.
  const SITES = [
    spireshade, vorthalSite,
    { x: 28, z: -286 }, { x: -34, z: -290 }, { x: 22, z: -312 },
    { x: -20, z: -322 }, { x: 36, z: -300 }, { x: 14, z: -330 },
    { x: -38, z: -312 }, { x: 30, z: -328 }, { x: -12, z: -284 },
    { x: 8, z: -320 },
  ];

  // reject scatter near the glow-pool, the entry arch, and every spawn site
  const reject = (x, z) => {
    if (Math.hypot(x - pool.x, z - pool.z) < 24) return true;       // glow-pool basin
    if (Math.hypot(x - arch.x, z - arch.z) < 12) return true;       // entry/return arch
    for (const s of SITES) if (Math.hypot(x - s.x, z - s.z) < 14) return true;
    return false;
  };

  // sample anywhere in the grotto interior (inside the moss-walled edges)
  const sampleX = () => H.x1 + 8 + rng() * (H.x2 - H.x1 - 16);
  const sampleZ = () => H.z1 + 8 + rng() * (H.z2 - H.z1 - 16);

  // ---- own ground mesh: displaced + vertex-colored moss floor ----
  // PlaneGeometry(120, 110) centred (0, −305), ~1.5u segments, lifted to heightAt.
  const groundGeo = new THREE.PlaneGeometry(120, 110, 80, 74);
  groundGeo.rotateX(-Math.PI / 2);                                  // into XZ
  {
    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 0;                                    // local -> world
      const z = pos.getZ(i) - 305;
      const h = heightAt(x, z);
      pos.setY(i, h);
      if (h < 12) col.copy(C_PEAT);
      else if (h < 22) col.copy(C_MOSS);
      else col.copy(C_LICHEN);
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
    }
    pos.needsUpdate = true;
    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();
  }
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshLambertMaterial({ vertexColors: true })
  );
  ground.position.set(0, 0, -305);
  ground.receiveShadow = true;
  group.add(ground);

  // ---- glow-pool inlays: flat additive discs at floor level (luminous tarn) ----
  const glowPools = [];
  const poolSpots = [
    { x: 0, z: -305, r: 18 },                                       // central basin
    { x: 30, z: -322, r: 6 },                                       // a side tarn
    { x: -36, z: -286, r: 5 },                                      // another
  ];
  for (const p of poolSpots) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(p.r, 36),
      new THREE.MeshBasicMaterial({
        color: 0x6fffb0, transparent: true, opacity: 0.4,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(p.x, heightAt(p.x, p.z) + 0.06, p.z);         // just above the floor
    group.add(disc);
    glowPools.push({ disc, phase: rng() * Math.PI * 2 });
  }

  // ---- glowcap mushrooms (stalk + flattened cap), instanced ----
  // two InstancedMesh sharing the same transforms — the signature silhouette.
  const capPts = [];
  for (let i = 0; i < 1000 && capPts.length < 120; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    if (heightAt(x, z) > 22) continue;                             // not up the grotto walls
    capPts.push({ x, z, h: heightAt(x, z), s: 0.6 + rng() * 1.1, r: rng() * Math.PI * 2 });
  }
  const stalkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 6);
  stalkGeo.translate(0, 0.7, 0);
  const stalkMat = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
  const capGeo = new THREE.SphereGeometry(0.9, 8, 6);
  capGeo.scale(1, 0.45, 1);                                         // flatten into a cap
  capGeo.translate(0, 1.4, 0);
  const capMat = new THREE.MeshLambertMaterial({ color: 0xff5ea8, emissive: 0x6a1c45 });

  const capStalks = new THREE.InstancedMesh(stalkGeo, stalkMat, capPts.length);
  const capCaps = new THREE.InstancedMesh(capGeo, capMat, capPts.length);
  capStalks.castShadow = capCaps.castShadow = true;
  capPts.forEach((t, i) => {
    tmpPos.set(t.x, t.h - 0.05, t.z);
    tmpQuat.setFromEuler(tmpEuler.set(0, t.r, 0));
    tmpScale.setScalar(t.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    capStalks.setMatrixAt(i, tmpMat);
    capCaps.setMatrixAt(i, tmpMat);
  });
  group.add(capStalks, capCaps);

  // ---- bracket-fungus shelves (trunk + 3 stacked shelf discs) — the "trees" ----
  const shelfPts = [];
  for (let i = 0; i < 800 && shelfPts.length < 90; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    if (heightAt(x, z) > 22) continue;
    shelfPts.push({ x, z, h: heightAt(x, z), s: 0.7 + rng() * 0.8, r: rng() * Math.PI * 2 });
  }
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.2, 6);
  trunkGeo.translate(0, 1.6, 0);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a2e22 });
  // three flattened shelves climbing the trunk (one geo, instanced thrice via offset)
  const shelfMat = new THREE.MeshLambertMaterial({ color: 0x8fd06a, emissive: 0x1e3a14 });
  const shelfGeoLo = new THREE.CylinderGeometry(2.2, 2.6, 0.4, 9); shelfGeoLo.translate(0, 1.2, 0);
  const shelfGeoMd = new THREE.CylinderGeometry(2.0, 2.4, 0.4, 9); shelfGeoMd.translate(0, 2.1, 0);
  const shelfGeoHi = new THREE.CylinderGeometry(1.6, 2.0, 0.4, 9); shelfGeoHi.translate(0, 2.9, 0);
  const bTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, shelfPts.length);
  const bShelfLo = new THREE.InstancedMesh(shelfGeoLo, shelfMat, shelfPts.length);
  const bShelfMd = new THREE.InstancedMesh(shelfGeoMd, shelfMat, shelfPts.length);
  const bShelfHi = new THREE.InstancedMesh(shelfGeoHi, shelfMat, shelfPts.length);
  bTrunks.castShadow = bShelfLo.castShadow = bShelfMd.castShadow = true;
  shelfPts.forEach((t, i) => {
    tmpPos.set(t.x, t.h - 0.05, t.z);
    tmpQuat.setFromEuler(tmpEuler.set(0, t.r, 0));
    tmpScale.setScalar(t.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    bTrunks.setMatrixAt(i, tmpMat);
    bShelfLo.setMatrixAt(i, tmpMat);
    bShelfMd.setMatrixAt(i, tmpMat);
    bShelfHi.setMatrixAt(i, tmpMat);
  });
  group.add(bTrunks, bShelfLo, bShelfMd, bShelfHi);

  // ---- glow-fern clusters (the grass-tuft analog: huge count, no shadow) ----
  const fernPts = [];
  for (let i = 0; i < 12000 && fernPts.length < 1400; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    if (heightAt(x, z) > 24) continue;
    fernPts.push({ x, z, h: heightAt(x, z), s: 0.6 + rng() * 0.9, r: rng() * Math.PI * 2, sway: rng() });
  }
  const fernGeo = new THREE.ConeGeometry(0.12, 0.7, 4);
  fernGeo.translate(0, 0.35, 0);
  const fernMat = new THREE.MeshLambertMaterial({ color: 0x7fffa0, emissive: 0x163d1e });
  const ferns = new THREE.InstancedMesh(fernGeo, fernMat, fernPts.length);
  const fernBase = [];                                              // remember base matrices for sway
  fernPts.forEach((t, i) => {
    tmpPos.set(t.x, t.h, t.z);
    tmpQuat.setFromEuler(tmpEuler.set(0, t.r, 0));
    tmpScale.set(t.s, t.s * (0.8 + rng() * 0.7), t.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    ferns.setMatrixAt(i, tmpMat);
    fernBase.push({ x: t.x, y: t.h, z: t.z, qy: t.r, sx: tmpScale.x, sy: tmpScale.y, sz: tmpScale.z, sway: t.sway });
  });
  group.add(ferns);

  // ---- root-arches & boulders (dodecahedra, mossy) ----
  const boulderPts = [];
  for (let i = 0; i < 600 && boulderPts.length < 50; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    boulderPts.push({ x, z, s: 0.8 + rng() * 1.9 });
  }
  const boulderGeo = new THREE.DodecahedronGeometry(0.9, 0);
  const boulderMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a, flatShading: true });
  const boulders = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderPts.length);
  boulders.castShadow = true;
  boulderPts.forEach((b, i) => {
    tmpPos.set(b.x, heightAt(b.x, b.z) + 0.1, b.z);
    tmpQuat.setFromEuler(tmpEuler.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6));
    tmpScale.set(b.s, b.s * (0.7 + rng() * 0.7), b.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    boulders.setMatrixAt(i, tmpMat);
  });
  group.add(boulders);

  // ---- rising-spore field (mirror of the frostveil snowfall, drifting UP) ----
  const SPORES = 110;
  const sporeGeo = new THREE.BufferGeometry();
  const sporePos = new Float32Array(SPORES * 3);
  const sporeBase = [];
  for (let i = 0; i < SPORES; i++) {
    const x = sampleX();
    const z = sampleZ();
    sporeBase.push({ x, z, h: heightAt(x, z), phase: rng() });
    sporePos[i * 3] = x; sporePos[i * 3 + 1] = heightAt(x, z) + 0.5; sporePos[i * 3 + 2] = z;
  }
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));
  const spores = new THREE.Points(
    sporeGeo,
    new THREE.PointsMaterial({ color: 0xbfffd0, size: 0.16, transparent: true, opacity: 0.6 })
  );
  group.add(spores);

  // ---- 3 drifting glow-motes near the elite pool (tiny additive sprites) ----
  const motes = [];
  const moteMat = new THREE.SpriteMaterial({
    color: 0x9fffc0, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Sprite(moteMat.clone());
    m.scale.setScalar(0.8);
    const a = rng() * Math.PI * 2;
    m.position.set(pool.x + Math.cos(a) * 8, heightAt(pool.x, pool.z) + 2 + rng() * 2, pool.z + Math.sin(a) * 8);
    group.add(m);
    motes.push({ sprite: m, phase: rng() * Math.PI * 2, base: m.position.clone() });
  }

  // ---- a few real lights (budget: ≤4), green/magenta, breathing flicker ----
  const lightDefs = [
    { x: 0, z: -258, color: 0x6fffb0 },                            // entry grove
    { x: 0, z: -305, color: 0xff5ea8 },                            // elite pool
    { x: 0, z: -345, color: 0x9fffb0 },                            // boss hollow
    { x: 0, z: -285, color: 0xb0ff8a },                            // warm mid-vale
  ];
  const lights = [];
  for (const d of lightDefs) {
    const light = new THREE.PointLight(d.color, 26, 34, 1.8);
    light.position.set(d.x, heightAt(d.x, d.z) + 1.5, d.z);
    group.add(light);
    lights.push(light);
  }

  // ---- arch (glow-grove rune arch; frostveil buildArch clone) ----
  // helper builds a post+lintel arch with a portal swirl + a spore-infill plate.
  const archMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });   // mossy posts
  const swirlMat = new THREE.MeshBasicMaterial({
    color: 0x6fffb0, transparent: true, opacity: 0.65, side: THREE.DoubleSide,
  });
  const infillMat = new THREE.MeshBasicMaterial({
    color: 0x7fffa0, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
  });

  function buildArch(x, z, faceZ) {
    const g = new THREE.Group();
    const y = heightAt(x, z);
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), archMat);
    postL.position.set(x - 1.3, y + 1.8, z);
    const postR = postL.clone();
    postR.position.x = x + 1.3;
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.8, 1.0), archMat);
    lintel.position.set(x, y + 3.8, z);
    postL.castShadow = postR.castShadow = lintel.castShadow = true;
    const swirl = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), swirlMat.clone());
    swirl.position.set(x, y + 1.9, z);
    if (faceZ) swirl.rotation.y = Math.PI / 2;
    // spore-infill plate fills the whole opening when the gate is closed
    const infill = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.3), infillMat.clone());
    infill.position.set(x, y + 1.9, z);
    if (faceZ) infill.rotation.y = Math.PI / 2;
    g.add(postL, postR, lintel, swirl, infill);
    group.add(g);
    return { group: g, swirl, infill, pos: new THREE.Vector3(x, y, z) };
  }

  // entry grove arch at (0, −258): BOTH the arrival point and the return portal.
  // The return portal is ungated (always open) — show the swirl, hide the infill.
  const entryArch = buildArch(0, -258, false);
  entryArch.infill.visible = false;

  // dungeon mouth arch at (0, −340): the spiral's center, the descent into The
  // Last Hour. GATED — show the spore-infill plate (closed) until the gate
  // predicate passes; update() flips swirl on / infill off when it opens.
  const dungeonArch = buildArch(0, -340, false);
  dungeonArch.swirl.visible = false;       // closed by default (gate not yet passed)
  dungeonArch.infill.visible = true;

  scene.add(group);

  // portal: return only (see contract §F). The entry gate (noctyra/level 102) is
  // enforced by the SANCTUM-side descent portal's predicate, not here.
  const portals = [
    {
      x: 0, z: -258, label: 'Climb back to the Sanctum',
      dest: { x: 0, z: 348, zone: 'sanctum' },
      arriveMsg: 'Cold stone. Silence. After the Hollow it feels like holding your breath.',
    },
    {
      // descent into The Last Hour. Geometry resolution: the Horologium is built
      // centered on x≈305 (mirroring CRYPT, which sits at x250..360 centered 305).
      // The contract's x=0 dungeon coords are SUPERSEDED — arrival lands at (305,210).
      x: 0, z: -340, label: 'Descend into The Last Hour',
      dest: { x: 305, z: 210, zone: 'horologium' },
      gate: (g) => g.slain.has('noctyra') || g.player.level >= 112,
      arriveMsg: 'The sand stops falling. Somewhere below, something very old hears you arrive and is, against all reason, glad.',
    },
  ];

  const signs = [
    { x: 0, z: -262, label: 'The Verdant Hollow — recommended level 102+. Mind the floor. The floor minds you.' },
    { x: -24, z: -296, label: '"The Mother-Bloom Pool. Do not drink. Do not touch. Do not, under any circumstances, taste. — G.T."' },
    // the z −332 signpost is the spiral's center (Iteration B's dungeon mouth) —
    // Tamsin Verge stands here; the integrator spawns her at (0, −332). The
    // dungeon arch is at z −340 (just past her), so this spot stays clear.
    { x: 0, z: -332, label: '"Below this point the spiral tightens. I went no further. Neither should you, but you will. — G.T."' },
    // dungeon mouth signpost (the descent into The Last Hour)
    { x: 0, z: -336, label: 'The Last Hour — recommended level 112+. Bring all the time you have.' },
  ];

  // ---- signposts (post + angled board), frostveil pattern ----
  const signMat = new THREE.MeshLambertMaterial({ color: 0x3a4a2a });
  for (const s of signs) {
    const sy = heightAt(s.x, s.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6), signMat);
    post.position.set(s.x, sy + 1.1, s.z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 0.15), signMat);
    board.position.set(s.x, sy + 2.0, s.z);
    board.rotation.y = -0.4;
    post.castShadow = board.castShadow = true;
    group.add(post, board);
  }

  function update(elapsed, game) {
    // glow-pool inlays breathe (warm-green tarn pulse)
    for (const gp of glowPools) {
      gp.disc.material.opacity = 0.32 + Math.sin(elapsed * 1.2 + gp.phase) * 0.14;
    }

    // glow-motes drift in slow loops around the elite pool
    for (const mt of motes) {
      mt.sprite.position.x = mt.base.x + Math.sin(elapsed * 0.5 + mt.phase) * 2.0;
      mt.sprite.position.y = mt.base.y + Math.sin(elapsed * 0.7 + mt.phase * 2) * 0.8;
      mt.sprite.position.z = mt.base.z + Math.cos(elapsed * 0.4 + mt.phase) * 2.0;
      mt.sprite.material.opacity = 0.5 + Math.sin(elapsed * 1.4 + mt.phase) * 0.25;
    }

    // green/magenta lights flicker (frostveil breathing cadence)
    for (let i = 0; i < lights.length; i++) {
      lights[i].intensity = 24 + Math.sin(elapsed * 4 + i * 2) * 4;
    }

    // glow-fern sway: tilt each tuft on a per-instance phase
    for (let i = 0; i < fernBase.length; i++) {
      const b = fernBase[i];
      const tilt = Math.sin(elapsed * 1.3 + b.sway * 12) * 0.12;
      tmpPos.set(b.x, b.y, b.z);
      tmpQuat.setFromEuler(tmpEuler.set(tilt, b.qy, tilt * 0.6));
      tmpScale.set(b.sx, b.sy, b.sz);
      tmpMat.compose(tmpPos, tmpQuat, tmpScale);
      ferns.setMatrixAt(i, tmpMat);
    }
    ferns.instanceMatrix.needsUpdate = true;

    // rising spores: mirror the frostveil snowfall but drift UP, recycling
    // each point from floor-level back to the ceiling once it tops out.
    const sp = sporeGeo.attributes.position.array;
    for (let i = 0; i < SPORES; i++) {
      const b = sporeBase[i];
      const t = (elapsed * (0.08 + b.phase * 0.12) + b.phase * 10) % 1;
      sp[i * 3] = b.x + Math.sin(elapsed * 0.4 + b.phase * 6) * 1.5;
      sp[i * 3 + 1] = b.h + 0.5 + t * 5.0;                          // rises from +0.5 to +5.5
      sp[i * 3 + 2] = b.z + Math.cos(elapsed * 0.3 + b.phase * 6) * 1.0;
    }
    sporeGeo.attributes.position.needsUpdate = true;

    // entry-arch swirl pulse + spin (always open — return portal is ungated)
    const pulse = 0.55 + Math.sin(elapsed * 2.4) * 0.18;
    entryArch.swirl.material.opacity = pulse;
    entryArch.swirl.rotation.z = elapsed * 0.8;

    // ---- dungeon-mouth gate visuals (nil-guarded) ----
    // Same predicate as the descent portal's gate: noctyra slain OR level ≥ 112.
    // Open → swirl on, infill off, swirl pulses/spins like the entry arch.
    // Closed → spore-infill plate holds the opening shut.
    if (game && game.player) {
      const open = game.slain.has('noctyra') || game.player.level >= 112;
      dungeonArch.swirl.visible = open;
      dungeonArch.infill.visible = !open;
      if (open) {
        dungeonArch.swirl.material.opacity = 0.5 + Math.sin(elapsed * 2.1 + 1) * 0.18;
        dungeonArch.swirl.rotation.z = -elapsed * 0.7;
      } else {
        // a slow shut-door shimmer on the infill while the hour stays sealed
        dungeonArch.infill.material.opacity = 0.42 + Math.sin(elapsed * 0.8) * 0.08;
      }
      // a soft pool-glow lift that reads as the grotto noticing the player
      glowPools[0].disc.material.opacity += Math.sin(elapsed * 0.9) * 0.03;
    }
  }

  return { update, portals, signs };
}
