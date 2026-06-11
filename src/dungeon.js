import * as THREE from 'three';
import { heightAt, CRYPT } from './noise.js';

// The Sunken Crypt — an underground pocket east of nowhere.
// Layout (floor y = CRYPT.floor, all coordinates in world space):
//   entry room -> corridor -> great hall (Ossus) -> corridor -> throne room (Vargoth)

const F = CRYPT.floor;
const WALL_H = 5;

// wall segments as thin AABBs: [x1, z1, x2, z2] (axis-aligned, thickness 1)
const WALLS = [
  // entry room (258..280, -11..11), door east at z -2..2
  [258, -11, 280, -10], [258, 10, 280, 11], [258, -11, 259, 11],
  [279, -11, 280, -2], [279, 2, 280, 11],
  // corridor A (280..292, -3..3)
  [280, -4, 292, -3], [280, 3, 292, 4],
  // great hall (292..318, -14..14), doors west/east at z -2..2
  [292, -14, 318, -13], [292, 13, 318, 14],
  [292, -14, 293, -2], [292, 2, 293, 14],
  [317, -14, 318, -2], [317, 2, 318, 14],
  // corridor B (318..326, -3..3)
  [318, -4, 326, -3], [318, 3, 326, 4],
  // throne room (326..346, -11..11)
  [326, -11, 346, -10], [326, 10, 346, 11],
  [326, -11, 327, -2], [326, 2, 327, 11],
  [345, -11, 346, 11],
];

export function buildDungeon(scene) {
  const group = new THREE.Group();

  const stone = new THREE.MeshLambertMaterial({ color: 0x4a4650 });
  const darkStone = new THREE.MeshLambertMaterial({ color: 0x36323e });
  const bone = new THREE.MeshLambertMaterial({ color: 0xc8bca0 });

  // floor + scattered flagstone tint
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(110, 120), darkStone);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((CRYPT.x1 + CRYPT.x2) / 2, F, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // walls
  const wallBoxes = [];
  for (const [x1, z1, x2, z2] of WALLS) {
    const w = x2 - x1, d = z2 - z1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), stone);
    mesh.position.set((x1 + x2) / 2, F + WALL_H / 2, (z1 + z2) / 2);
    mesh.castShadow = true;
    group.add(mesh);
    wallBoxes.push({ x1, z1, x2, z2 });
  }

  // green braziers light the way
  const torches = [];
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x7aff9a });
  [[270, -8], [270, 8], [296, -10], [296, 10], [314, -10], [314, 10], [330, -7], [330, 7], [342, 0]]
    .forEach(([tx, tz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 5), darkStone);
      post.position.set(tx, F + 0.8, tz);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.25, 6), stone);
      bowl.position.set(tx, F + 1.7, tz);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), flameMat);
      flame.position.set(tx, F + 2.05, tz);
      group.add(post, bowl, flame);
      torches.push(flame);
    });
  // a handful of real lights (not one per brazier — keep the GPU happy)
  [[270, 0], [305, 0], [336, 0]].forEach(([lx, lz]) => {
    const light = new THREE.PointLight(0x66ff88, 30, 36, 1.6);
    light.position.set(lx, F + 4, lz);
    group.add(light);
  });

  // sarcophagi along the great hall walls
  [[298, -10.5], [304, -10.5], [310, -10.5], [298, 10.5], [304, 10.5], [310, 10.5]].forEach(([sx, sz]) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.2), stone);
    s.position.set(sx, F + 0.55, sz);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.0), bone);
    lid.position.set(sx, F + 1.2, sz);
    s.castShadow = true;
    group.add(s, lid);
  });

  // bone piles
  for (let i = 0; i < 14; i++) {
    const bx = 262 + Math.abs(Math.sin(i * 7.3)) * 80;
    const bz = Math.sin(i * 3.1) * 9;
    const pile = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), bone);
    pile.position.set(bx, F + 0.2, bz);
    pile.scale.y = 0.5;
    pile.rotation.y = i * 1.7;
    group.add(pile);
  }

  // Vargoth's throne
  const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), darkStone);
  throneSeat.position.set(343.5, F + 0.6, 0);
  const throneBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.2, 2.2), darkStone);
  throneBack.position.set(344.4, F + 2.1, 0);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bone);
  skull.position.set(344.4, F + 4.5, 0);
  group.add(throneSeat, throneBack, skull);

  // ---- portals ----
  const portalMat = new THREE.MeshBasicMaterial({
    color: 0x8ad9ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide,
  });

  // overworld entrance: a crypt arch in the hills northwest of camp
  const entrance = new THREE.Group();
  const ex = -30, ez = 36;
  const ey = heightAt(ex, ez);
  const archMat = new THREE.MeshLambertMaterial({ color: 0x55505c });
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), archMat);
  postL.position.set(ex - 1.3, ey + 1.8, ez);
  const postR = postL.clone();
  postR.position.x = ex + 1.3;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.8, 1.0), archMat);
  lintel.position.set(ex, ey + 3.8, ez);
  const swirlIn = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), portalMat);
  swirlIn.position.set(ex, ey + 1.9, ez);
  postL.castShadow = postR.castShadow = lintel.castShadow = true;
  entrance.add(postL, postR, lintel, swirlIn);
  group.add(entrance);

  // crypt exit portal in the entry room
  const swirlOut = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), portalMat.clone());
  swirlOut.position.set(260.2, F + 1.9, 0);
  swirlOut.rotation.y = Math.PI / 2;
  group.add(swirlOut);

  scene.add(group);

  return {
    walls: wallBoxes,
    portals: [
      { x: ex, z: ez, label: 'Enter the Sunken Crypt', dest: { x: 263, z: 0, zone: 'crypt' } },
      { x: 260.2, z: 0, label: 'Leave the crypt', dest: { x: -27, z: 33, zone: 'world' } },
    ],
    update(elapsed) {
      const pulse = 0.55 + Math.sin(elapsed * 2.4) * 0.18;
      swirlIn.material.opacity = pulse;
      swirlOut.material.opacity = pulse;
      swirlIn.rotation.z = elapsed * 0.8;
      swirlOut.rotation.x = elapsed * 0.8;
      torches.forEach((t, i) => t.scale.setScalar(0.85 + Math.sin(elapsed * 9 + i * 2) * 0.18));
    },
  };
}
