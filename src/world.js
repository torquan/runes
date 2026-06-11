import * as THREE from 'three';
import { fbm, heightAt, WORLD_SIZE, HIGHLANDS } from './noise.js';

export { heightAt, WORLD_SIZE };

const tmpMat = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpEuler = new THREE.Euler();

// deterministic prng for scatter placement
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildWorld(scene) {
  // --- atmosphere: late-afternoon gold ---
  scene.background = new THREE.Color(0x9ec4e8);
  scene.fog = new THREE.Fog(0xc4d4e0, 60, 230);

  const hemi = new THREE.HemisphereLight(0xbed8ff, 0x6a5a38, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe0b0, 1.6);
  sun.position.set(-60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.far = 260;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);

  // --- sky dome with painted gradient ---
  const skyGeo = new THREE.SphereGeometry(480, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {},
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 horizon = vec3(0.96, 0.84, 0.62);
        vec3 zenith  = vec3(0.38, 0.58, 0.86);
        vec3 col = mix(horizon, zenith, pow(h, 0.55));
        // sun glow to the west
        float sunGlow = pow(max(dot(normalize(vDir), normalize(vec3(-0.55, 0.42, 0.38))), 0.0), 18.0);
        col += vec3(1.0, 0.75, 0.4) * sunGlow * 0.8;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // --- terrain ---
  const SEG = 180;
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassA = new THREE.Color(0x6fae46);
  const grassB = new THREE.Color(0x4d8a35);
  const dirt = new THREE.Color(0x9a7a4a);
  const rock = new THREE.Color(0x8a8478);
  // Ashen Highlands palette: cracked basalt + ember-warm dirt
  const ashA = new THREE.Color(0x4a3a36);
  const ashB = new THREE.Color(0x2e2422);
  const basalt = new THREE.Color(0x1c1820);
  const ember = new THREE.Color(0x7a2410);
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);

    const tint = fbm(x * 0.05 + 3.3, z * 0.05 + 8.8, 3);
    c.copy(grassA).lerp(grassB, tint);
    // dirt paths radiating from camp + worn camp ground
    const d = Math.hypot(x, z);
    const pathAngle = Math.atan2(z, x);
    const onPath =
      d < 13 ||
      (Math.abs(pathAngle - 0.5) < 0.085 && d < 120) ||
      (Math.abs(pathAngle + 2.2) < 0.085 && d < 100);
    if (onPath) c.copy(dirt).lerp(c, 0.25 + tint * 0.2);
    if (h > 9) c.lerp(rock, Math.min(1, (h - 9) / 7));
    // ---- Ashen Highlands biome tint (blends in over the same band as heightAt) ----
    if (x > HIGHLANDS.BLEND_LO) {
      const bt = Math.min(1, (x - HIGHLANDS.BLEND_LO) / (HIGHLANDS.BLEND_HI - HIGHLANDS.BLEND_LO));
      const ash = ashA.clone().lerp(ashB, tint);
      if (h > 9) ash.lerp(basalt, Math.min(1, (h - 9) / 8));
      // ember veins glow in the low cracks
      const vein = fbm(x * 0.12 + 88, z * 0.12 + 5, 2);
      if (vein > 0.62 && h < 9) ash.lerp(ember, (vein - 0.62) * 1.4);
      c.lerp(ash, bt);
    }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({ vertexColors: true })
  );
  terrain.receiveShadow = true;
  scene.add(terrain);

  // --- water ring beyond the rim (visual horizon trick) ---
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(470, 48),
    new THREE.MeshLambertMaterial({ color: 0x3a6f9e })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -7.5;
  scene.add(water);

  const rng = makeRng(1337);
  const BANDIT_CAMP = { x: Math.cos(-2.2) * 95, z: Math.sin(-2.2) * 95 };
  const TRIAL_SITES = [
    { x: 0, z: -125 },   // Korgrim
    { x: 125, z: 55 },   // Vexnar
    { x: -105, z: 95 },  // Morgrath
  ];
  const scatterAvoid = (x, z) =>
    Math.hypot(x, z) < 18 ||
    Math.hypot(x - BANDIT_CAMP.x, z - BANDIT_CAMP.z) < 14 ||
    TRIAL_SITES.some((s) => Math.hypot(x - s.x, z - s.z) < 18);

  // --- pine trees (instanced: trunk + 3 canopy cones merged via 2 meshes) ---
  const TREES = 380;
  const treePts = [];
  for (let i = 0; i < TREES * 3 && treePts.length < TREES; i++) {
    const x = (rng() - 0.5) * WORLD_SIZE * 0.92;
    const z = (rng() - 0.5) * WORLD_SIZE * 0.92;
    const h = heightAt(x, z);
    if (scatterAvoid(x, z) || h > 10 || h < -1.5) continue;
    const density = fbm(x * 0.03 + 51, z * 0.03 + 17, 3);
    if (density < 0.52) continue;
    treePts.push({ x, z, h, s: 0.75 + rng() * 0.8, r: rng() * Math.PI * 2 });
  }

  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.2, 6);
  trunkGeo.translate(0, 1.1, 0);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6e4a26 });
  const canopyGeo = new THREE.ConeGeometry(1.7, 4.6, 7);
  canopyGeo.translate(0, 4.0, 0);
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2e6b34 });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePts.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treePts.length);
  trunks.castShadow = canopies.castShadow = true;
  treePts.forEach((t, i) => {
    tmpPos.set(t.x, t.h - 0.1, t.z);
    tmpQuat.setFromEuler(tmpEuler.set(0, t.r, 0));
    tmpScale.setScalar(t.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    trunks.setMatrixAt(i, tmpMat);
    canopies.setMatrixAt(i, tmpMat);
  });
  scene.add(trunks, canopies);

  // --- rocks ---
  const ROCKS = 140;
  const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x8a8478, flatShading: true });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, ROCKS);
  rocks.castShadow = true;
  for (let i = 0; i < ROCKS; i++) {
    const x = (rng() - 0.5) * WORLD_SIZE * 0.92;
    const z = (rng() - 0.5) * WORLD_SIZE * 0.92;
    if (scatterAvoid(x, z)) { i--; continue; }
    tmpPos.set(x, heightAt(x, z) + 0.1, z);
    tmpQuat.setFromEuler(tmpEuler.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6));
    const s = 0.4 + rng() * 1.6;
    tmpScale.set(s, s * (0.6 + rng() * 0.5), s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    rocks.setMatrixAt(i, tmpMat);
  }
  scene.add(rocks);

  // --- grass tufts ---
  const TUFTS = 1600;
  const tuftGeo = new THREE.ConeGeometry(0.09, 0.55, 4);
  tuftGeo.translate(0, 0.26, 0);
  const tuftMat = new THREE.MeshLambertMaterial({ color: 0x7dbf52 });
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, TUFTS);
  for (let i = 0; i < TUFTS; i++) {
    const x = (rng() - 0.5) * WORLD_SIZE * 0.8;
    const z = (rng() - 0.5) * WORLD_SIZE * 0.8;
    const h = heightAt(x, z);
    if (h > 8) { i--; continue; }
    tmpPos.set(x, h, z);
    tmpQuat.setFromEuler(tmpEuler.set((rng() - 0.5) * 0.5, rng() * Math.PI, (rng() - 0.5) * 0.5));
    tmpScale.setScalar(0.7 + rng() * 1.3);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    tufts.setMatrixAt(i, tmpMat);
  }
  scene.add(tufts);

  // --- pioneer camp ---
  const camp = new THREE.Group();

  // campfire
  const fire = new THREE.Group();
  const logMat = new THREE.MeshLambertMaterial({ color: 0x4a3017 });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.1, 5), logMat);
    log.rotation.z = Math.PI / 2.6;
    log.rotation.y = (i / 4) * Math.PI * 2;
    log.position.y = 0.22;
    fire.add(log);
  }
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x6e6a60 });
  for (let i = 0; i < 7; i++) {
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), stoneMat);
    const a = (i / 7) * Math.PI * 2;
    st.position.set(Math.cos(a) * 0.75, 0.08, Math.sin(a) * 0.75);
    fire.add(st);
  }
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.9, 6),
    new THREE.MeshBasicMaterial({ color: 0xff9a30, transparent: true, opacity: 0.92 })
  );
  flame.position.y = 0.7;
  fire.add(flame);
  const fireLight = new THREE.PointLight(0xff8830, 14, 16, 1.8);
  fireLight.position.y = 1.0;
  fire.add(fireLight);
  fire.position.set(2.5, heightAt(2.5, -1) , -1);
  camp.add(fire);

  // tents
  const tentMat = new THREE.MeshLambertMaterial({ color: 0xa8855a });
  const tentDark = new THREE.MeshLambertMaterial({ color: 0x6e5538 });
  [[-4, -5, 0.6], [-6.5, 1.5, -0.8]].forEach(([tx, tz, ry]) => {
    const tent = new THREE.Group();
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 1.9, 2.1, 4, 1, true), tentMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.05;
    roof.castShadow = true;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.12, 4), tentDark);
    base.rotation.y = Math.PI / 4;
    base.position.y = 0.06;
    tent.add(roof, base);
    tent.position.set(tx, heightAt(tx, tz), tz);
    tent.rotation.y = ry;
    camp.add(tent);
  });

  // crates and a banner
  const crateMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3e });
  [[1.5, 3.2], [2.3, 3.6], [1.9, 3.0]].forEach(([cx, cz], i) => {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), crateMat);
    crate.position.set(cx, heightAt(cx, cz) + 0.35 + (i === 2 ? 0.7 : 0), cz);
    crate.rotation.y = i * 0.5;
    crate.castShadow = true;
    camp.add(crate);
  });
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x5a4426 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 5), poleMat);
  pole.position.set(-1, heightAt(-1, 4) + 1.8, 4);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x2f4a6e, side: THREE.DoubleSide })
  );
  banner.position.set(-0.42, heightAt(-1, 4) + 2.9, 4);
  camp.add(pole, banner);
  scene.add(camp);

  // --- bandit camp on the northwest ridge ---
  const banditCamp = new THREE.Group();
  const darkTentMat = new THREE.MeshLambertMaterial({ color: 0x4a3038 });
  const darkBaseMat = new THREE.MeshLambertMaterial({ color: 0x2a1c20 });
  [[-3.5, -3, 0.4], [3, -4, -0.9], [0.5, 4, 2.1]].forEach(([ox, oz, ry]) => {
    const tx = BANDIT_CAMP.x + ox, tz = BANDIT_CAMP.z + oz;
    const tent = new THREE.Group();
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 2.1, 2.3, 4, 1, true), darkTentMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 1.15;
    roof.castShadow = true;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.12, 4), darkBaseMat);
    base.rotation.y = Math.PI / 4;
    base.position.y = 0.06;
    tent.add(roof, base);
    tent.position.set(tx, heightAt(tx, tz), tz);
    tent.rotation.y = ry;
    banditCamp.add(tent);
  });
  const bPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.2, 5), poleMat);
  bPole.position.set(BANDIT_CAMP.x, heightAt(BANDIT_CAMP.x, BANDIT_CAMP.z) + 2.1, BANDIT_CAMP.z);
  const bBanner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.8),
    new THREE.MeshLambertMaterial({ color: 0x8e2f2a, side: THREE.DoubleSide })
  );
  bBanner.position.set(BANDIT_CAMP.x - 0.5, heightAt(BANDIT_CAMP.x, BANDIT_CAMP.z) + 3.4, BANDIT_CAMP.z);
  banditCamp.add(bPole, bBanner);
  [[-1.5, 1.8], [-2.2, 2.4], [2.2, 2.2]].forEach(([ox, oz], i) => {
    const cx = BANDIT_CAMP.x + ox, cz = BANDIT_CAMP.z + oz;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), crateMat);
    crate.position.set(cx, heightAt(cx, cz) + 0.35, cz);
    crate.rotation.y = i * 0.7;
    crate.castShadow = true;
    banditCamp.add(crate);
  });
  scene.add(banditCamp);

  // --- sentinel stone circles mark the trial arenas ---
  const stoneRingMat = new THREE.MeshLambertMaterial({ color: 0x5e5a52 });
  const runeMat = new THREE.MeshBasicMaterial({ color: 0x8ad9ff });
  const trialArenas = {};
  const TRIAL_KEYS = ['korgrim', 'vexnar', 'morgrath'];
  for (const [siteIdx, site] of TRIAL_SITES.entries()) {
    const arena = new THREE.Group();
    arena.visible = false; // revealed when the quest chain reaches this trial
    trialArenas[TRIAL_KEYS[siteIdx]] = arena;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const px = site.x + Math.cos(a) * 13;
      const pz = site.z + Math.sin(a) * 13;
      const h = 2.8 + ((i * 37) % 10) / 8;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, h, 1.0), stoneRingMat);
      pillar.position.set(px, heightAt(px, pz) + h / 2 - 0.3, pz);
      pillar.rotation.y = a + 0.4;
      pillar.rotation.z = ((i * 13) % 7 - 3) * 0.02;
      pillar.castShadow = true;
      arena.add(pillar);
      // a faint rune glows on every other stone
      if (i % 2 === 0) {
        const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.6), runeMat);
        rune.position.set(
          site.x + Math.cos(a) * 12.4,
          heightAt(px, pz) + h * 0.55,
          site.z + Math.sin(a) * 12.4
        );
        rune.lookAt(site.x, rune.position.y, site.z);
        arena.add(rune);
      }
    }
    scene.add(arena);
  }

  // --- secrets: Madge's hut, the Stillest Pond, Bodo's cairn ---
  // Hermit Madge's driftwood hut, high on the southwest rim (the climb IS the secret)
  const MADGE = { x: -118, z: -96 };
  {
    const hy = heightAt(MADGE.x, MADGE.z);
    const hutMat = new THREE.MeshLambertMaterial({ color: 0x7a6a52 });
    const hutDark = new THREE.MeshLambertMaterial({ color: 0x4a4036 });
    const hutBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 2.8), hutMat);
    hutBase.position.set(MADGE.x - 2.5, hy + 1.0, MADGE.z - 1.5);
    hutBase.rotation.y = 0.5;
    const hutRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.6, 4), hutDark);
    hutRoof.position.set(MADGE.x - 2.5, hy + 2.7, MADGE.z - 1.5);
    hutRoof.rotation.y = 0.5 + Math.PI / 4;
    hutBase.castShadow = hutRoof.castShadow = true;
    scene.add(hutBase, hutRoof);
  }

  // the Stillest Pond — a quiet blue eye in the meadow (F to fish)
  const POND = { x: 58, z: -72 };
  {
    const py = heightAt(POND.x, POND.z);
    const water2 = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 20),
      new THREE.MeshLambertMaterial({ color: 0x3a6f9e, transparent: true, opacity: 0.85 })
    );
    water2.rotation.x = -Math.PI / 2;
    water2.position.set(POND.x, py + 0.08, POND.z);
    scene.add(water2);
    const reedMat = new THREE.MeshLambertMaterial({ color: 0x4d8a35 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const rx = POND.x + Math.cos(a) * (3.4 + (i % 3) * 0.3);
      const rz = POND.z + Math.sin(a) * (3.4 + ((i + 1) % 3) * 0.3);
      const reed = new THREE.Mesh(new THREE.ConeGeometry(0.07, 1.1 + (i % 3) * 0.3, 4), reedMat);
      reed.position.set(rx, heightAt(rx, rz) + 0.5, rz);
      scene.add(reed);
    }
  }

  // Bodo's cairn, at his old lair (a second stone joins it when his sire falls)
  const CAIRN = { x: 94.8, z: 51.8 };
  {
    const cy = heightAt(CAIRN.x, CAIRN.z);
    const cairnMat = new THREE.MeshLambertMaterial({ color: 0x6e6a60 });
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34 - i * 0.06, 0), cairnMat);
      st.position.set(CAIRN.x, cy + 0.2 + i * 0.32, CAIRN.z);
      st.rotation.y = i * 1.3;
      st.castShadow = true;
      scene.add(st);
    }
  }

  // --- campfire ember particles ---
  const EMBERS = 40;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(EMBERS * 3);
  const emberSeed = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) emberSeed[i] = Math.random();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const embers = new THREE.Points(
    emberGeo,
    new THREE.PointsMaterial({ color: 0xffaa40, size: 0.09, transparent: true, opacity: 0.9 })
  );
  embers.position.copy(fire.position);
  scene.add(embers);

  function update(dt, elapsed, playerPos) {
    // flame flicker
    flame.scale.setScalar(0.85 + Math.sin(elapsed * 11) * 0.12 + Math.sin(elapsed * 23) * 0.06);
    fireLight.intensity = 12 + Math.sin(elapsed * 9) * 2.5 + Math.sin(elapsed * 27) * 1.2;
    // embers spiral up and recycle
    const p = emberGeo.attributes.position.array;
    for (let i = 0; i < EMBERS; i++) {
      const t = (elapsed * (0.35 + emberSeed[i] * 0.4) + emberSeed[i] * 10) % 1;
      const a = emberSeed[i] * Math.PI * 2 + elapsed * 1.5;
      p[i * 3] = Math.cos(a) * 0.25 * (1 - t);
      p[i * 3 + 1] = 0.6 + t * 2.6;
      p[i * 3 + 2] = Math.sin(a) * 0.25 * (1 - t);
    }
    emberGeo.attributes.position.needsUpdate = true;
    // shadow camera follows player
    if (playerPos) {
      sun.position.set(playerPos.x - 60, 90, playerPos.z + 40);
      sun.target.position.set(playerPos.x, 0, playerPos.z);
    }
  }

  return {
    terrain, update, sunLight: sun, hemi, sky, trialArenas,
    madgePos: new THREE.Vector3(MADGE.x, heightAt(MADGE.x, MADGE.z), MADGE.z),
    pondPos: new THREE.Vector3(POND.x, heightAt(POND.x, POND.z), POND.z),
    cairnPos: new THREE.Vector3(CAIRN.x, heightAt(CAIRN.x, CAIRN.z), CAIRN.z),
  };
}
