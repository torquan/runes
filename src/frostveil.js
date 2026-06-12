import * as THREE from 'three';
import { heightAt, FROSTVEIL } from './noise.js';

// The Frostveil — a far western pocket of polar night under a living aurora
// (x≈−360..−250). Mirrors highlands.js: every static mesh of the biome builds
// into one Group added to the shared scene — snow pines, ice shards, snow
// boulders, the frozen tarn and its rune-stones, the aurora ribbons, a
// down-drifting snowfall field, and the two ice-runed arches that gate the
// valley and the Sanctum fissure. `setZone('frostveil')` (main.js) drops the
// meadow sun to moonlight so the cyan lights placed here carry the scene.

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
//   ice <9 #9fd0e8, snow 9..16 #dfe9f5, rock >16 #3c4a63
const C_ICE = new THREE.Color(0x9fd0e8);
const C_SNOW = new THREE.Color(0xdfe9f5);
const C_ROCK = new THREE.Color(0x3c4a63);

export function buildFrostveil(scene) {
  const group = new THREE.Group();
  const rng = makeRng(0x5be1);
  const F = FROSTVEIL;

  // the vale's landmarks (world coords): the frozen tarn bowl + the two arches.
  const tarn = { x: -305, z: 8 };                              // tarn / fissure centre
  const arch = { x: -263, z: 0 };                              // arrival arch (frostveil side)
  const exitArch = { x: -260, z: 0 };                          // return arch sits beside it
  // enemy spawn sites to keep clear of scatter (Hrimnir's knoll + §3 trash).
  // mirrored from entities.js so a scatter near a pull-radius can never block it.
  const SITES = [
    { x: -345, z: 32 },                                        // hrimnir's knoll
    { x: -285, z: 12 }, { x: -295, z: -18 }, { x: -310, z: 26 },
    { x: -300, z: -34 }, { x: -302, z: -31 }, { x: -298, z: -37 },
    { x: -326, z: 18 }, { x: -328, z: 21 }, { x: -324, z: 15 },
    { x: -318, z: -8 }, { x: -332, z: -22 }, { x: -344, z: 6 },
  ];

  // reject scatter near the tarn, both arches, and every spawn site
  const reject = (x, z) => {
    if (Math.hypot(x - tarn.x, z - tarn.z) < 26) return true;       // tarn
    if (Math.hypot(x - arch.x, z - arch.z) < 12) return true;       // arrival arch
    if (Math.hypot(x - exitArch.x, z - exitArch.z) < 12) return true;
    for (const s of SITES) if (Math.hypot(x - s.x, z - s.z) < 14) return true;
    return false;
  };

  // sample anywhere in the vale interior (inside the moraine walls)
  const sampleX = () => F.x1 + 8 + rng() * (F.x2 - F.x1 - 16);
  const sampleZ = () => F.z1 + 8 + rng() * (F.z2 - F.z1 - 16);

  // ---- own ground mesh: displaced + vertex-colored snowfield ----
  // PlaneGeometry(110, 120) centred (−305, 0), ~1.5u segments, lifted to heightAt.
  const groundGeo = new THREE.PlaneGeometry(110, 120, 72, 80);
  groundGeo.rotateX(-Math.PI / 2);                                  // into XZ
  {
    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) - 305;                                  // local -> world
      const z = pos.getZ(i) + 0;
      const h = heightAt(x, z);
      pos.setY(i, h);
      if (h < 9) col.copy(C_ICE);
      else if (h < 16) col.copy(C_SNOW);
      else col.copy(C_ROCK);
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
  ground.position.set(-305, 0, 0);
  ground.receiveShadow = true;
  group.add(ground);

  // ---- snow pines (trunk + needle cone + snowcap), instanced ----
  const pinePts = [];
  for (let i = 0; i < 900 && pinePts.length < 110; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    if (heightAt(x, z) > 22) continue;                             // not on the moraine crown
    pinePts.push({ x, z, h: heightAt(x, z), s: 0.7 + rng() * 0.9, r: rng() * Math.PI * 2 });
  }
  const pTrunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.0, 6);
  pTrunkGeo.translate(0, 1.0, 0);
  const pTrunkMat = new THREE.MeshLambertMaterial({ color: 0x2b2330 });
  const pNeedleGeo = new THREE.ConeGeometry(1.2, 2.6, 7);
  pNeedleGeo.translate(0, 3.0, 0);
  const pNeedleMat = new THREE.MeshLambertMaterial({ color: 0x2e4f46 });
  const pCapGeo = new THREE.ConeGeometry(0.7, 0.9, 7);
  pCapGeo.translate(0, 3.9, 0);
  const pCapMat = new THREE.MeshLambertMaterial({ color: 0xe8f2fb });

  const pineTrunks = new THREE.InstancedMesh(pTrunkGeo, pTrunkMat, pinePts.length);
  const pineNeedles = new THREE.InstancedMesh(pNeedleGeo, pNeedleMat, pinePts.length);
  const pineCaps = new THREE.InstancedMesh(pCapGeo, pCapMat, pinePts.length);
  pineTrunks.castShadow = pineNeedles.castShadow = true;
  pinePts.forEach((t, i) => {
    tmpPos.set(t.x, t.h - 0.1, t.z);
    tmpQuat.setFromEuler(tmpEuler.set(0, t.r, 0));
    tmpScale.setScalar(t.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    pineTrunks.setMatrixAt(i, tmpMat);
    pineNeedles.setMatrixAt(i, tmpMat);
    pineCaps.setMatrixAt(i, tmpMat);
  });
  group.add(pineTrunks, pineNeedles, pineCaps);

  // ---- ice shards (octahedra, translucent) — 70 scattered + 10 near the shard field ----
  const shardPts = [];
  for (let i = 0; i < 700 && shardPts.length < 70; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    shardPts.push({ x, z, s: 0.6 + rng() * 1.3, r: rng() * Math.PI * 2 });
  }
  // 10 clustered around the shard-field light at (−322, −16)
  for (let i = 0; i < 200 && shardPts.length < 80; i++) {
    const x = -322 + (rng() - 0.5) * 16, z = -16 + (rng() - 0.5) * 16;
    if (reject(x, z)) continue;
    shardPts.push({ x, z, s: 0.8 + rng() * 1.6, r: rng() * Math.PI * 2 });
  }
  const shardGeo = new THREE.OctahedronGeometry(0.8, 0);
  const shardMat = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.85 });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, shardPts.length);
  shardPts.forEach((sh, i) => {
    tmpPos.set(sh.x, heightAt(sh.x, sh.z) + sh.s * 0.7, sh.z);
    tmpQuat.setFromEuler(tmpEuler.set(rng() * 0.5, sh.r, rng() * 0.5));
    tmpScale.set(sh.s, sh.s * (1.0 + rng() * 0.8), sh.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    shards.setMatrixAt(i, tmpMat);
  });
  group.add(shards);

  // ---- snow boulders (dodecahedra) ----
  const boulderPts = [];
  for (let i = 0; i < 500 && boulderPts.length < 40; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    boulderPts.push({ x, z, s: 0.8 + rng() * 1.8 });
  }
  const boulderGeo = new THREE.DodecahedronGeometry(0.9, 0);
  const boulderMat = new THREE.MeshLambertMaterial({ color: 0xcfd8e6, flatShading: true });
  const boulders = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderPts.length);
  boulders.castShadow = true;
  boulderPts.forEach((b, i) => {
    tmpPos.set(b.x, heightAt(b.x, b.z) + 0.1, b.z);
    tmpQuat.setFromEuler(tmpEuler.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6));
    tmpScale.set(b.s, b.s * (0.7 + rng() * 0.6), b.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    boulders.setMatrixAt(i, tmpMat);
  });
  group.add(boulders);

  // ---- the frozen tarn: a translucent ice sheet over the bowl ----
  const tarnSheet = new THREE.Mesh(
    new THREE.CircleGeometry(24, 40),
    new THREE.MeshBasicMaterial({ color: 0xbfe4f5, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  tarnSheet.rotation.x = -Math.PI / 2;
  tarnSheet.position.set(tarn.x, 8.45, tarn.z);
  group.add(tarnSheet);

  // ---- 5 rune-stones ringing the tarn ----
  const runeStones = [];
  const runeStoneMat = new THREE.MeshLambertMaterial({ color: 0x3c4a63 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const rx = tarn.x + Math.cos(a) * 21;
    const rz = tarn.z + Math.sin(a) * 21;
    const ry = heightAt(rx, rz);
    const stone = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 0.6), runeStoneMat);
    stone.position.set(rx, ry + 1.5, rz);
    stone.rotation.y = -a;                                          // face the tarn
    stone.castShadow = true;
    const glyph = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 1.8),
      new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    glyph.position.set(0, 0.2, 0.31);                              // on the tarn-facing face
    stone.add(glyph);
    group.add(stone);
    runeStones.push({ glyph, phase: rng() * Math.PI * 2 });
  }

  // ---- 2 additive aurora planes, swaying high above the vale ----
  const auroras = [];
  for (let i = 0; i < 2; i++) {
    const geo = new THREE.PlaneGeometry(140, 10, 24, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6fffc9, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.position.set(tarn.x, 53 + i * 6, tarn.z + (i - 0.5) * 22);
    plane.rotation.x = -Math.PI / 2.3;
    group.add(plane);
    auroras.push({ plane, base: geo.attributes.position.array.slice(), phase: i * 1.7 });
  }

  // ---- snowfall field (mirror of the highlands ember field, drifting DOWN) ----
  const SNOW = 90;
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = new Float32Array(SNOW * 3);
  const snowBase = [];
  for (let i = 0; i < SNOW; i++) {
    const x = sampleX();
    const z = sampleZ();
    snowBase.push({ x, z, h: heightAt(x, z), phase: rng() });
    snowPos[i * 3] = x; snowPos[i * 3 + 1] = heightAt(x, z) + 5; snowPos[i * 3 + 2] = z;
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({ color: 0xe8f2fb, size: 0.14, transparent: true, opacity: 0.7 })
  );
  group.add(snow);

  // ---- a few real lights (budget: ≤3), cyan, lava-flicker ----
  const lightSpots = [
    new THREE.Vector3(-305, heightAt(-305, 10) + 1.5, 10),         // tarn shore
    new THREE.Vector3(-322, heightAt(-322, -16) + 1.5, -16),       // shard field
    new THREE.Vector3(-345, heightAt(-345, 32) + 1.5, 32),         // Hrimnir's knoll
  ];
  const lights = [];
  for (const spot of lightSpots) {
    const light = new THREE.PointLight(0x9fe8ff, 26, 30, 1.8);
    light.position.copy(spot);
    group.add(light);
    lights.push(light);
  }

  // ---- arches (ice-runed rune arches; crypt-entrance pattern) ----
  // helper builds a post+lintel arch with a portal swirl + an ice-infill plate.
  const archMat = new THREE.MeshLambertMaterial({ color: 0x4a5a78 });
  const swirlMat = new THREE.MeshBasicMaterial({
    color: 0x9fe8ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide,
  });
  const iceMat = new THREE.MeshBasicMaterial({
    color: 0xcfeaff, transparent: true, opacity: 0.78, side: THREE.DoubleSide,
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
    // ice-infill plate fills the whole opening when the gate is closed
    const ice = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.3), iceMat.clone());
    ice.position.set(x, y + 1.9, z);
    if (faceZ) ice.rotation.y = Math.PI / 2;
    g.add(postL, postR, lintel, swirl, ice);
    group.add(g);
    return { group: g, swirl, ice, pos: new THREE.Vector3(x, y, z) };
  }

  // 1. WORLD-side Frostveil arch at (−108, 18): gated, ice-sealed until unlocked
  const valeArch = buildArch(-108, 18, false);
  valeArch.swirl.visible = false;                                  // closed = swirl hidden
  valeArch.ice.visible = true;                                     //          ice shown
  let valeGateOpen = false;

  // 2. Return arch at (−260, 0) inside the Frostveil — always open, no ice plate
  const returnArch = buildArch(-260, 0, false);
  returnArch.ice.visible = false;

  // 3. Sanctum fissure at (−305, 8): a star-shaped crack in the tarn ice.
  //    Dark while gated; bleeds gold light once unlocked.
  const fissure = new THREE.Group();
  const fy = 8.45;
  const fissureMat = new THREE.MeshBasicMaterial({
    color: 0x110a22, transparent: true, opacity: 0.95, side: THREE.DoubleSide,
  });
  // a star polygon (5-point) carved into the tarn surface
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 2.6 : 1.05;
    const px = Math.cos(a) * r, pz = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(px, pz); else starShape.lineTo(px, pz);
  }
  starShape.closePath();
  const starGeo = new THREE.ShapeGeometry(starShape);
  starGeo.rotateX(-Math.PI / 2);
  const fissureStar = new THREE.Mesh(starGeo, fissureMat);
  fissureStar.position.set(-305, fy + 0.04, 8);
  // gold emissive glow that fills the star once unlocked (hidden while gated)
  const fissureGlow = new THREE.Mesh(
    starGeo.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xffd87a, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  fissureGlow.position.set(-305, fy + 0.05, 8);
  fissureGlow.visible = false;
  fissure.add(fissureStar, fissureGlow);
  group.add(fissure);
  // a gold point light that wakes when the fissure opens (lazy: 4th light, but
  // only ever lit, never both lit AND a 4th — it stays off/intensity-managed)
  const fissureLight = new THREE.PointLight(0xffd87a, 0, 26, 1.8);
  fissureLight.position.set(-305, fy + 2, 8);
  group.add(fissureLight);
  let fissureGateOpen = false;

  // ---- the Larder knock-mound: the secret hoard-pocket's discovery entrance ----
  // a half-buried DodecahedronGeometry cluster at the vale's darkest corner
  // (the aurora's dimmest band, x≈−340 z≈−40). Knock three times (main.js owns
  // the state machine) and openLarder() thaws it: the mound rotates open and a
  // swirlIn appears. The destination ROOM is the relocated LARDER pocket — only
  // the discovery prop lives here. larderMoundPos is exposed for the F-check.
  const moundX = -340, moundZ = -40;
  const moundY = heightAt(moundX, moundZ);
  const mound = new THREE.Group();
  const moundMat = new THREE.MeshLambertMaterial({ color: 0x3a3a44, flatShading: true });
  const moundSnowMat = new THREE.MeshLambertMaterial({ color: 0xe2ecf6, flatShading: true });
  // 3 half-sunk dodecahedra (mossy/snowy), clustered and partly below the snow
  [[0, 0, 1.5, moundMat], [-1.3, 0.6, 1.0, moundSnowMat], [1.1, -0.7, 1.1, moundMat]]
    .forEach(([dx, dz, s, mat]) => {
      const d = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
      d.position.set(dx, -s * 0.35, dz);                       // sunk: top pokes above ground
      d.rotation.set(dx * 0.6, dx + dz, dz * 0.5);
      d.castShadow = true;
      mound.add(d);
    });
  mound.position.set(moundX, moundY + 0.2, moundZ);
  group.add(mound);

  // swirlIn — the thawed entrance, hidden until openLarder()
  const moundSwirlMat = new THREE.MeshBasicMaterial({
    color: 0xffb060, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const moundSwirl = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), moundSwirlMat);
  moundSwirl.rotation.x = -Math.PI / 2;
  moundSwirl.position.set(moundX, moundY + 1.9, moundZ);
  moundSwirl.visible = false;
  group.add(moundSwirl);

  let larderOpened = false;
  function openLarder() {
    if (larderOpened) return;                                  // idempotent
    larderOpened = true;
    mound.rotation.x = -0.9;                                   // tip the cluster open (a thaw)
    mound.position.y = moundY - 0.4;                           // settle as it cracks
    moundSwirl.visible = true;
  }

  scene.add(group);

  // portal predicates per spec §1.2 (consumed by main.js nearestPortal via gate(game))
  const portals = [
    {
      x: -108, z: 18, label: 'Enter the Frostveil',
      dest: { x: -263, z: 0, zone: 'frostveil' },
      gate: (g) => g.slain.has('pyraxis') || g.player.level >= 78,
      arriveMsg: 'Cold that has nothing to do with weather. Overhead, the aurora pauses to look at you.',
    },
    {
      x: -260, z: 0, label: 'Return to the valley',
      dest: { x: -105, z: 18, zone: 'world' },
      arriveMsg: 'Daylight. You had forgotten it had a color.',
    },
    {
      x: -305, z: 8, label: 'Descend into the Starfall Sanctum',
      dest: { x: 0, z: 263, zone: 'sanctum' },
      gate: (g) => g.slain.has('hrimnir') || g.player.level >= 92,
      arriveMsg: 'The dark hums like held breath. Gold light bleeds between stones that remember falling.',
    },
  ];

  const signs = [
    { x: -112, z: 18, label: 'The Frostveil — recommended level 78+' },
    { x: -309, z: 12, label: '"The ice below is not ice. Recommended: level 95+, a full belly, and no regrets."' },
    { x: -336, z: -44, label: '"The badger digs where the aurora never reaches. Three knocks, then wait for the cold to answer."' },
  ];

  // ---- signposts (post + angled board), highlands pattern ----
  const signMat = new THREE.MeshLambertMaterial({ color: 0x3a4a5e });
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
    // aurora: sine sway of the ribbon + color lerp #6fffc9 <-> #8a7fff
    const lerp = (Math.sin(elapsed * 0.25) + 1) * 0.5;
    for (const a of auroras) {
      const pos = a.plane.geometry.attributes.position.array;
      for (let v = 0; v < pos.length; v += 3) {
        pos[v + 1] = a.base[v + 1] + Math.sin(elapsed * 0.5 + a.base[v] * 0.06 + a.phase) * 1.6;
      }
      a.plane.geometry.attributes.position.needsUpdate = true;
      a.plane.material.color.setRGB(
        0.435 + (0.541 - 0.435) * lerp,                            // 0x6f->0x8a
        1.0 + (0.498 - 1.0) * lerp,                                // 0xff->0x7f
        0.788 + (1.0 - 0.788) * lerp                               // 0xc9->0xff
      );
      a.plane.material.opacity = 0.12 + Math.sin(elapsed * 0.4 + a.phase) * 0.05;
    }

    // rune-stone glyph pulse
    for (const rs of runeStones) {
      rs.glyph.material.opacity = 0.55 + Math.sin(elapsed * 1.6 + rs.phase) * 0.3;
    }

    // ice-shard shimmer
    shardMat.opacity = 0.7 + Math.sin(elapsed * 2.2) * 0.15;

    // cyan lights flicker (lava-flicker cadence)
    for (let i = 0; i < lights.length; i++) {
      lights[i].intensity = 24 + Math.sin(elapsed * 4 + i * 2) * 4;
    }

    // snowfall: mirror the ember field but drift DOWN, recycling per-point
    const sp = snowGeo.attributes.position.array;
    for (let i = 0; i < SNOW; i++) {
      const b = snowBase[i];
      const t = (elapsed * (0.1 + b.phase * 0.15) + b.phase * 10) % 1;
      sp[i * 3] = b.x + Math.sin(elapsed * 0.4 + b.phase * 6) * 1.5;
      sp[i * 3 + 1] = b.h + 5.0 - t * 4.5;                          // falls from +5 to +0.5
      sp[i * 3 + 2] = b.z + Math.cos(elapsed * 0.3 + b.phase * 6) * 1.0;
    }
    snowGeo.attributes.position.needsUpdate = true;

    // portal swirl pulse + spin (only when visible)
    const pulse = 0.55 + Math.sin(elapsed * 2.4) * 0.18;
    valeArch.swirl.material.opacity = pulse;
    valeArch.swirl.rotation.z = elapsed * 0.8;
    returnArch.swirl.material.opacity = pulse;
    returnArch.swirl.rotation.z = elapsed * 0.8;

    // the thawed Larder mound-swirl (only animates once revealed)
    if (moundSwirl.visible) {
      moundSwirl.material.opacity = 0.45 + Math.sin(elapsed * 2.2) * 0.18;
      moundSwirl.rotation.z = elapsed * 0.7;
    }

    // ---- gate visuals: cheap per-frame check of the predicates (nil-guarded) ----
    if (game && game.player) {
      const valeShouldOpen = game.slain.has('pyraxis') || game.player.level >= 78;
      if (valeShouldOpen !== valeGateOpen) {
        valeGateOpen = valeShouldOpen;
        valeArch.swirl.visible = valeGateOpen;                     // open: swirl shows,
        valeArch.ice.visible = !valeGateOpen;                      //       ice melts away
      }
      const fissureShouldOpen = game.slain.has('hrimnir') || game.player.level >= 92;
      if (fissureShouldOpen !== fissureGateOpen) {
        fissureGateOpen = fissureShouldOpen;
        fissureGlow.visible = fissureGateOpen;
      }
    }
    // bleed gold light when open (pulsing); dark and inert when closed
    if (fissureGateOpen) {
      fissureGlow.material.opacity = 0.35 + Math.sin(elapsed * 1.8) * 0.2;
      fissureLight.intensity = 18 + Math.sin(elapsed * 3.2) * 6;
      fissureStar.material.color.setHex(0x2a1d10);                 // lit from below
    } else {
      fissureLight.intensity = 0;
    }
  }

  // the secret Larder entry portal — provided SEPARATELY, NOT pushed into
  // portals[]. main.js includes it in allPortals() ONLY when
  // secrets.pocket.larderOpen is true, so it appears on no minimap before
  // discovery. The destination is the relocated LARDER pocket room.
  const larderPortal = {
    x: -340, z: -40, label: 'Drop into the dark',
    dest: { x: 160, z: -350, zone: 'larder' },
    arriveMsg: 'It smells of old fur and older gold.',
  };

  return {
    update, portals, signs,
    larderMoundPos: new THREE.Vector3(moundX, moundY, moundZ),
    larderPortal,
    openLarder,
  };
}
