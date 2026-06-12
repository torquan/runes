import * as THREE from 'three';
import { SANCTUM } from './noise.js';

// The Starfall Sanctum — a drowned astral observatory buried under the frozen
// tarn, the crypt plan rotated to run south->north.
// Layout (floor y = SANCTUM.floor, all coordinates in world space):
//   entry room -> corridor -> mid hall (Seraphel) -> corridor -> final hall (Noctyra)

const F = SANCTUM.floor;
const WALL_H = 5;

// wall segments as thin AABBs: [x1, z1, x2, z2] (axis-aligned, thickness 1).
// crypt plan rotated to run south->north; doors at x in [-2, 2].
// NOTE: gathering.js mirrors these room interiors (SANCTUM_ROOMS) to keep its
// star-shard nodes on walkable floor — keep the two in sync if the plan changes.
const WALLS = [
  // entry room x -11..11, z 258..280
  [-11, 258, -10, 280], [10, 258, 11, 280], [-11, 258, 11, 259],
  [-11, 279, -2, 280], [2, 279, 11, 280],
  // corridor A x -3..3, z 280..292
  [-4, 280, -3, 292], [3, 280, 4, 292],
  // mid hall x -13..13, z 292..318 (Seraphel)
  [-13, 292, -12, 318], [12, 292, 13, 318],
  [-13, 292, -2, 293], [2, 292, 13, 293],
  [-13, 317, -2, 318], [2, 317, 13, 318],
  // corridor B x -3..3, z 318..326
  [-4, 318, -3, 326], [3, 318, 4, 326],
  // final hall x -12..12, z 326..350 (Noctyra)
  [-12, 326, -11, 350], [11, 326, 12, 350],
  [-12, 326, -2, 327], [2, 326, 12, 327],
  [-12, 349, 12, 350],
];

