import * as THREE from 'three';
import { heightAt, HIGHLANDS } from './noise.js';
import { HIGHLANDS_SITES } from './entities.js';

// The Ashen Highlands — the eastern shelf of the same continuous map (NOT a
// pocket). This builds every static mesh of the biome into one Group added to
// the shared scene: charred trees, obsidian rocks, lava-glow planes, ember
// particles, the mountain-pass gate, and the level-warning signpost.
// `setZone('highlands')` (main.js) crushes the meadow lighting so the lava
// lights placed here carry the scene.

const tmpMat = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpEuler = new THREE.Euler();

function makeRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}

export function buildHighlands(scene) {
  const group = new THREE.Group();
  const rng = makeRng(98765);
  const H = HIGHLANDS;

  // gate sits in the low pass corridor (z∈[-12,12]) where heightAt actually
  // carves the readable pass — NOT up on the z² pass wall at z=55. The player
  // arrives from Vexnar's arena (z≈55) and funnels down into the corridor here.
  const gx = H.GATE_X, gz = 0;
  const gateGround = heightAt(gx, gz);

  // reject scatter near the corridor, the gate, and the enemy sites
  const sites = Object.values(HIGHLANDS_SITES);
  const reject = (x, z) => {
    if (heightAt(x, z) > 22) return true;
    if (Math.abs(z) < 14 && x < gx + 20) return true;            // pass corridor
    if (Math.hypot(x - gx, z - gz) < 12) return true;            // gate
    for (const s of sites) if (Math.hypot(x - s.x, z - s.z) < 14) return true;
    return false;
  };

  const sampleX = () => H.BLEND_HI + rng() * (H.EAST_EDGE - H.BLEND_HI);
  const sampleZ = () => (rng() - 0.5) * 300;

  // ---- charred instanced trees (trunk + scorched canopy + ember crown) ----
  const treePts = [];
  for (let i = 0; i < 600 && treePts.length < 120; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    treePts.push({ x, z, h: heightAt(x, z), s: 0.7 + rng() * 0.9, r: rng() * Math.PI * 2 });
  }
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.0, 6);
  trunkGeo.translate(0, 1.0, 0);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x1c1410 });
  const canopyGeo = new THREE.ConeGeometry(1.2, 2.6, 6);
  canopyGeo.translate(0, 3.0, 0);
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0x2a1410 });
  const crownGeo = new THREE.ConeGeometry(0.55, 1.2, 6);
  crownGeo.translate(0, 3.4, 0);
  const crownMat = new THREE.MeshBasicMaterial({ color: 0xff5520, transparent: true, opacity: 0.5 });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePts.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treePts.length);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, treePts.length);
  trunks.castShadow = canopies.castShadow = true;
  treePts.forEach((t, i) => {
    tmpPos.set(t.x, t.h - 0.1, t.z);
    tmpQuat.setFromEuler(tmpEuler.set(0, t.r, 0));
    tmpScale.setScalar(t.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    trunks.setMatrixAt(i, tmpMat);
    canopies.setMatrixAt(i, tmpMat);
    crowns.setMatrixAt(i, tmpMat);
  });
  group.add(trunks, canopies, crowns);

  // ---- obsidian rocks + larger shards ----
  const rockPts = [];
  for (let i = 0; i < 500 && rockPts.length < 80; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    rockPts.push({ x, z, s: 0.5 + rng() * 1.4, big: false });
  }
  for (let i = 0; i < 200 && rockPts.filter((r) => r.big).length < 12; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    rockPts.push({ x, z, s: 1.8 + rng() * 1.7, big: true });
  }
  const rockGeo = new THREE.DodecahedronGeometry(0.9, 0);
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x14101a, flatShading: true });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockPts.length);
  rocks.castShadow = true;
  rockPts.forEach((r, i) => {
    tmpPos.set(r.x, heightAt(r.x, r.z) + 0.1, r.z);
    tmpQuat.setFromEuler(tmpEuler.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6));
    tmpScale.set(r.s, r.s * (0.7 + rng() * 0.6), r.s);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    rocks.setMatrixAt(i, tmpMat);
  });
  group.add(rocks);

  // ---- lava-glow accent planes (cheap emissive discs in low spots) ----
  const lavaPlanes = [];
  let lavaPlaced = 0;
  const lavaMat = () => new THREE.MeshBasicMaterial({ color: 0xff5018, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 400 && lavaPlaced < 11; i++) {
    const x = sampleX(), z = sampleZ();
    if (reject(x, z)) continue;
    if (heightAt(x, z) > 8) continue;            // pools sit in low cracks
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2 + rng() * 2, 16), lavaMat());
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, heightAt(x, z) + 0.05, z);
    group.add(disc);
    lavaPlanes.push({ mesh: disc, phase: rng() * Math.PI * 2 });
    lavaPlaced++;
  }

  // ---- a few real lights (budget: ≤3) at the biggest pools + boss arena ----
  const lavaLights = [];
  const lavaLightSpots = [
    lavaPlanes[0] ? lavaPlanes[0].mesh.position : new THREE.Vector3(185, heightAt(185, -20), -20),
    lavaPlanes[3] ? lavaPlanes[3].mesh.position : new THREE.Vector3(190, heightAt(190, 30), 30),
    new THREE.Vector3(HIGHLANDS_SITES.pyraxis.x, heightAt(HIGHLANDS_SITES.pyraxis.x, HIGHLANDS_SITES.pyraxis.z) + 2, HIGHLANDS_SITES.pyraxis.z),
  ];
  for (const spot of lavaLightSpots) {
    const light = new THREE.PointLight(0xff5020, 26, 30, 1.8);
    light.position.copy(spot);
    light.position.y += 1.5;
    group.add(light);
    lavaLights.push(light);
  }

  // ---- ember particle field (drifting over the plateau) ----
  const EMBERS = 80;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(EMBERS * 3);
  const emberBase = [];
  for (let i = 0; i < EMBERS; i++) {
    const x = H.BLEND_HI + rng() * (H.EAST_EDGE - H.BLEND_HI);
    const z = (rng() - 0.5) * 280;
    emberBase.push({ x, z, h: heightAt(x, z), phase: rng() });
    emberPos[i * 3] = x; emberPos[i * 3 + 1] = heightAt(x, z) + 1; emberPos[i * 3 + 2] = z;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const embers = new THREE.Points(
    emberGeo,
    new THREE.PointsMaterial({ color: 0xffaa40, size: 0.12, transparent: true, opacity: 0.75 })
  );
  group.add(embers);

  // ---- mountain-pass gate (walk-through landmark) ----
  const basaltMat = new THREE.MeshLambertMaterial({ color: 0x241820 });
  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7, 1.4), basaltMat);
  pillarL.position.set(gx, gateGround + 3.5, gz + 4);
  const pillarR = pillarL.clone();
  pillarR.position.z = gz - 4;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 1.6), basaltMat);
  lintel.position.set(gx, gateGround + 7, gz);
  pillarL.castShadow = pillarR.castShadow = lintel.castShadow = true;
  group.add(pillarL, pillarR, lintel);

  // brazier flames atop the pillars
  const braziers = [];
  for (const pz of [gz + 4, gz - 4]) {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0xff7020 }));
    flame.position.set(gx, gateGround + 7.6, pz);
    group.add(flame);
    braziers.push(flame);
  }
  const gatePos = new THREE.Vector3(gx, gateGround, gz);

  // ---- level-warning signpost (west of the arch, safe side) ----
  const signX = gx - 6, signZ = gz;
  const signGround = heightAt(signX, signZ);
  const signMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
  const signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6), signMat);
  signPost.position.set(signX, signGround + 1.1, signZ);
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 0.15), signMat);
  signBoard.position.set(signX, signGround + 2.0, signZ);
  signBoard.rotation.y = -0.4;                 // angled to face the approaching player
  signPost.castShadow = signBoard.castShadow = true;
  group.add(signPost, signBoard);
  const signPos = new THREE.Vector3(signX, signGround, signZ);

  scene.add(group);

  function update(elapsed) {
    for (const lp of lavaPlanes) lp.mesh.material.opacity = 0.6 + Math.sin(elapsed * 1.8 + lp.phase) * 0.2;
    for (let i = 0; i < lavaLights.length; i++) lavaLights[i].intensity = 24 + Math.sin(elapsed * 4 + i * 2) * 4;
    for (let i = 0; i < braziers.length; i++) braziers[i].scale.setScalar(0.85 + Math.sin(elapsed * 10 + i * 3) * 0.18);
    // drift the ember field upward and recycle per-point
    const p = emberGeo.attributes.position.array;
    for (let i = 0; i < EMBERS; i++) {
      const b = emberBase[i];
      const t = (elapsed * (0.1 + b.phase * 0.15) + b.phase * 10) % 1;
      p[i * 3] = b.x + Math.sin(elapsed * 0.4 + b.phase * 6) * 1.5;
      p[i * 3 + 1] = b.h + 0.5 + t * 4.5;
      p[i * 3 + 2] = b.z + Math.cos(elapsed * 0.3 + b.phase * 6) * 1.5;
    }
    emberGeo.attributes.position.needsUpdate = true;
  }

  return { update, gatePos, signPos, npcPos: new THREE.Vector3(gx - 5, gateGround, gz) };
}
