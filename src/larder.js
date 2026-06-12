import * as THREE from 'three';
import { LARDER } from './noise.js';

// The Larder — a secret frostbitten root-cellar dug under the world's SW corner
// by something that hoards. A tiny crypt-style room (~20×16, flat floor y=20),
// dim and amber and cozy-eerie: old fur, hoarded coin glints, and a frozen-over
// trapdoor in the ceiling (the only way in, dropped through from the Frostveil
// vale's knock-mound far above). Mirrors sanctum.js: build one Group, add it to
// the shared scene, return { walls (AABBs), portals, urns }.
//
// The room is the relocated LARDER pocket (x150-170, z-360..-340). The discovery
// entrance and the gated entry portal live in frostveil.js; larder.js owns only
// the room, its single exit, and the three urns the integrator F-checks by pos.

const F = LARDER.floor;          // flat floor, y = 20
const WALL_H = 5;
const CX = 160, CZ = -350;       // room center

// wall segments as thin AABBs: [x1, z1, x2, z2] (axis-aligned, thickness 1).
// They enclose x∈[150,170], z∈[-360,-340]; the ZONE_BOUNDS.larder clamp
// (x152-168, z-358..-342) keeps the player a couple units inside these.
const WALLS = [
  [150, -360, 170, -359],   // south wall (z low)
  [150, -341, 170, -340],   // north wall (z high)
  [150, -360, 151, -340],   // west wall  (x low)
  [169, -360, 170, -340],   // east wall  (x high)
];

export function buildLarder(scene) {
  const group = new THREE.Group();

  const stone = new THREE.MeshLambertMaterial({ color: 0x2a2018 });        // earthen wall
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x33271a });     // dark amber-brown
  const amber = new THREE.MeshLambertMaterial({ color: 0xffb060 });
  const darkWood = new THREE.MeshLambertMaterial({ color: 0x3a2c1c });
  const coin = new THREE.MeshBasicMaterial({ color: 0xffd87a });
  const fur = new THREE.MeshLambertMaterial({ color: 0x4a3a26 });

  // ---- floor ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(CX, F, CZ);
  floor.receiveShadow = true;
  group.add(floor);

  // ---- walls ----
  const wallBoxes = [];
  for (const [x1, z1, x2, z2] of WALLS) {
    const w = x2 - x1, d = z2 - z1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, WALL_H, d), stone);
    mesh.position.set((x1 + x2) / 2, F + WALL_H / 2, (z1 + z2) / 2);
    mesh.castShadow = true;
    group.add(mesh);
    wallBoxes.push({ x1, z1, x2, z2 });
  }

  // ---- low earthen ceiling so it reads as buried (no collision; cosmetic) ----
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), stone);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(CX, F + WALL_H, CZ);
  group.add(ceil);

  // ---- the frozen-over trapdoor in the ceiling: the way in from above ----
  const trap = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.3, 3.4),
    new THREE.MeshLambertMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.85 })
  );
  trap.position.set(CX, F + WALL_H - 0.16, CZ - 6);     // set into the ceiling, near the back
  group.add(trap);
  const trapFrame = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.12, 6, 16), darkWood);
  trapFrame.rotation.x = Math.PI / 2;
  trapFrame.position.set(CX, F + WALL_H - 0.05, CZ - 6);
  group.add(trapFrame);

  // ---- one amber PointLight over the room center ----
  const light = new THREE.PointLight(0xffb060, 28, 34, 1.6);
  light.position.set(CX, F + 3.2, CZ);
  group.add(light);

  // ---- dressing: heaped old fur (flattened low boxes against the walls) ----
  [[154, -358.2, 0.4], [167.4, -344, -0.6], [165, -358, 0.9]].forEach(([fx, fz, r]) => {
    const heap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 1.6), fur);
    heap.position.set(fx, F + 0.25, fz);
    heap.rotation.y = r;
    heap.castShadow = true;
    group.add(heap);
  });

  // ---- dressing: hoarded coin glints scattered on the floor (tiny basic discs) ----
  const coinGlints = [];
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996, rad = 2 + (i % 5) * 1.4;       // golden-angle scatter
    const cx = CX + Math.cos(a) * rad;
    const cz = CZ + Math.sin(a) * rad * 0.7;
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.14 + (i % 3) * 0.05, 8), coin);
    glint.rotation.x = -Math.PI / 2;
    glint.position.set(cx, F + 0.02, cz);
    group.add(glint);
    coinGlints.push(glint);
  }

  // ---- the three urns ----
  // sealed clay urns standing on the floor. ORDER MATTERS: urns[0] and urns[1]
  // are the gold urns, urns[2] is the relic urn — the integrator pays by index.
  // give the relic urn a richer cap so the eye is drawn to it.
  const urnBody = new THREE.MeshLambertMaterial({ color: 0x6b4a2e });
  const urnLid = new THREE.MeshLambertMaterial({ color: 0x4a3320 });
  const urnRelicLid = new THREE.MeshLambertMaterial({ color: 0xffd87a });

  function buildUrn(ux, uz, relic) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 1.2, 12), urnBody);
    body.position.y = 0.6;
    body.castShadow = true;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.28, 12), relic ? urnRelicLid : urnLid);
    lid.position.y = 1.32;
    g.add(body, lid);
    if (relic) {
      // a faint amber glow band so the relic urn quietly stands out
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.06, 6, 16), amber);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.9;
      g.add(band);
    }
    g.position.set(ux, F, uz);
    group.add(g);
    return g;
  }

  const urnSpots = [
    { x: 155, z: -350, relic: false },   // urns[0] — gold
    { x: 165, z: -350, relic: false },   // urns[1] — gold
    { x: 160, z: -353, relic: true },    // urns[2] — relic (centered, set back from entry)
  ];
  const urns = urnSpots.map((s) => ({
    x: s.x, z: s.z, group: buildUrn(s.x, s.z, s.relic), looted: false,
  }));

  // ---- exit portal swirl prop (the climb back up to the Frostveil) ----
  const portalMat = new THREE.MeshBasicMaterial({
    color: 0xffb060, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const swirlOut = new THREE.Mesh(new THREE.CircleGeometry(1.3, 24), portalMat);
  swirlOut.position.set(CX, F + 1.9, -344);     // at the exit-portal coords
  group.add(swirlOut);

  scene.add(group);

  return {
    walls: wallBoxes,
    portals: [
      {
        x: 160, z: -344, label: 'Climb back up',
        dest: { x: -340, z: -40, zone: 'frostveil' },
        arriveMsg: 'Cold air, and the aurora pretending it never let you in.',
      },
    ],
    urns,
  };
}