export function buildSanctum(scene) {
  const group = new THREE.Group();

  const stone = new THREE.MeshLambertMaterial({ color: 0x232a4a });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x14182e });
  const gold = new THREE.MeshLambertMaterial({ color: 0xffd87a });
  const darkStone = new THREE.MeshLambertMaterial({ color: 0x1a1f38 });

  // floor — runs the length of the hall (south->north)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 110), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, F, (SANCTUM.z1 + SANCTUM.z2) / 2);
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

  // a handful of real lights (gold near the gates, white-blue in the deeps)
  [[0, 270, 0xffd87a], [0, 305, 0xffd87a], [0, 332, 0xcfe8ff], [0, 344, 0xcfe8ff]]
    .forEach(([lx, lz, color]) => {
      const light = new THREE.PointLight(color, 30, 36, 1.6);
      light.position.set(lx, F + 4, lz);
      group.add(light);
    });

  // star-glass floor inlays — faint emissive circles set flush in the floor
  const inlayMat = new THREE.MeshBasicMaterial({
    color: 0x6a5acd, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
  });
  [[0, 270], [-6, 305], [6, 305], [0, 305], [0, 332], [0, 342]].forEach(([cx, cz]) => {
    const inlay = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), inlayMat);
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.set(cx, F + 0.02, cz);
    group.add(inlay);
  });

  // star-shard clusters — pulsing tetrahedra (the crypt's bone piles, reimagined)
  const shardMat = new THREE.MeshBasicMaterial({ color: 0xcfe8ff });
  const shards = [];
  for (let i = 0; i < 14; i++) {
    // keep clear of the x in [-2, 2] door lane; cluster against the side walls
    const side = i % 2 ? 1 : -1;
    const sx = side * (4 + Math.abs(Math.sin(i * 7.3)) * 6);
    const sz = 262 + Math.abs(Math.sin(i * 3.1)) * 80;
    const cluster = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.32 + j * 0.12), shardMat);
      shard.position.set((j - 1) * 0.4, 0.2 + j * 0.18, Math.sin(j * 2.1) * 0.3);
      shard.rotation.set(i + j, j * 1.7, i * 0.5);
      cluster.add(shard);
    }
    cluster.position.set(sx, F, sz);
    cluster.rotation.y = i * 1.3;
    group.add(cluster);
    shards.push(cluster);
  }

  // 6 constellation pillars along the mid-hall walls (pillar + emissive star-map quad)
  const starMapMat = new THREE.MeshBasicMaterial({
    color: 0x9fb8ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide,
  });
  [[-11.2, 298], [-11.2, 305], [-11.2, 312], [11.2, 298], [11.2, 305], [11.2, 312]]
    .forEach(([px, pz]) => {
      const inner = px < 0 ? 1 : -1;        // face the quad into the hall
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 4.4, 6), darkStone);
      pillar.position.set(px, F + 2.2, pz);
      pillar.castShadow = true;
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.4), starMapMat);
      quad.position.set(px + inner * 0.62, F + 2.6, pz);
      quad.rotation.y = inner * Math.PI / 2;
      group.add(pillar, quad);
    });

  // slowly rotating orrery of 3 wireframe torus rings over the mid hall
  const orrery = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd87a, wireframe: true });
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2 - i * 0.5, 0.08, 6, 28), ringMat);
    ring.rotation.set(i * 0.7, i * 1.1, i * 0.4);
    orrery.add(ring);
    rings.push(ring);
  }
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), gold);
  orrery.add(core);
  orrery.position.set(0, F + 6, 305);
  group.add(orrery);

  // the Star Cradle at (0, 346): dais + a hovering, slowly tumbling dark icosahedron
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.6, 24), darkStone);
  dais.position.set(0, F + 0.3, 346);
  dais.receiveShadow = true;
  const trim = new THREE.Mesh(new THREE.TorusGeometry(3, 0.12, 8, 32), gold);
  trim.rotation.x = -Math.PI / 2;
  trim.position.set(0, F + 0.6, 346);
  const cradle = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), darkStone);
  cradle.position.set(0, F + 3.2, 346);
  cradle.castShadow = true;
  group.add(dais, trim, cradle);

  // astral-mote drift field — slow white-blue points rising through the deeps
  const moteCount = 60;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(moteCount * 3);
  const moteSeed = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (Math.sin(i * 12.9) ) * 11;
    motePos[i * 3 + 1] = F + 0.5 + (i / moteCount) * 6;
    motePos[i * 3 + 2] = 258 + (Math.abs(Math.sin(i * 5.7))) * 88;
    moteSeed[i] = i;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({
    color: 0xcfe8ff, size: 0.16, transparent: true, opacity: 0.75,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  group.add(motes);

  // ---- portals ----
  const portalMat = new THREE.MeshBasicMaterial({
    color: 0xffd87a, transparent: true, opacity: 0.65, side: THREE.DoubleSide,
  });

  // sanctum exit swirl in the entry room — climb back to the tarn
  const swirlOut = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), portalMat);
  swirlOut.position.set(0, F + 1.9, 260);
  group.add(swirlOut);

  // descent swirl deep in the final hall by the Star Cradle dais — the grotto
  // opened beneath where Noctyra fell. Green-tinted to read as the Hollow below.
  const descentMat = new THREE.MeshBasicMaterial({
    color: 0x6fffb0, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const swirlDown = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), descentMat);
  swirlDown.position.set(0, F + 1.9, 348);   // in front of the dais (z 346), back wall z 349
  group.add(swirlDown);

  scene.add(group);

  return {
    walls: wallBoxes,
    portals: [
      {
        x: 0, z: 260, label: 'Climb back to the tarn',
        dest: { x: -302, z: 5, zone: 'frostveil' },
        arriveMsg: 'Snow. Stars. Air that moves. You had missed all three.',
      },
      {
        x: 0, z: 350, label: 'Descend into the Verdant Hollow',
        dest: { x: 0, z: -258, zone: 'hollow' },
        gate: (g) => g.slain.has('noctyra') || g.player.level >= 102,
        arriveMsg: 'The floor is breathing. Green light, wet warmth, and the smell of a thousand springs at once. Something down here did not get the message that the world ended.',
      },
    ],
    update(elapsed) {
      // pulse the star-shards
      const pulse = 0.8 + Math.sin(elapsed * 2.2) * 0.2;
      shards.forEach((c, i) => c.scale.setScalar(pulse + Math.sin(elapsed * 1.5 + i) * 0.05));
      // exit swirl shimmer
      swirlOut.material.opacity = 0.55 + Math.sin(elapsed * 2.4) * 0.18;
      swirlOut.rotation.z = elapsed * 0.8;
      // descent swirl shimmer (the green pull of the Hollow below)
      swirlDown.material.opacity = 0.5 + Math.sin(elapsed * 2.1 + 1) * 0.18;
      swirlDown.rotation.z = -elapsed * 0.7;
      // rotate the orrery, each ring at its own lazy pace
      orrery.rotation.y = elapsed * 0.15;
      rings.forEach((r, i) => { r.rotation.z = elapsed * (0.2 + i * 0.12); });
      core.rotation.y = elapsed * 0.6;
      // tumble the dark icosahedron in the Star Cradle
      cradle.rotation.x = elapsed * 0.18;
      cradle.rotation.y = elapsed * 0.11;
      // drift the astral motes upward, wrapping back to the floor (elapsed-driven,
      // so it's framerate-independent like the rest of the update)
      const p = motes.geometry.attributes.position;
      for (let i = 0; i < moteCount; i++) {
        const speed = 0.5 + (moteSeed[i] % 5) * 0.15;        // u/s, per-mote
        const span = 6.5;
        const base = F + 0.5;
        p.array[i * 3 + 1] = base + ((moteSeed[i] * 0.37 + elapsed * speed) % span);
      }
      p.needsUpdate = true;
    },
  };
}
